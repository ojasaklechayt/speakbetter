import type { TranscriptPoint } from '../services/session-manager'

export function groupTranscriptPoints(points: TranscriptPoint[]) {
  const lines: string[] = []
  let currentLine = ''

  for (const point of points) {
    const fragment = normalizeTranscriptFragment(point.point)

    if (!fragment) {
      continue
    }

    currentLine = appendTranscriptFragment(currentLine, fragment)

    if (/[.!?]$/.test(fragment) || currentLine.length >= 120) {
      lines.push(currentLine)
      currentLine = ''
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

export function normalizeTranscriptFragment(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

export function appendTranscriptFragment(currentLine: string, fragment: string) {
  if (!currentLine) {
    return fragment
  }

  if (/^[,.;:!?]/.test(fragment)) {
    return `${currentLine}${fragment}`
  }

  return `${currentLine} ${fragment}`
}
