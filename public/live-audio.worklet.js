class LiveAudioCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const channelData = inputs[0]?.[0]

    if (channelData && channelData.length > 0) {
      this.port.postMessage(channelData.slice())
    }

    return true
  }
}

registerProcessor('live-audio-capture-processor', LiveAudioCaptureProcessor)
