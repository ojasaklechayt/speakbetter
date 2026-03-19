import { useEffect, useState } from 'react'

type PermissionStateValue = 'unknown' | 'prompt' | 'granted' | 'denied'

function getMicrophoneErrorMessage(error: unknown) {
  if (!(error instanceof DOMException)) {
    return 'Microphone access could not be started. Try again.'
  }

  switch (error.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Chrome blocked microphone access for SpeakBetter. Allow it in the browser prompt, then try again.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No microphone was found. Connect a microphone in Chrome or your system settings, then try again.'
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Your microphone is busy or unavailable right now. Close other apps using it, then try again.'
    case 'SecurityError':
      return 'Microphone access is not available in this extension page.'
    default:
      return 'Microphone access could not be started. Try again.'
  }
}

async function persistGrantedPermission() {
  await chrome.storage.local.set({
    microphonePermissionState: 'granted',
    microphonePermissionGrantedAt: Date.now(),
  })
}

function MicPermissionApp() {
  const [permissionState, setPermissionState] = useState<PermissionStateValue>('unknown')
  const [isRequesting, setIsRequesting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (permissionState !== 'granted') {
      return
    }

    let cancelled = false

    async function finalizeGrantedPermission() {
      await persistGrantedPermission()

      if (cancelled) {
        return
      }

      window.setTimeout(() => {
        window.close()
      }, 800)
    }

    void finalizeGrantedPermission()

    return () => {
      cancelled = true
    }
  }, [permissionState])

  useEffect(() => {
    let active = true

    async function syncPermissionState() {
      if (!navigator.permissions?.query) {
        return
      }

      try {
        const status = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        })

        if (!active) {
          return
        }

        const nextState =
          status.state === 'granted' || status.state === 'prompt' || status.state === 'denied'
            ? status.state
            : 'unknown'

        setPermissionState(nextState)
      } catch {
        setPermissionState('unknown')
      }
    }

    void syncPermissionState()

    return () => {
      active = false
    }
  }, [])

  async function handleAllowMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Microphone access is not available in this browser context.')
      return
    }

    setIsRequesting(true)
    setErrorMessage('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setPermissionState('granted')
      setErrorMessage('')
    } catch (error) {
      setPermissionState('denied')
      setErrorMessage(getMicrophoneErrorMessage(error))
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fcfaf7] px-6 py-8 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl flex-col justify-center">
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            SpeakBetter Setup
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Allow microphone access
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            This page is opened directly from the extension so Chrome can show the
            microphone permission prompt in a normal top-level extension tab.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-900">What happens next</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>Click the button below.</li>
              <li>Allow microphone access in the Chrome prompt.</li>
              <li>This tab will close automatically after access is granted.</li>
            </ul>
          </div>

          {permissionState === 'granted' ? (
            <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Microphone access is granted. This tab will close automatically.
            </p>
          ) : null}

          {errorMessage ? (
            <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleAllowMicrophone}
            disabled={isRequesting || permissionState === 'granted'}
            className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
              isRequesting || permissionState === 'granted'
                ? 'cursor-wait bg-slate-400'
                : 'cursor-pointer bg-slate-900 hover:bg-slate-800 active:scale-[0.99]'
            }`}
          >
            {isRequesting
              ? 'Requesting access...'
              : permissionState === 'granted'
                ? 'Access granted'
                : 'Allow microphone'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MicPermissionApp
