const GOOGLE_MEET_HOSTNAME = 'meet.google.com'
const GOOGLE_MEET_CODE_PATTERN = /^\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\/.*)?$/i
const MICROPHONE_PERMISSION_PAGE_PATH = 'mic-permission.html'

// Check whether a URL points to a Google Meet room page that can be used for session gating.
function isSupportedMeetingUrl(url?: string) {
  if (!url) {
    return false
  }

  try {
    const parsedUrl = new URL(url)
    return (
      parsedUrl.hostname === GOOGLE_MEET_HOSTNAME &&
      GOOGLE_MEET_CODE_PATTERN.test(parsedUrl.pathname)
    )
  } catch {
    return false
  }
}

// Persist the latest active-tab meeting status so the sidepanel can read a simple boolean.
async function saveMeetingFlag(tab?: chrome.tabs.Tab) {
  const url = tab?.url ?? ''
  const isOnMeetingPage = isSupportedMeetingUrl(url)

  await chrome.storage.local.set({
    currentTabUrl: url,
    isOnMeetingPage,
    isMeetMicrophoneMuted: isOnMeetingPage ? undefined : null,
    meetMicrophoneLabel: isOnMeetingPage ? undefined : '',
  })
}

// Re-read the browser's currently active tab and recompute the meeting flag from that tab's URL.
// This keeps the stored state aligned with whatever page the user is focused on right now.
async function refreshFromActiveTab() {
  const [activeTab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  })

  await saveMeetingFlag(activeTab)
}

// Configure the toolbar icon so clicking it opens the extension sidepanel.
async function enableToolbarSidepanelOpen() {
  await chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true,
  })
}

// Initialize sidepanel toolbar behavior and meeting state when the extension is first installed.
chrome.runtime.onInstalled.addListener(() => {
  void enableToolbarSidepanelOpen()
  void refreshFromActiveTab()
})

// Rebuild toolbar behavior and meeting state when Chrome starts and the service worker wakes up.
chrome.runtime.onStartup.addListener(() => {
  void enableToolbarSidepanelOpen()
  void refreshFromActiveTab()
})

// When the user switches tabs, recompute the meeting flag from the newly active tab.
chrome.tabs.onActivated.addListener(() => {
  void refreshFromActiveTab()
})

// When the active tab changes URL or finishes loading, update the stored meeting flag.
chrome.tabs.onUpdated.addListener((
  _tabId: number,
  changeInfo: chrome.tabs.OnUpdatedInfo,
  tab: chrome.tabs.Tab,
) => {
  // Only the active tab should control whether a session can start.
  if (!tab.active) {
    return
  }

  if (changeInfo.url || changeInfo.status === 'complete') {
    void saveMeetingFlag(tab)
  }
})

// When the user focuses a different browser window, recompute from that window's active tab.
chrome.windows.onFocusChanged.addListener((windowId: number) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    return
  }

  void refreshFromActiveTab()
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'OPEN_MICROPHONE_PERMISSION_PAGE') {
    void chrome.tabs.create({
      url: chrome.runtime.getURL(MICROPHONE_PERMISSION_PAGE_PATH),
      active: true,
    })
      .then(() => {
        sendResponse({ ok: true })
      })
      .catch((error: unknown) => {
        sendResponse({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Microphone permission page could not be opened.',
        })
      })

    return true
  }

  return false
})
