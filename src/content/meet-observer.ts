const MUTED_LABEL_MATCHERS = [
  'turn on microphone',
  'unmute microphone',
  'microphone off',
]

const UNMUTED_LABEL_MATCHERS = [
  'turn off microphone',
  'mute microphone',
  'microphone on',
]

let isExtensionContextAlive = true

function isContextValid() {
  try {
    return !!chrome?.runtime?.id
  } catch {
    return false
  }
}

function getMicrophoneButton() {
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('button[aria-label]')
  )

  return buttons.find((button) => {
    const label = button.getAttribute('aria-label')?.toLowerCase() ?? ''
    return label.includes('microphone')
  })
}

function getMutedStateFromLabel(label: string): boolean | null {
  const normalized = label.toLowerCase()

  if (MUTED_LABEL_MATCHERS.some((value) => normalized.includes(value))) {
    return true
  }

  if (UNMUTED_LABEL_MATCHERS.some((value) => normalized.includes(value))) {
    return false
  }

  return null
}

async function safeStorageSet(data: Record<string, unknown>) {
  if (!isExtensionContextAlive || !isContextValid()) {
    return
  }

  try {
    await chrome.storage.local.set(data)
  } catch (error) {
    isExtensionContextAlive = false
    cleanup()
    console.warn('Extension context invalidated. Stopping Meet observer.', error)
  }
}

async function syncMeetMuteState() {
  if (!isExtensionContextAlive || !isContextValid()) {
    return
  }

  const microphoneButton = getMicrophoneButton()
  const label = microphoneButton?.getAttribute('aria-label') ?? ''
  const isMeetMicrophoneMuted = label ? getMutedStateFromLabel(label) : null

  await safeStorageSet({
    isMeetMicrophoneMuted,
    meetMicrophoneLabel: label,
  })
}

const observer = new MutationObserver(() => {
  if (!isExtensionContextAlive || !isContextValid()) {
    return
  }

  void syncMeetMuteState()
})

function handleDocumentClick() {
  if (!isExtensionContextAlive || !isContextValid()) {
    return
  }

  window.setTimeout(() => {
    if (!isExtensionContextAlive || !isContextValid()) {
      return
    }

    void syncMeetMuteState()
  }, 0)
}

function cleanup() {
  observer.disconnect()
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('pagehide', cleanup)
}

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['aria-label', 'data-is-muted'],
  childList: true,
  subtree: true,
})

document.addEventListener('click', handleDocumentClick)
window.addEventListener('pagehide', cleanup)

void syncMeetMuteState()