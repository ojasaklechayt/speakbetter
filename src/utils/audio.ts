const TARGET_SAMPLE_RATE = 16000

export function downsampleTo16k(
  samples: Float32Array,
  inputSampleRate: number,
) {
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

export function encodePcm16(samples: Float32Array) {
  const bytes = new ArrayBuffer(samples.length * 2)
  const view = new DataView(bytes)

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]))
    view.setInt16(index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
  }

  return new Uint8Array(bytes)
}

export function getLiveAudioWorkletUrl() {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL('live-audio.worklet.js')
  }

  return '/live-audio.worklet.js'
}
