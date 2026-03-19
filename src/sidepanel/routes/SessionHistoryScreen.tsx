type SessionHistoryScreenProps = {
  onBack?: () => void
}

function SessionHistoryScreen({ onBack }: SessionHistoryScreenProps) {
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
              <p className="text-2xl font-semibold leading-none text-slate-950">0</p>
            </div>
            <div className="flex min-h-24 flex-col justify-between rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Avg confidence</p>
              <p className="text-2xl font-semibold leading-none text-slate-950">--</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[1.6rem] border border-dashed border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">No history</p>
          <p className="mt-3 text-base font-semibold leading-6 text-slate-950">
            Completed sessions will appear here.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Once you finish a meeting session, SpeakBetter can show trends, confidence scores, and
            session breakdowns in this archive.
          </p>
        </section>
      </div>
    </div>
  )
}

export default SessionHistoryScreen
