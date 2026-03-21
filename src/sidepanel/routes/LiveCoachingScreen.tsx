import { useEffect, useState } from 'react'
import {
  googleService,
  liveAudioService,
  liveSessionService,
} from '../../services'
import type {
  CommunicationSession,
  LiveSessionMetric,
  LiveWatchItem,
} from '../../services/session-manager'
import { groupTranscriptPoints } from '../../utils/transcript'

type LiveCoachingScreenProps = {
  sessionId?: string
  onStop?: () => void
}

type ExtensionLiveState = {
  currentTabUrl: string
  isOnMeetingPage: boolean
}

function LiveCoachingScreen({ sessionId, onStop }: LiveCoachingScreenProps) {
  const [extensionState, setExtensionState] = useState<ExtensionLiveState>({
    currentTabUrl: '',
    isOnMeetingPage: false,
  })
  const [audioCaptureError, setAudioCaptureError] = useState('')
  const [session, setSession] = useState<CommunicationSession | null>(null)

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return
    }

    let active = true

    async function loadExtensionState() {
      const stored = await chrome.storage.local.get([
        'currentTabUrl',
        'isOnMeetingPage',
      ])

      if (!active) {
        return
      }

      setExtensionState({
        currentTabUrl:
          typeof stored.currentTabUrl === 'string' ? stored.currentTabUrl : '',
        isOnMeetingPage: stored.isOnMeetingPage === true,
      })
    }

    function handleStorageChange(
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) {
      if (areaName !== 'local') {
        return
      }

      setExtensionState((current) => ({
        currentTabUrl:
          typeof changes.currentTabUrl?.newValue === 'string'
            ? changes.currentTabUrl.newValue
            : current.currentTabUrl,
        isOnMeetingPage:
          typeof changes.isOnMeetingPage?.newValue === 'boolean'
            ? changes.isOnMeetingPage.newValue
            : current.isOnMeetingPage,
      }))
    }

    void loadExtensionState()
    chrome.storage.onChanged.addListener(handleStorageChange)

    return () => {
      active = false
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  useEffect(() => {
    if (!sessionId) {
      setSession(null)
      return
    }

    return liveSessionService.subscribeSession(sessionId, setSession)
  }, [sessionId])

  useEffect(() => {
    let active = true

    async function startLiveAudio() {
      try {
        await liveAudioService.start({
          chunkMs: 5000,
          onChunk: (chunk) => {
            googleService.sendAudioChunk(chunk)
          },
        })

        if (!active) {
          await liveAudioService.stop()
        }
      } catch (error) {
        if (!active) {
          return
        }

        setAudioCaptureError(
          error instanceof Error ? error.message : 'Microphone capture could not be started.',
        )
      }
    }

    void startLiveAudio()

    return () => {
      active = false
      void liveAudioService.stop()
    }
  }, [])

  const insight = session?.liveSession.insight
  const liveMetrics = session?.liveSession.metrics ?? []
  const watchItems = session?.liveSession.watch ?? []
  const transcriptLines = groupTranscriptPoints(session?.liveSession.transcript ?? [])

  const coachingStatus =
    audioCaptureError
      ? audioCaptureError
      : insight?.description
      ? insight.description
      : extensionState.isOnMeetingPage === false
      ? 'Open Google Meet to begin the live coaching session.'
      : 'Monitoring your session and waiting for coaching signals.'

  const insightImpactClassName =
    insight?.impact === 'high'
      ? 'bg-red-50 text-red-700 ring-red-200'
      : insight?.impact === 'medium'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-emerald-50 text-emerald-700 ring-emerald-200'

  function handleStop() {
    void liveAudioService.stop()
    googleService.disconnect()
    onStop?.()
  }

  return (
    <div className="relative flex h-full flex-col bg-[#fcfaf7] text-slate-900">
      <div className="flex-1 overflow-y-auto px-5 pb-24 pt-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Recording live
            </div>
            <h1 className="mt-3 text-xl font-semibold text-slate-950">Session in progress</h1>
            <p className="mt-1 text-sm text-slate-500">
              {extensionState.currentTabUrl || 'Waiting for active meeting tab.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleStop}
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
          >
            Stop
          </button>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Right now</p>
          </div>
          <div className={`mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${insightImpactClassName}`}>
            {insight?.impact ? `${insight.impact} impact` : 'Waiting for coaching'}
          </div>
          <p className="mt-3 text-base font-semibold leading-6 text-slate-950">
            {insight?.title || 'Live coaching is active.'}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {coachingStatus}
          </p>
        </section>

        <section className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Also watch
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
            {watchItems.length > 0 ? (
              watchItems.map((item: LiveWatchItem) => (
                <span
                  key={item.title}
                  className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200"
                >
                  {item.title}
                </span>
              ))
            ) : (
              <span className="rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">
                Waiting for watch items
              </span>
            )}
          </div>
        </section>

        <section className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Metrics
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {liveMetrics.length > 0 ? (
              liveMetrics.map((metric: LiveSessionMetric) => (
                <LiveMetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  detail={metric.detail}
                />
              ))
            ) : (
              <LiveMetricCard
                label="Waiting"
                value="--"
                detail="Metrics will appear after the model stores a live update."
              />
            )}
          </div>
        </section>

        <section className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Transcript
          </p>
          <div className="mt-2 space-y-2">
            {transcriptLines.length > 0 ? (
              transcriptLines
                .slice(-6)
                .map((point: string, index: number) => (
                  <div
                    key={`${index}-${point}`}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
                  >
                    <p className="text-sm leading-6 text-slate-700">{point}</p>
                  </div>
                ))
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <p className="text-sm leading-6 text-slate-500">
                  Transcript will appear once microphone audio is transcribed.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 bg-[#fcfaf7]/95 px-5 py-4 backdrop-blur">
        <button
          type="button"
          onClick={handleStop}
          className="w-full cursor-pointer rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
        >
          Stop Coaching
        </button>
      </div>
    </div>
  )
}

function LiveMetricCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        </div>
        <p className="text-lg font-semibold leading-none text-slate-950">{value}</p>
      </div>
      <p className="mt-1 truncate text-[11px] text-slate-500">{detail}</p>
    </div>
  )
}

export default LiveCoachingScreen
