import { IndexedDbDriver } from './storage'

// ------------------------------ //
//          AUTH                  //
// ------------------------------ //
export type Username = string

export type Password = string

export type ApiKey = string

export interface AuthCredentials {
  username: Username
  password: Password
  apiKey: ApiKey
}


// ------------------------------ //
//          SESSION               //
// ------------------------------ //

export type SessionId = string

export type MeetingId = string

export type Timestamp = string

export type Duration = string

export interface SessionMetadata {
  sessionId: SessionId
  meetingId: MeetingId
  title: string
  source: string
  meetingLink?: string
  startedAt: Timestamp
  endedAt?: Timestamp
  totalDuration: Duration
}

export interface SessionMetric {
  label: string
  value: string
}

export interface LiveSessionMetric extends SessionMetric {
  detail: string
}

export interface LiveCoachingInsight {
  impact: string
  title: string
  description: string
}

export interface LiveWatchItem {
  title: string
}

export interface TranscriptPoint {
  point: string
  timestamp: Timestamp
}

export interface LiveSessionData {
  insight: LiveCoachingInsight
  watch: LiveWatchItem[]
  metrics: LiveSessionMetric[]
  transcript: TranscriptPoint[]
}

export interface PostSessionMajorPoint {
  title: string
  transcriptQuote?: string
}

export interface PostSessionTranscriptExcerpt {
  point: string
  timestamp: Timestamp
}

export interface PostSessionData {
  verdict: string
  metrics: SessionMetric[]
  confidence: string
  majorPoints: PostSessionMajorPoint[]
  strengths: string[]
  nextSteps: string[]
  needsWork: string[]
  transcriptExcerpts: PostSessionTranscriptExcerpt[]
}

export interface CommunicationSession {
  metadata: SessionMetadata
  liveSession: LiveSessionData
  postSession: PostSessionData
}



// ------------------------------ //
//          STORAGE               //
// ------------------------------ //

const AUTH_STORE = 'auth'
const SESSION_STORE = 'sessions'
const PRIMARY_AUTH_KEY = 'primary'

type AuthRecord = AuthCredentials & {
  id: typeof PRIMARY_AUTH_KEY
}

type SessionRecord = CommunicationSession & {
  id: SessionId
}

const indexedDbDriver = new IndexedDbDriver()

export class SessionManager {
  private authCredentials: AuthCredentials | null = null

  // Step 1: Save or replace the single auth record for the current user.
  saveAuth(credentials: AuthCredentials) {
    const record: AuthRecord = {
      id: PRIMARY_AUTH_KEY,
      ...credentials,
    }

    return indexedDbDriver.put(AUTH_STORE, record)
  }

  // Step 2: Reset any in-memory auth state first, then persist the latest credentials.
  async setAuth(credentials: AuthCredentials) {
    this.authCredentials = null
    this.authCredentials = credentials
    await this.saveAuth(credentials)
  }

  // Step 3: Load the current auth record if one exists.
  async getAuth() {
    if (this.authCredentials) {
      return this.authCredentials
    }

    const record = await indexedDbDriver.get<AuthRecord>(
      AUTH_STORE,
      PRIMARY_AUTH_KEY,
    )

    if (!record) {
      return null
    }

    const { username, password, apiKey } = record
    const credentials = { username, password, apiKey }
    this.authCredentials = credentials
    return credentials
  }

  // Step 4: Treat a stored API key as the login token for the local app.
  async isLoggedIn() {
    const auth = await this.getAuth()
    return Boolean(auth?.apiKey)
  }

  // Step 5: Add a brand new communication session. Use this once per session id.
  createSession(session: CommunicationSession) {
    const record: SessionRecord = {
      id: session.metadata.sessionId,
      ...session,
    }

    return indexedDbDriver.add(SESSION_STORE, record)
  }

  // Step 6: Replace an existing session with the latest full version.
  updateSession(session: CommunicationSession) {
    const record: SessionRecord = {
      id: session.metadata.sessionId,
      ...session,
    }

    return indexedDbDriver.put(SESSION_STORE, record)
  }

  // Step 7: Load one communication session by session id.
  async getSession(sessionId: SessionId) {
    const record = await indexedDbDriver.get<SessionRecord>(SESSION_STORE, sessionId)
    return record ? this.toSession(record) : null
  }

  // Step 8: Load all saved sessions and sort the newest first.
  async listSessions() {
    const records = await indexedDbDriver.getAll<SessionRecord>(SESSION_STORE)

    return records
      .map((record) => this.toSession(record))
      .sort((left, right) =>
        right.metadata.startedAt.localeCompare(left.metadata.startedAt),
      )
  }

  // Step 9: Update only the metadata section while keeping the rest of the session intact.
  async updateSessionMetadata(
    sessionId: SessionId,
    updates: Partial<SessionMetadata>,
  ) {
    return this.updateSessionSection(sessionId, (session) => ({
      ...session,
      metadata: {
        ...session.metadata,
        ...updates,
        sessionId: session.metadata.sessionId,
      },
    }))
  }

  // Step 10: Update the live session section as coaching data changes during the meeting.
  async updateLiveSession(
    sessionId: SessionId,
    updates: Partial<LiveSessionData>,
  ) {
    return this.updateSessionSection(sessionId, (session) => ({
      ...session,
      liveSession: {
        ...session.liveSession,
        ...updates,
      },
    }))
  }

  // Step 11: Update the post-session section after the meeting is completed.
  async updatePostSession(
    sessionId: SessionId,
    updates: Partial<PostSessionData>,
  ) {
    return this.updateSessionSection(sessionId, (session) => ({
      ...session,
      postSession: {
        ...session.postSession,
        ...updates,
      },
    }))
  }

  // Step 12: Append a single live transcript point without rebuilding the transcript manually.
  async appendLiveTranscriptPoint(
    sessionId: SessionId,
    point: LiveSessionData['transcript'][number],
  ) {
    return this.updateSessionSection(sessionId, (session) => ({
      ...session,
      liveSession: {
        ...session.liveSession,
        transcript: [...session.liveSession.transcript, point],
      },
    }))
  }

  // Step 13: Append a single post-session excerpt during summary generation.
  async addPostSessionExcerpt(
    sessionId: SessionId,
    excerpt: PostSessionData['transcriptExcerpts'][number],
  ) {
    return this.updateSessionSection(sessionId, (session) => ({
      ...session,
      postSession: {
        ...session.postSession,
        transcriptExcerpts: [...session.postSession.transcriptExcerpts, excerpt],
      },
    }))
  }

  private async updateSessionSection(
    sessionId: SessionId,
    updater: (session: CommunicationSession) => CommunicationSession,
  ) {
    // Step 14: Read the current stored session before applying a partial update.
    const session = await this.getSession(sessionId)

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const updatedSession = updater(session)

    // Step 15: Persist the updated session back into IndexedDB.
    await this.updateSession(updatedSession)

    return updatedSession
  }

  private toSession(record: SessionRecord): CommunicationSession {
    // Step 16: Strip the IndexedDB-only id field before returning app data.
    const { id: _id, ...session } = record
    return session
  }
}

export const sessionManager = new SessionManager()
