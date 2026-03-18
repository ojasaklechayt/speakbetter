import { mockSessions, type SessionRecord } from './mockData'

type SessionDetailScreenProps = {
  sessionId: string
  onBack?: () => void
}

function SessionDetailScreen({ sessionId, onBack }: SessionDetailScreenProps) {
  const session = mockSessions.find((item) => item.id === sessionId) ?? mockSessions[0]
  const improvementMoments = buildImprovementMoments(session)

  return (
    <div className="flex h-full flex-col bg-[#fcfaf7]">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Session detail
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">{session.title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {session.time} • {session.duration} • Google Meet • Completed
            </p>
            <p className="mt-2 break-all text-xs text-slate-500">{session.meetLink}</p>
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
          <div className="grid grid-cols-[minmax(0,1fr)_96px] items-start gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Session verdict</p>
              <p className="mt-3 text-base font-medium leading-7 text-slate-900">{session.verdict}</p>
            </div>
            <div className="rounded-2xl bg-slate-950 px-3 py-4 text-center text-white">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-300">Confidence</p>
              <p className="mt-2 text-3xl font-semibold leading-none">{session.confidence}</p>
            </div>
          </div>
        </section>

        <section className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Metrics
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <MetricCard label="Total fillers" value={session.fillers} />
            <MetricCard label="Fillers per min" value={session.fillersPerMinute} />
            <MetricCard label="Average pause" value={session.averagePause} />
            <MetricCard label="Longest pause" value={session.longestPause} />
            <MetricCard label="Average WPM" value={session.pace} />
            <MetricCard label="Hesitations" value={session.hesitationCount} />
          </div>
        </section>

        <section className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Major points
          </p>
          <div className="mt-2 space-y-2">
          {improvementMoments.map((moment) => (
            <ImprovementMomentCard
              key={moment.detail}
              detail={moment.detail}
              example={moment.example}
            />
          ))}
          </div>
        </section>

        <TwoColumnLists session={session} />

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-950">Transcript excerpts</p>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
            {session.transcript.map((line, index) => (
              <p key={`${line}-${index}`}>{line}</p>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className="text-lg font-semibold leading-none text-slate-950">{value}</p>
      </div>
    </div>
  )
}

function ImprovementMomentCard({
  detail,
  example,
}: {
  detail: string
  example: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-sm font-medium leading-6 text-slate-900">{detail}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">"{example}"</p>
    </div>
  )
}

function buildImprovementMoments(session: SessionRecord) {
  return [
    {
      detail: session.actions[0] ?? 'Lead with the answer first.',
      example: session.transcript[0] ?? '',
    },
    {
      detail: session.weaknesses[0] ?? 'Trim setup language.',
      example: session.transcript[1] ?? session.transcript[0] ?? '',
    },
    {
      detail: session.actions[1] ?? 'End with a firmer takeaway.',
      example: session.transcript[2] ?? session.transcript[1] ?? '',
    },
  ]
}

function TwoColumnLists({ session }: { session: SessionRecord }) {
  return (
    <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-950">Strengths</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          {session.strengths.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-950">Next steps</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          {session.actions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-2">
        <p className="text-sm font-semibold text-slate-950">Needs work</p>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          {session.weaknesses.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default SessionDetailScreen
