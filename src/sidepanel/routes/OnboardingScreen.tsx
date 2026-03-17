import { useMemo, useState } from 'react'

import DashboardScreen from './DashboardScreen'
import LiveCoachingScreen from './LiveCoachingScreen'
import MicrophonePermissionScreen from './MicrophonePermissionScreen'
import SessionDetailScreen from './SessionDetailScreen'
import SessionHistoryScreen from './SessionHistoryScreen'
import SettingsScreen from './SettingsScreen'
import { mockSessions } from './mockData'

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
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [touched, setTouched] = useState<Record<keyof FormState, boolean>>({
    name: false,
    password: false,
    googleApiKey: false,
  })

  const errors = useMemo(
    () => ({
      name:
        values.name.trim().length === 0
          ? 'Name is required.'
          : values.name.trim().length < 2
            ? 'Name must be at least 2 characters.'
            : '',
      password:
        values.password.length === 0
          ? 'Password is required.'
          : values.password.length < 6
            ? 'Password must be at least 6 characters.'
            : '',
      googleApiKey:
        values.googleApiKey.trim().length === 0
          ? 'Google API key is required.'
          : values.googleApiKey.trim().length < 20
            ? 'Google API key looks incomplete.'
            : '',
    }),
    [values],
  )

  const ready =
    values.name.trim().length > 0 &&
    values.password.trim().length > 0 &&
    values.googleApiKey.trim().length > 0

  function updateField(field: keyof FormState, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function markTouched(field: keyof FormState) {
    setTouched((current) => ({
      ...current,
      [field]: true,
    }))
  }

  function handleContinue() {
    if (!ready) {
      setTouched({
        name: true,
        password: true,
        googleApiKey: true,
      })
      return
    }

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
            onBlur={() => markTouched('name')}
            error={touched.name ? errors.name : ''}
          />

          <Field
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={values.password}
            placeholder="Enter your password"
            onChange={(value) => updateField('password', value)}
            onBlur={() => markTouched('password')}
            error={touched.password ? errors.password : ''}
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
            onBlur={() => markTouched('googleApiKey')}
            error={touched.googleApiKey ? errors.googleApiKey : ''}
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
  onBlur,
  error,
  action,
}: {
  label: string
  type: string
  value: string
  placeholder: string
  onChange: (value: string) => void
  onBlur: () => void
  error: string
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
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-3 text-sm text-slate-900 outline-none transition ${
          error ? 'border-red-300 focus:border-red-400' : 'border-slate-300 hover:border-slate-400 focus:border-slate-500'
        }`}
      />
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

export default OnboardingScreen
