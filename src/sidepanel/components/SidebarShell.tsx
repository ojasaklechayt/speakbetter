import OnboardingScreen from '../routes/OnboardingScreen'

function SidebarShell() {
  return (
    <div className="flex h-screen justify-end overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(20,102,114,0.14),_transparent_35%),linear-gradient(180deg,_#f5f0e8_0%,_#efe7db_100%)] text-slate-900">
      <main className="hidden min-w-0 flex-1 lg:flex">
        <div className="flex w-full items-center px-10 py-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-[#0f5d63]/15 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0f5d63]">
              SpeakBetter
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-[-0.04em] text-slate-950">
              Live speaking coaching that stays beside your meeting, not inside it.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              SpeakBetter helps you improve clarity, pacing, and confidence during meetings through a
              dedicated Chrome sidebar. Start a session when you are ready, get live coaching, and
              review your progress after the call.
            </p>

            <div className="mt-8 grid max-w-xl gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-black/5 bg-white/70 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                <p className="text-sm font-semibold text-slate-950">During meetings</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  See live guidance while staying focused on the conversation.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/70 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                <p className="text-sm font-semibold text-slate-950">After sessions</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Review what improved and what still needs work.
                </p>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/70 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                <p className="text-sm font-semibold text-slate-950">Private by default</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Coaching starts only when you choose to begin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="h-full w-full max-w-[390px] border-l border-black/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(248,244,237,0.98))] shadow-[-24px_0_48px_rgba(15,23,42,0.12)] backdrop-blur">
        <OnboardingScreen />
      </div>
    </div>
  )
}

export default SidebarShell
