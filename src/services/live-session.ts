import mitt from 'mitt'
import {
  type CommunicationSession,
  type SessionId,
  sessionManager,
} from './session-manager'
import { formatDuration } from '../utils/live-session'

export interface StartLiveSessionInput {
  meetingId: string
  meetingLink?: string
  source?: string
  title?: string
}

type SessionListener = (session: CommunicationSession | null) => void
type SessionsListener = (sessions: CommunicationSession[]) => void

type LiveSessionEvents = {
  sessionChanged: {
    sessionId: SessionId
    session: CommunicationSession | null
  }
  sessionsChanged: CommunicationSession[]
}

export class LiveSessionService {
  private activeSessionId: SessionId | null = null
  private readonly events = mitt<LiveSessionEvents>()

  // Create the initial persisted session record before the Gemini socket starts streaming.
  async start(input: StartLiveSessionInput) {
    const session: CommunicationSession = {
      userId: '',
      metadata: {
        sessionId: crypto.randomUUID(),
        meetingId: input.meetingId,
        title: input.title ?? 'Google Meet coaching session',
        source: input.source ?? 'google-meet',
        meetingLink: input.meetingLink,
        startedAt: new Date().toISOString(),
        totalDuration: '00:00',
      },
      liveSession: {
        insight: {
          impact: 'neutral',
          title: 'Waiting for live coaching',
          description: 'Speak so SpeakBetter can start generating coaching signals.',
        },
        watch: [],
        metrics: [],
        transcript: [],
      },
      postSession: {
        verdict: '',
        metrics: [],
        confidence: '',
        majorPoints: [],
        strengths: [],
        nextSteps: [],
        needsWork: [],
        transcriptExcerpts: [],
      },
    }

    const createdSession = await sessionManager.createSession(session)
    this.activeSessionId = createdSession.metadata.sessionId
    this.notifySessionChanged(createdSession.metadata.sessionId)
    return createdSession
  }

  // Mark the active session as finished and compute its final wall-clock duration.
  async stop(sessionId = this.activeSessionId, endedAt = new Date().toISOString()) {
    if (!sessionId) {
      return null
    }

    const session = await sessionManager.getSession(sessionId)

    if (!session) {
      this.activeSessionId = null
      return null
    }

    const updatedSession = await sessionManager.updateSessionMetadata(sessionId, {
      endedAt,
      totalDuration: formatDuration(Date.parse(endedAt) - Date.parse(session.metadata.startedAt)),
    })

    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null
    }

    this.notifySessionChanged(sessionId)
    return updatedSession
  }

  getActiveSessionId() {
    return this.activeSessionId
  }

  // Clear in-memory session tracking when the UI tears down without writing more data.
  clearActiveSession() {
    this.activeSessionId = null
  }

  // Append one live transcript line as Gemini returns new speech recognition output.
  async appendTranscriptPoint(sessionId: SessionId, point: string, timestamp = new Date().toISOString()) {
    const updatedSession = await sessionManager.appendLiveTranscriptPoint(sessionId, {
      point,
      timestamp,
    })

    this.notifySessionChanged(sessionId)
    return updatedSession
  }

  // Apply partial live-session updates so routes can react to fresh coaching data.
  async updateLiveSession(sessionId: SessionId, updates: Partial<CommunicationSession['liveSession']>) {
    const updatedSession = await sessionManager.updateLiveSession(sessionId, updates)
    this.notifySessionChanged(sessionId)
    return updatedSession
  }

  // Subscribe one route to a single session document and replay the current value immediately.
  subscribeSession(sessionId: SessionId, listener: SessionListener) {
    const handleSessionChanged = (
      payload: LiveSessionEvents['sessionChanged'],
    ) => {
      if (payload.sessionId === sessionId) {
        listener(payload.session)
      }
    }

    this.events.on('sessionChanged', handleSessionChanged)
    void sessionManager.getSession(sessionId).then(listener)

    return () => {
      this.events.off('sessionChanged', handleSessionChanged)
    }
  }

  // Subscribe list views such as history screens to the latest saved session collection.
  subscribeSessions(listener: SessionsListener) {
    this.events.on('sessionsChanged', listener)
    void sessionManager.listSessions().then(listener)

    return () => {
      this.events.off('sessionsChanged', listener)
    }
  }

  // Fan out DB-backed session changes to any in-memory route listeners.
  private notifySessionChanged(sessionId: SessionId) {
    void sessionManager.getSession(sessionId).then((session) => {
      this.events.emit('sessionChanged', {
        sessionId,
        session,
      })
    })

    void sessionManager.listSessions().then((sessions) => {
      this.events.emit('sessionsChanged', sessions)
    })
  }
}

export const liveSessionService = new LiveSessionService()
