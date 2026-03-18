import { mockSessions } from './mockData'

type SessionHistoryScreenProps = {
  onBack?: () => void
  onOpenSessionDetail?: (sessionId: string) => void
}

function SessionHistoryScreen({ onBack, onOpenSessionDetail }: SessionHistoryScreenProps) {
  const sessionCount = mockSessions.length
  const averageConfidence = Math.round(
    mockSessions.reduce((total, session) => total + Number(session.confidence), 0) / sessionCount,
  )

  return (
    <div className="flex h-full flex-col bg-[#fcfaf7]">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Session archive
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Session History</h1>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:scale-[0.98]"
          >
            Back
          </button>
        </header>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex min-h-24 flex-col justify-between rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Sessions</p>
              <p className="text-2xl font-semibold leading-none text-slate-950">{sessionCount}</p>
            </div>
            <div className="flex min-h-24 flex-col justify-between rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Avg confidence</p>
              <p className="text-2xl font-semibold leading-none text-slate-950">{averageConfidence}</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[1.6rem] border border-amber-200 bg-[linear-gradient(135deg,#fff7df_0%,#fffdf7_52%,#ffffff_100%)] p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Hot tip</p>
          <p className="mt-3 text-base font-semibold leading-6 text-slate-950">
            Lead with the answer in your first sentence, then add context after.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Your recent sessions are strongest when pacing stays steady. The clearest improvement
            area is shortening setup phrases and long pauses before key points.
          </p>
        </section>

        <section className="mt-5 space-y-5">
          <HistoryGroup
            title="Today"
            sessionIds={['session-1']}
            onOpenSessionDetail={onOpenSessionDetail}
          />
          <HistoryGroup
            title="This week"
            sessionIds={['session-2']}
            onOpenSessionDetail={onOpenSessionDetail}
          />
          <HistoryGroup
            title="Earlier"
            sessionIds={['session-3']}
            onOpenSessionDetail={onOpenSessionDetail}
          />
        </section>
      </div>
    </div>
  )
}

function HistoryGroup({
  title,
  sessionIds,
  onOpenSessionDetail,
}: {
  title: string
  sessionIds: string[]
  onOpenSessionDetail?: (sessionId: string) => void
}) {
  const sessions = mockSessions.filter((session) => sessionIds.includes(session.id))

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-slate-950">{title}</h2>
      <div className="space-y-3">
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => onOpenSessionDetail?.(session.id)}
            className="block w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md active:translate-y-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{session.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {session.time} • {session.duration}
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {session.confidence}
              </div>
            </div>
            <div className="mt-3 flex gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">Fillers {session.fillers}</span>
              <span className="rounded-full bg-slate-100 px-2 py-1">{session.pace}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{session.feedback}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SessionHistoryScreen
