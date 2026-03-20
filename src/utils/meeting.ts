export function getMeetingIdFromUrl(url: string) {
  if (!url) {
    return 'unknown-meeting'
  }

  try {
    const parsedUrl = new URL(url)
    return parsedUrl.pathname.replace(/^\/+/, '') || 'unknown-meeting'
  } catch {
    return 'unknown-meeting'
  }
}
