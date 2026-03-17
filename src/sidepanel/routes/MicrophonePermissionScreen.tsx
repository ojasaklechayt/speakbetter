type MicrophonePermissionScreenProps = {
  onAllow?: () => void
  onBack?: () => void
}

function MicrophonePermissionScreen({
  onAllow,
  onBack,
}: MicrophonePermissionScreenProps) {
  return (
    <div className="flex h-full flex-col px-5 py-6">
      <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center">
        <header>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Permission
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">Allow microphone access</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            SpeakBetter listens only after you explicitly start a session and stops when the session ends.
          </p>
        </header>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl">
            Mic
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            SpeakBetter analyzes your speaking patterns in real time from your microphone input during the session.
          </p>
          <button
            type="button"
            onClick={onAllow}
            className="mt-5 w-full cursor-pointer rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
          >
            Allow microphone
          </button>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-950">Privacy</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>Recording does not start automatically.</li>
            <li>SpeakBetter stays in the sidebar and does not inject into Meet.</li>
            <li>Session data stays local in the extension for now.</li>
          </ul>
        </section>

        <div className="mt-5">
          <button
            type="button"
            onClick={onBack}
            className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 active:scale-[0.99]"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default MicrophonePermissionScreen
