import type { LiveServerMessage } from '@google/genai'
import type { LiveSessionData } from '../services/session-manager'

export type LiveSessionUpdate = Pick<LiveSessionData, 'insight' | 'watch' | 'metrics'>
const LIVE_SESSION_UPDATE_KEYS = ['insight', 'watch', 'metrics'] as const
const LIVE_SESSION_INSIGHT_KEYS = ['impact', 'title', 'description'] as const
const LIVE_WATCH_ITEM_KEYS = ['title'] as const
const LIVE_METRIC_KEYS = ['label', 'value', 'detail'] as const
const ALLOWED_IMPACTS = new Set(['low', 'medium', 'high', 'neutral'])

export const STORE_LIVE_SESSION_UPDATE_TOOL = {
  name: 'store_live_session_update',
  description:
    'Store the latest structured live coaching update for the active session.',
  parametersJsonSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      insight: {
        type: 'object',
        additionalProperties: false,
        properties: {
          impact: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['impact', 'title', 'description'],
      },
      watch: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
          },
          required: ['title'],
        },
      },
      metrics: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            label: { type: 'string' },
            value: { type: 'string' },
            detail: { type: 'string' },
          },
          required: ['label', 'value', 'detail'],
        },
      },
    },
    required: ['insight', 'watch', 'metrics'],
  },
} as const

export function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`
}

export function extractTextFromServerContent(message: LiveServerMessage) {
  return (
    message.serverContent?.modelTurn?.parts
      ?.map((part) => ('text' in part && typeof part.text === 'string' ? part.text : ''))
      .join('') ?? ''
  )
}

export function parseLiveSessionUpdate(argumentsObject: Record<string, unknown>): LiveSessionUpdate {
  if (!hasExactKeys(argumentsObject, LIVE_SESSION_UPDATE_KEYS)) {
    throw new Error('Live session update must contain only insight, watch, and metrics.')
  }

  const insight = argumentsObject.insight
  const watch = argumentsObject.watch
  const metrics = argumentsObject.metrics

  if (!isInsight(insight) || !isWatchItems(watch) || !isMetrics(metrics)) {
    throw new Error('Invalid live session update payload.')
  }

  return {
    insight: {
      impact: insight.impact.trim().toLowerCase(),
      title: insight.title.trim(),
      description: insight.description.trim(),
    },
    watch: watch.map((item) => ({
      title: item.title.trim(),
    })),
    metrics: metrics.map((item) => ({
      label: item.label.trim(),
      value: item.value.trim(),
      detail: item.detail.trim(),
    })),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function hasExactKeys<T extends readonly string[]>(
  value: Record<string, unknown>,
  expectedKeys: T,
) {
  const actualKeys = Object.keys(value)

  return (
    actualKeys.length === expectedKeys.length &&
    expectedKeys.every((key) => actualKeys.includes(key))
  )
}

function isInsight(value: unknown): value is LiveSessionUpdate['insight'] {
  if (!isRecord(value) || !hasExactKeys(value, LIVE_SESSION_INSIGHT_KEYS)) {
    return false
  }

  return (
    typeof value.impact === 'string' &&
    ALLOWED_IMPACTS.has(value.impact.trim().toLowerCase()) &&
    typeof value.title === 'string' &&
    value.title.trim().length > 0 &&
    typeof value.description === 'string' &&
    value.description.trim().length > 0
  )
}

function isWatchItems(value: unknown): value is LiveSessionUpdate['watch'] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        hasExactKeys(item, LIVE_WATCH_ITEM_KEYS) &&
        typeof item.title === 'string' &&
        item.title.trim().length > 0,
    )
  )
}

function isMetrics(value: unknown): value is LiveSessionUpdate['metrics'] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        isRecord(item) &&
        hasExactKeys(item, LIVE_METRIC_KEYS) &&
        typeof item.label === 'string' &&
        item.label.trim().length > 0 &&
        typeof item.value === 'string' &&
        item.value.trim().length > 0 &&
        typeof item.detail === 'string' &&
        item.detail.trim().length > 0,
    )
  )
}
