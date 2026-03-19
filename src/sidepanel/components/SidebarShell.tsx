import OnboardingScreen from '../routes/OnboardingScreen'

function SidebarShell() {
  return (
    <div className="flex h-screen justify-end overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(20,102,114,0.14),_transparent_35%),linear-gradient(180deg,_#f5f0e8_0%,_#efe7db_100%)] text-slate-900">
      <div className="h-full w-full max-w-[390px] border-l border-black/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(248,244,237,0.98))] shadow-[-24px_0_48px_rgba(15,23,42,0.12)] backdrop-blur">
        <OnboardingScreen />
      </div>
    </div>
  )
}

export default SidebarShell
