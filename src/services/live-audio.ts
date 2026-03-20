type LiveAudioOptions = {
  chunkMs?: number
  onChunk: (chunk: Uint8Array) => void
}

const DEFAULT_CHUNK_MS = 5000
const TARGET_SAMPLE_RATE = 16000

export class LiveAudioService {
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private sourceNode: MediaStreamAudioSourceNode | null = null
  private processorNode: AudioWorkletNode | null = null
  private sinkNode: GainNode | null = null
  private readonly sampleChunks: Float32Array[] = []
  private bufferedSamples = 0
  private readOffset = 0
  private chunkSizeInSamples = 0
  private onChunk: ((chunk: Uint8Array) => void) | null = null

  // This is the entry point for live microphone capture.
  //
  // What comes in from the browser:
  // - A MediaStream produced by getUserMedia()
  // - Audio frames as Float32 samples in the browser's native sample rate
  //
  // What we want to hand to Gemini later:
  // - Audio grouped into roughly 5 second chunks
  // - 16 kHz mono PCM16 bytes
  //
  // So this method sets up the capture graph only. It does not encode anything yet.
  // It just starts collecting raw float samples from the microphone.
  async start(options: LiveAudioOptions) {
    if (this.mediaStream || this.audioContext) {
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone access is not available in this browser context.')
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

    const audioContext = new AudioContext()
    // AudioWorklet is the modern replacement for ScriptProcessorNode.
    //
    // ScriptProcessorNode used to be the simple way to read microphone frames in
    // browser code, but it is deprecated because its processing runs on the main
    // thread and can glitch under UI load. AudioWorklet moves the capture callback
    // to the audio rendering side, which is the right primitive for continuous
    // realtime audio pipelines like this one.
    //
    // The worklet runs on the audio rendering side and gives us small microphone
    // frames with lower latency and better long-term browser support. We still do
    // chunking/downsampling/PCM conversion in this file on the main thread because
    // that logic is simpler to reason about and easier to debug.
    await audioContext.audioWorklet.addModule(
      getLiveAudioWorkletUrl(),
    )

    const sourceNode = audioContext.createMediaStreamSource(stream)
    const processorNode = new AudioWorkletNode(
      audioContext,
      'live-audio-capture-processor',
      {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 1,
      },
    )
    const sinkNode = audioContext.createGain()
    // The worklet node needs to stay connected in the audio graph to keep receiving
    // audio frames. But we do not want to play the live microphone back through the
    // speakers, because that would create audible monitoring/echo.
    //
    // A zero-gain sink keeps the graph active while making it silent.
    sinkNode.gain.value = 0

    this.mediaStream = stream
    this.audioContext = audioContext
    this.sourceNode = sourceNode
    this.processorNode = processorNode
    this.sinkNode = sinkNode
    this.onChunk = options.onChunk
    this.chunkSizeInSamples = Math.max(
      1,
      Math.round((audioContext.sampleRate * (options.chunkMs ?? DEFAULT_CHUNK_MS)) / 1000),
    )

    // The worklet posts microphone frames as Float32Array samples.
    //
    // Each message here is only a small slice of audio, not a 5 second chunk yet.
    // We append the slice to our in-memory sample buffer and then check whether we
    // have accumulated enough samples to emit one complete chunk.
    processorNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
      this.pushSamples(event.data)
      this.flushFullChunks(audioContext.sampleRate)
    }

    sourceNode.connect(processorNode)
    processorNode.connect(sinkNode)
    sinkNode.connect(audioContext.destination)

    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }
  }

  async stop() {
    // If the user stops mid-chunk, we still want to send the remaining buffered
    // audio instead of dropping it on the floor. This makes stop behavior feel
    // complete: the last bit of speech still gets forwarded to Gemini.
    if (this.audioContext) {
      this.flushRemainingSamples(this.audioContext.sampleRate)
    }

    this.processorNode?.port.close()
    this.processorNode?.disconnect()
    this.sourceNode?.disconnect()
    this.sinkNode?.disconnect()
    this.mediaStream?.getTracks().forEach((track) => track.stop())

    if (this.audioContext) {
      await this.audioContext.close()
    }

    this.processorNode = null
    this.sourceNode = null
    this.sinkNode = null
    this.mediaStream = null
    this.audioContext = null
    this.onChunk = null
    this.sampleChunks.length = 0
    this.bufferedSamples = 0
    this.readOffset = 0
    this.chunkSizeInSamples = 0
  }

  private pushSamples(samples: Float32Array) {
    // We keep the raw frames exactly as the worklet gives them to us and just
    // remember how many samples are buffered in total. Actual chunk assembly is
    // deferred until flushFullChunks()/flushRemainingSamples().
    this.sampleChunks.push(samples)
    this.bufferedSamples += samples.length
  }

  // Once we have enough raw samples to fill one configured chunk window, emit it
  // immediately. This is how "roughly every 5 seconds" works in practice.
  //
  // Example:
  // - browser sample rate = 48,000 Hz
  // - chunk size = 5 s
  // - chunkSizeInSamples = 240,000
  //
  // Small worklet frames keep arriving, we append them, and as soon as the total
  // buffered sample count reaches 240,000 we cut one chunk and encode it.
  private flushFullChunks(inputSampleRate: number) {
    while (this.bufferedSamples >= this.chunkSizeInSamples) {
      const samples = this.consumeSamples(this.chunkSizeInSamples)
      this.emitChunk(samples, inputSampleRate)
    }
  }

  private flushRemainingSamples(inputSampleRate: number) {
    // Used only during stop(). If we buffered 2.3 seconds instead of a full 5
    // seconds, we still emit that partial chunk so the end of the user's speech
    // is preserved.
    if (this.bufferedSamples === 0) {
      return
    }

    const samples = this.consumeSamples(this.bufferedSamples)
    this.emitChunk(samples, inputSampleRate)
  }

  private consumeSamples(sampleCount: number) {
    // The internal buffer is stored as many small Float32Array frames because that
    // is how the worklet delivers audio. This method stitches those small frames
    // into one contiguous Float32Array of exactly sampleCount samples.
    //
    // readOffset tracks where we are inside the first buffered frame so we can
    // consume partial frames without copying more than necessary.
    const output = new Float32Array(sampleCount)
    let writeOffset = 0

    while (writeOffset < sampleCount && this.sampleChunks.length > 0) {
      const currentChunk = this.sampleChunks[0]
      const availableSamples = currentChunk.length - this.readOffset
      const samplesToCopy = Math.min(sampleCount - writeOffset, availableSamples)

      output.set(
        currentChunk.subarray(this.readOffset, this.readOffset + samplesToCopy),
        writeOffset,
      )

      writeOffset += samplesToCopy
      this.readOffset += samplesToCopy
      this.bufferedSamples -= samplesToCopy

      if (this.readOffset >= currentChunk.length) {
        this.sampleChunks.shift()
        this.readOffset = 0
      }
    }

    return output
  }

  // Gemini expects audio bytes in a specific format. The browser does not give us
  // that format directly.
  //
  // Browser gives us:
  // - Float32 samples
  // - native sample rate such as 44.1 kHz or 48 kHz
  //
  // Gemini wants:
  // - 16 kHz
  // - PCM16 bytes
  //
  // So each chunk is transformed in two steps:
  // 1. downsampleTo16k(): reduce the sample rate to 16 kHz
  // 2. encodePcm16(): convert floats in [-1, 1] to signed 16-bit little-endian bytes
  private emitChunk(samples: Float32Array, inputSampleRate: number) {
    const downsampled = downsampleTo16k(samples, inputSampleRate)
    const pcm16 = encodePcm16(downsampled)
    this.onChunk?.(pcm16)
  }
}

// Convert from the browser's sample rate to 16 kHz.
//
// This implementation uses simple averaging over sample windows. It is not a
// studio-grade resampler, but it is lightweight and good enough for speech input.
// The goal here is compatibility with Gemini's expected live-audio payload shape,
// not perfect audio fidelity.
//
// Example:
// - input sample rate = 48,000 Hz
// - target sample rate = 16,000 Hz
// - ratio = 3
// - every 3 input samples become roughly 1 output sample
function downsampleTo16k(samples: Float32Array, inputSampleRate: number) {
  if (inputSampleRate === TARGET_SAMPLE_RATE) {
    return samples
  }

  const ratio = inputSampleRate / TARGET_SAMPLE_RATE
  const outputLength = Math.max(1, Math.round(samples.length / ratio))
  const output = new Float32Array(outputLength)
  let outputIndex = 0
  let inputIndex = 0

  while (outputIndex < outputLength) {
    const nextInputIndex = Math.min(
      samples.length,
      Math.round((outputIndex + 1) * ratio),
    )

    let sum = 0
    let count = 0

    for (let index = inputIndex; index < nextInputIndex; index += 1) {
      sum += samples[index]
      count += 1
    }

    output[outputIndex] = count > 0 ? sum / count : samples[inputIndex] ?? 0
    outputIndex += 1
    inputIndex = nextInputIndex
  }

  return output
}

// Convert normalized floats into PCM16 bytes.
//
// Browser audio samples are floats, usually between -1 and 1.
// PCM16 stores each sample as a signed 16-bit integer:
// -1 maps near -32768
// +1 maps near  32767
//
// Gemini expects raw bytes, so we clamp each float to the valid range and write
// it into a little-endian Int16 buffer.
function encodePcm16(samples: Float32Array) {
  const bytes = new ArrayBuffer(samples.length * 2)
  const view = new DataView(bytes)

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]))
    view.setInt16(index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
  }

  return new Uint8Array(bytes)
}

function getLiveAudioWorkletUrl() {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL('live-audio.worklet.js')
  }

  return '/live-audio.worklet.js'
}

export const liveAudioService = new LiveAudioService()
