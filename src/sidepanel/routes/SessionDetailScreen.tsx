type SessionDetailScreenProps = {
  sessionId: string
  onBack?: () => void
}

function SessionDetailScreen({ sessionId, onBack }: SessionDetailScreenProps) {
  return (
    <div className="flex h-full flex-col bg-[#fcfaf7]">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Session detail
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">No session selected</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Session insights will appear here after you complete a meeting.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 active:scale-[0.98]"
          >
            Back
          </button>
        </header>

        <section className="mt-5 rounded-[1.8rem] border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-950">No completed session data</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Start a meeting session, stop coaching when you are done, and this screen can show your
            verdict, transcript excerpts, strengths, and next steps.
          </p>
          {sessionId ? (
            <p className="mt-3 text-xs text-slate-500">Requested session id: {sessionId}</p>
          ) : null}
        </section>
      </div>
    </div>
  )
}

export default SessionDetailScreen
