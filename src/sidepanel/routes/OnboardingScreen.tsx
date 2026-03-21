import { useEffect, useState } from 'react'

import DashboardScreen from './DashboardScreen'
import LiveCoachingScreen from './LiveCoachingScreen'
import SessionHistoryScreen from './SessionHistoryScreen'
import SettingsScreen from './SettingsScreen'
import { googleService, liveSessionService, sessionManager } from '../../services'
import { getMeetingIdFromUrl } from '../../utils/meeting'

type MeetingGateState = {
  currentTabUrl: string
  isOnMeetingPage: boolean
}

type MicrophonePermissionState = 'granted' | 'unknown'

type FormState = {
  name: string
  password: string
  googleApiKey: string
}

function OnboardingScreen() {
  const [screen, setScreen] = useState<
    'onboarding' | 'dashboard' | 'live' | 'history' | 'settings'
  >('onboarding')
  const [values, setValues] = useState<FormState>({
    name: '',
    password: '',
    googleApiKey: '',
  })
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [meetingGate, setMeetingGate] = useState<MeetingGateState>({
    currentTabUrl: '',
    isOnMeetingPage: false,
  })
  const [microphonePermissionState, setMicrophonePermissionState] =
    useState<MicrophonePermissionState>('unknown')
  const [isWaitingForMicrophonePermission, setIsWaitingForMicrophonePermission] =
    useState(false)
  const [startSessionError, setStartSessionError] = useState('')
  const [activeSessionId, setActiveSessionId] = useState('')

  const ready =
    values.name.trim().length > 0 &&
    values.password.trim().length > 0 &&
    values.googleApiKey.trim().length > 0

  useEffect(() => {
    let cancelled = false

    async function loadAuthState() {
      const auth = await sessionManager.getAuth()

      if (cancelled) {
        return
      }

      if (auth?.apiKey) {
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

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage?.local) {
      return
    }

    let active = true

    async function loadExtensionState() {
      const stored = await chrome.storage.local.get([
        'currentTabUrl',
        'isOnMeetingPage',
        'microphonePermissionState',
        'microphonePermissionGrantedAt',
      ])

      if (!active) {
        return
      }

      setMeetingGate({
        currentTabUrl:
          typeof stored.currentTabUrl === 'string' ? stored.currentTabUrl : '',
        isOnMeetingPage: stored.isOnMeetingPage === true,
      })
      setMicrophonePermissionState(
        stored.microphonePermissionState === 'granted' ? 'granted' : 'unknown',
      )
    }

    function handleStorageChange(
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string,
    ) {
      if (areaName !== 'local') {
        return
      }

      setMeetingGate((current) => ({
        currentTabUrl:
          typeof changes.currentTabUrl?.newValue === 'string'
            ? changes.currentTabUrl.newValue
            : current.currentTabUrl,
        isOnMeetingPage:
          typeof changes.isOnMeetingPage?.newValue === 'boolean'
            ? changes.isOnMeetingPage.newValue
            : current.isOnMeetingPage,
      }))

      if (changes.microphonePermissionState?.newValue === 'granted') {
        setMicrophonePermissionState('granted')
      }

      const grantedSignalChanged =
        typeof changes.microphonePermissionGrantedAt?.newValue === 'number'

      if (
        isWaitingForMicrophonePermission &&
        (
          changes.microphonePermissionState?.newValue === 'granted' ||
          grantedSignalChanged
        )
      ) {
        void connectToLiveSession()
      }
    }

    void loadExtensionState()
    chrome.storage.onChanged.addListener(handleStorageChange)

    return () => {
      active = false
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [isWaitingForMicrophonePermission])

  useEffect(() => {
    return () => {
      googleService.disconnect()
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

  function handleLogout() {
    googleService.disconnect()
    googleService.setHandlers({})
    if (activeSessionId) {
      void liveSessionService.stop(activeSessionId)
    }
    setSubmitted(false)
    setScreen('onboarding')
    setIsWaitingForMicrophonePermission(false)
    setStartSessionError('')
    setActiveSessionId('')
    setValues({
      name: '',
      password: '',
      googleApiKey: '',
    })
  }

  async function handleStartSession() {
    if (typeof chrome === 'undefined' || !chrome.storage?.local || !chrome.runtime?.sendMessage) {
      return
    }

    setStartSessionError('')

    const stored = await chrome.storage.local.get(['microphonePermissionState'])
    const hasGrantedMicrophonePermission =
      stored.microphonePermissionState === 'granted' ||
      microphonePermissionState === 'granted'

    if (hasGrantedMicrophonePermission) {
      setIsWaitingForMicrophonePermission(true)
      await connectToLiveSession()
      return
    }

    setIsWaitingForMicrophonePermission(true)

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'OPEN_MICROPHONE_PERMISSION_PAGE',
      }) as { ok: boolean; error?: string }

      if (!response.ok) {
        setIsWaitingForMicrophonePermission(false)
        setStartSessionError(response.error ?? 'Microphone permission request failed.')
      }
    } catch {
      setIsWaitingForMicrophonePermission(false)
      setStartSessionError('Microphone permission request failed.')
    }
  }

  async function connectToLiveSession() {
    setMicrophonePermissionState('granted')
    let sessionId = ''

    try {
      const session = await liveSessionService.start({
        meetingId: getMeetingIdFromUrl(meetingGate.currentTabUrl),
        meetingLink: meetingGate.currentTabUrl || undefined,
      })
      sessionId = session.metadata.sessionId
      setActiveSessionId(sessionId)

      googleService.setHandlers({
        onInputTranscript: async (text) => {
          if (!text.trim()) {
            return
          }

          await liveSessionService.appendTranscriptPoint(sessionId, text)
        },
        onLiveSessionUpdate: async (update) => {
          await liveSessionService.updateLiveSession(sessionId, update)
        },
      })
      await googleService.connect()
      setScreen('live')
    } catch (error) {
      if (sessionId) {
        void liveSessionService.stop(sessionId)
        setActiveSessionId('')
      }

      googleService.setHandlers({})

      setStartSessionError(
        error instanceof Error ? error.message : 'Unable to start live coaching.',
      )
    } finally {
      setIsWaitingForMicrophonePermission(false)
    }
  }

  if (submitted && screen === 'dashboard') {
    return (
      <DashboardScreen
        currentTabUrl={meetingGate.currentTabUrl}
        isOnMeetingPage={meetingGate.isOnMeetingPage}
        onStartSession={handleStartSession}
        isStartingSession={isWaitingForMicrophonePermission}
        startSessionError={startSessionError}
        onOpenHistory={() => setScreen('history')}
        onOpenSettings={() => setScreen('settings')}
      />
    )
  }

  if (submitted && screen === 'live') {
    return (
      <LiveCoachingScreen
        sessionId={activeSessionId}
        onStop={() => {
          googleService.setHandlers({})
          if (activeSessionId) {
            void liveSessionService.stop(activeSessionId)
          }
          setIsWaitingForMicrophonePermission(false)
          setStartSessionError('')
          setActiveSessionId('')
          setScreen('dashboard')
        }}
      />
    )
  }

  if (submitted && screen === 'history') {
    return (
      <SessionHistoryScreen
        onBack={() => setScreen('dashboard')}
      />
    )
  }

  if (submitted && screen === 'settings') {
    return (
      <SettingsScreen
        onBack={() => setScreen('dashboard')}
        onLogout={handleLogout}
      />
    )
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
