import { useEffect, useState } from 'react'

import DashboardScreen from './DashboardScreen'
import LiveCoachingScreen from './LiveCoachingScreen'
import MicrophonePermissionScreen from './MicrophonePermissionScreen'
import SessionDetailScreen from './SessionDetailScreen'
import SessionHistoryScreen from './SessionHistoryScreen'
import SettingsScreen from './SettingsScreen'
import { mockSessions } from './mockData'
import { sessionManager } from '../../services'

type FormState = {
  name: string
  password: string
  googleApiKey: string
}

function OnboardingScreen() {
  const [screen, setScreen] = useState<
    'onboarding' | 'dashboard' | 'microphone' | 'live' | 'history' | 'detail' | 'settings'
  >('onboarding')
  const [previousScreen, setPreviousScreen] = useState<'dashboard' | 'history'>('dashboard')
  const [selectedSessionId, setSelectedSessionId] = useState<string>(mockSessions[0].id)
  const [values, setValues] = useState<FormState>({
    name: '',
    password: '',
    googleApiKey: '',
  })
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const ready =
    values.name.trim().length > 0 &&
    values.password.trim().length > 0 &&
    values.googleApiKey.trim().length > 0

  useEffect(() => {
    let cancelled = false

    async function loadAuthState() {
      const loggedIn = await sessionManager.isLoggedIn()

      if (cancelled) {
        return
      }

      if (loggedIn) {
        setSubmitted(true)
        setScreen('dashboard')
      } else {
        setSubmitted(false)
        setScreen('onboarding')
      }

      setIsCheckingAuth(false)
    }

    void loadAuthState()

    return () => {
      cancelled = true
    }
  }, [])

  function updateField(field: keyof FormState, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleContinue() {
    if (!ready) {
      return
    }

    await sessionManager.setAuth({
      username: values.name.trim(),
      password: values.password,
      apiKey: values.googleApiKey.trim(),
    })

    setSubmitted(true)
    setScreen('dashboard')
  }

  if (submitted && screen === 'dashboard') {
    return (
      <DashboardScreen
        onStartSession={() => setScreen('microphone')}
        onOpenHistory={() => setScreen('history')}
        onOpenSettings={() => setScreen('settings')}
        onOpenSessionDetail={(sessionId) => {
          setSelectedSessionId(sessionId)
          setPreviousScreen('dashboard')
          setScreen('detail')
        }}
      />
    )
  }

  if (submitted && screen === 'microphone') {
    return (
      <MicrophonePermissionScreen
        onAllow={() => setScreen('live')}
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  if (submitted && screen === 'live') {
    return (
      <LiveCoachingScreen
        onStop={() => {
          setSelectedSessionId(mockSessions[0].id)
          setPreviousScreen('dashboard')
          setScreen('detail')
        }}
      />
    )
  }

  if (submitted && screen === 'history') {
    return (
      <SessionHistoryScreen
        onBack={() => setScreen('dashboard')}
        onOpenSessionDetail={(sessionId) => {
          setSelectedSessionId(sessionId)
          setPreviousScreen('history')
          setScreen('detail')
        }}
      />
    )
  }

  if (submitted && screen === 'detail') {
    return (
      <SessionDetailScreen
        sessionId={selectedSessionId}
        onBack={() => setScreen(previousScreen)}
      />
    )
  }

  if (submitted && screen === 'settings') {
    return <SettingsScreen onBack={() => setScreen('dashboard')} />
  }

  if (isCheckingAuth) {
    return (
      <div className="flex h-full items-center justify-center px-5 py-6 text-sm text-slate-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col px-5 py-6">
      <div className="mx-auto flex w-full max-w-[360px] flex-1 flex-col justify-center">
        <header>
          <h1 className="text-2xl font-semibold text-slate-950">Set up SpeakBetter</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            SpeakBetter helps you improve how you speak in meetings with live coaching in a Chrome side panel.
          </p>
        </header>

        <div className="mt-6 space-y-4">
          <Field
            label="Name"
            type="text"
            value={values.name}
            placeholder="Enter your name"
            onChange={(value) => updateField('name', value)}
          />

          <Field
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={values.password}
            placeholder="Enter your password"
            onChange={(value) => updateField('password', value)}
            action={
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="cursor-pointer text-xs font-medium text-slate-500 transition hover:text-slate-700 active:text-slate-900"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            }
          />

          <Field
            label="Google API Key"
            type={showApiKey ? 'text' : 'password'}
            value={values.googleApiKey}
            placeholder="Enter your Google API key"
            onChange={(value) => updateField('googleApiKey', value)}
            action={
              <button
                type="button"
                onClick={() => setShowApiKey((current) => !current)}
                className="cursor-pointer text-xs font-medium text-slate-500 transition hover:text-slate-700 active:text-slate-900"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            }
          />
        </div>

        <div className="pt-5">
          <button
            type="button"
            onClick={handleContinue}
            disabled={!ready}
            className={`w-full rounded-lg px-4 py-3 text-sm font-medium ${
              ready
                ? 'cursor-pointer bg-slate-900 text-white transition hover:bg-slate-800 active:scale-[0.99]'
                : 'cursor-not-allowed bg-slate-200 text-slate-500'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  type,
  value,
  placeholder,
  onChange,
  action,
}: {
  label: string
  type: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  action?: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-800">{label}</label>
        {action}
      </div>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm text-slate-900 outline-none transition hover:border-slate-400 focus:border-slate-500"
      />
    </div>
  )
}

export default OnboardingScreen
