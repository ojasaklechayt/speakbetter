type SettingsScreenProps = {
  onBack?: () => void
}

function SettingsScreen({ onBack }: SettingsScreenProps) {
  return (
    <div className="flex h-full flex-col bg-[#fcfaf7]">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Control
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">Settings</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage your profile, key, and local session data.
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

        <SettingsCard title="Profile" description="Update the identity used across your session history.">
          <Field label="Name" value="ojas" />
          <Field label="Role" value="Founder" />
        </SettingsCard>

        <SettingsCard title="Provider" description="Google API key powers the coaching experience.">
          <Field label="Provider" value="Google Gemini" />
          <Field label="API key status" value="Configured" />
        </SettingsCard>

        <SettingsCard title="Recording and privacy" description="Coaching starts only after explicit user action.">
          <ul className="space-y-2 text-sm leading-6 text-slate-600">
            <li>Microphone access is requested when a session starts.</li>
            <li>SpeakBetter stays in the sidebar and does not inject into the meeting UI.</li>
            <li>Session history is stored locally in the extension.</li>
          </ul>
        </SettingsCard>

        <SettingsCard title="Data management" description="Safe export first, destructive actions separated below.">
          <div className="space-y-3">
            <button
              type="button"
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
            >
              Export sessions JSON
            </button>
            <button
              type="button"
              className="w-full cursor-pointer rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition hover:border-red-300 hover:bg-red-100 active:scale-[0.99]"
            >
              Clear local data
            </button>
          </div>
        </SettingsCard>
      </div>
    </div>
  )
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-900">{value}</p>
    </div>
  )
}

export default SettingsScreen
