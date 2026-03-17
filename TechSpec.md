# SpeakBetter Technical Specification

## 1. Purpose

This document translates `FeatureSpec.md` into a buildable MVP technical plan.

Primary goal:

Build a Chrome side-panel extension that captures the user's microphone during a live meeting, streams speech to Gemini Live, computes lightweight speaking metrics locally, stores sessions locally, and shows live coaching feedback.

Technical goals:

* keep the stack simple
* avoid backend infrastructure for MVP
* keep recurring cost near zero
* preserve clean migration paths for future server-backed versions

---

## 2. Technical decisions

### 2.1 Chosen stack

Frontend and extension shell:

* React
* TypeScript
* Vite using the official React + TypeScript template
* Chrome Extension Manifest V3
* `chrome.sidePanel`
* `chrome.storage.local`

State and local data:

* React Context or Zustand for in-memory UI state
* thin repository layer over `chrome.storage.local`

External providers:

* Gemini Live API for streaming audio input, transcription, and optional analysis

Styling:

* Tailwind CSS v4
* `@tailwindcss/vite`

Scaffold choice:

* initialize from `create-vite` with the React + TypeScript template

Build tooling notes:

* use a current Node version compatible with the latest Vite requirements
* use standard Vite entry files such as `src/main.tsx` and `src/index.css`
* install Tailwind v4 through the Vite plugin instead of PostCSS-based older setup
* keep the MVP on the normal Vite React TypeScript path rather than adding extra framework layers
* keep `@import "tailwindcss";` in `src/index.css` as the base Tailwind v4 entrypoint

### 2.2 FastAPI decision

FastAPI is **not required for MVP**.

Reasoning:

* the product is explicitly local-first
* the extension can store data locally without a backend
* Gemini can cover both real-time audio understanding and summary/relevance work
* adding FastAPI would increase setup, packaging, onboarding friction, and operational complexity

FastAPI becomes justified only if one of these happens later:

* Gemini Live browser integration requires a stronger server-side token-broker approach
* we need server-side secret handling instead of local key storage
* we add heavier NLP, embeddings, or batch processing that should not run in the extension
* we add sync, multi-device history, or team features

MVP decision:

* build as a pure extension app
* keep a clean service abstraction so a future FastAPI layer can be added without rewriting the UI

---

## 3. High-level architecture

## 3.1 Runtime pieces

The extension will have three runtime parts:

### A. Side panel app

React app rendered in the Chrome side panel.

Responsibilities:

* onboarding
* settings
* live coaching screen
* session history
* session detail view
* microphone permission request
* audio capture
* Gemini Live client
* live metric computation

### B. Background service worker

Manifest V3 service worker for extension orchestration.

Responsibilities:

* detect active tab metadata at session start
* enforce single active session
* persist session start/stop metadata
* act as central coordinator for storage writes and recovery
* handle side panel lifecycle events

### C. Shared modules

Small shared TypeScript modules used by both the side panel and background.

Responsibilities:

* session models
* storage helpers
* metrics engine
* Gemini Live integration
* summary/relevance utilities

## 3.2 No content script for MVP

The MVP will not inject UI into Google Meet and will not depend on DOM scraping.

Meet detection will use:

* current tab URL
* current tab title

This keeps the extension simpler and aligned with the feature spec.

---

## 4. User flow mapped to technical flow

## 4.1 Onboarding

1. User opens side panel.
2. If no profile exists, show onboarding form.
3. User enters:
   * display name
   * Gemini API key
4. App validates only basic completeness and stores data in `chrome.storage.local`.
5. User is routed to the main dashboard.

## 4.2 Start coaching

1. User opens Google Meet tab.
2. User opens side panel and clicks `Start Coaching`.
3. Side panel sends `START_SESSION` message to background.
4. Background:
   * checks if another session is active
   * reads active tab URL and title
   * creates a session shell in storage with status `active`
5. Side panel requests microphone permission through `getUserMedia`.
6. Side panel starts audio capture.
7. Side panel opens a Gemini Live session.
8. Incoming transcript events update:
   * rolling transcript view
   * metric engine state
   * session draft data
9. A timeline snapshot is saved every 5 to 10 seconds.
10. Coaching insight is refreshed every 10 to 20 seconds.

## 4.3 Stop coaching

1. User clicks `Stop Coaching`, closes the panel, or the Meet tab disappears.
2. Side panel stops audio capture and closes the transcript stream.
3. Final metrics are computed.
4. Optional end-of-session summary is generated.
5. Background marks the session as `completed` or `aborted`.
6. Session data is persisted under a stable storage key.

## 4.4 Edge case behavior

MVP behavior for critical edge cases:

* panel closes during active session: finalize and persist partial session
* microphone permission denied: session stays created but moves to error state with retry CTA
* Gemini Live disconnects: keep partial transcript, show reconnect option, allow manual stop
* missing Gemini key: block start and route user to settings
* start outside Meet: allow session but label source as `unknown` unless URL matches Meet

---

## 5. Proposed project structure

```text
speakbetter/
  package.json
  tsconfig.json
  vite.config.ts
  src/
    main.tsx
    App.tsx
    index.css
    sidepanel/
      routes/
      components/
    background/
      index.ts
    services/
      gemini-live.ts
      storage.ts
      session-manager.ts
    features/
      metrics.ts
      coaching.ts
      history.ts
    utils/
      text.ts
      time.ts
    types.ts
  public/
    manifest.json
  FeatureSpec.md
  TechSpec.md
```

Notes:

* keep Gemini integration in one service file instead of adding a provider layer now
* keep metrics logic independent from React so it is easy to test
* keep storage writes centralized through `storage.ts` and `session-manager.ts`
* keep styling in Tailwind v4 with shared utility classes and a small number of reusable React components

---

## 6. Core modules

## 6.1 Session repository

Wrapper over `chrome.storage.local`.

Responsibilities:

* save and load profile
* save active session pointer
* create session shell
* append transcript chunks
* append timeline snapshots
* finalize session
* list session summaries
* load session detail
* export all session JSON

Primary storage keys:

* `profile`
* `settings`
* `active_session_id`
* `sessions_index`
* `session:<session_id>`

## 6.2 Gemini Live client

Responsibilities:

* open Live API session using stored Gemini API key
* send microphone audio frames in the format required by Gemini Live
* receive transcript and model response events
* normalize transcript payloads into app-friendly chunk objects

Implementation note:

Use the official Google Gen AI client if it fits Manifest V3 cleanly. If not, use a minimal websocket wrapper for the Gemini Live protocol.

Audio note:

* plan for PCM conversion in the extension runtime, because browser microphone capture formats may not match the Live API input format directly
* Gemini Live audio-only sessions are limited, so the session manager should be designed to roll over or resume long meetings instead of assuming one endless connection

## 6.3 Metrics engine

Pure TypeScript module that consumes transcript events and timestamps.

Outputs:

* total fillers
* fillers per minute
* recent filler count
* hedge count
* hesitation count
* average pause
* longest pause
* pauses over threshold
* current WPM
* average WPM
* pace classification
* confidence score
* relevance score

## 6.4 Coaching engine

Responsibility:

Turn recent metric windows into one short, actionable coaching line.

Priority order:

1. severe pacing issues
2. high filler density
3. long pauses
4. topic drift
5. positive reinforcement when metrics are stable

MVP implementation:

* mostly rule-based locally
* optional LLM refinement only every 30 to 60 seconds or on session end

## 6.5 Session manager

Responsibility:

Coordinate the active session lifecycle between the side panel, Gemini Live, and local storage.

Responsibilities:

* enforce one active session
* start and stop sessions cleanly
* batch transcript and timeline writes
* recover partial sessions after panel close or disconnect
* rotate Gemini Live sessions for long meetings

---

## 7. Data model

## 7.1 TypeScript interfaces

```ts
type MeetingSource = 'google_meet' | 'unknown';

type SessionStatus = 'active' | 'completed' | 'aborted' | 'error';

interface UserProfile {
  userId: string;
  name: string;
  geminiApiKey: string;
  createdAt: string;
}

interface TranscriptChunk {
  timestamp: string;
  text: string;
  isFinal: boolean;
  speaker: 'user';
  startMs?: number;
  endMs?: number;
}

interface TimelineSnapshot {
  timestamp: string;
  windowSec: number;
  fillers: number;
  avgPauseMs: number;
  longestPauseMs: number;
  wpm: number;
  confidenceScore: number;
  relevanceScore: number;
  insight: string;
}

interface SessionMetrics {
  totalFillers: number;
  fillersPerMin: number;
  recentFillers: number;
  avgPauseMs: number;
  longestPauseMs: number;
  pauseCountAboveThreshold: number;
  currentWpm: number;
  avgWpm: number;
  paceClass: 'slow' | 'good' | 'fast';
  hedgeCount: number;
  hesitationCount: number;
  confidenceScore: number;
  relevanceScore: number;
}

interface SessionSummary {
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
}

interface CoachingSession {
  sessionId: string;
  userId: string;
  meetingSource: MeetingSource;
  meetingUrl: string;
  tabTitle?: string;
  startedAt: string;
  endedAt?: string;
  durationSec?: number;
  status: SessionStatus;
  topicContext?: string;
  metrics: SessionMetrics;
  timeline: TimelineSnapshot[];
  transcriptChunks: TranscriptChunk[];
  insights: string[];
  summary?: SessionSummary;
  errorMessage?: string;
}
```

## 7.2 Storage shape

`sessions_index` should store only lightweight list data:

```json
[
  {
    "sessionId": "sess_001",
    "startedAt": "2026-03-17T10:30:00Z",
    "meetingSource": "google_meet",
    "meetingUrl": "https://meet.google.com/abc-defg-hij",
    "durationSec": 1920,
    "confidenceScore": 71,
    "fillerCount": 18,
    "status": "completed"
  }
]
```

Rationale:

* fast history screen loading
* avoids reading full transcripts for list view
* keeps detailed data isolated per session

---

## 8. Metric algorithms

## 8.1 Filler words

Maintain a normalized token list from transcript text.

Starter dictionary:

* `um`
* `uh`
* `like`
* `you know`
* `basically`
* `actually`
* `sort of`
* `kind of`

Rules:

* count only on final transcript chunks
* support both single-word and phrase matchers
* compute `recentFillers` on a rolling 60-second window
* compute `fillersPerMin = totalFillers / elapsedMinutes`

## 8.2 Hedge and hesitation detection

Hedge dictionary:

* `maybe`
* `probably`
* `i think`
* `i guess`
* `sort of`
* `kind of`

Hesitation heuristics:

* repeated opening phrase within short span
* obvious restart patterns such as `I think... I think we should`
* cut-off fragments followed by restart

This is heuristic and should be labeled as approximate.

## 8.3 Pause metrics

MVP pause calculation will be transcript-timing-based, not raw waveform silence detection.

Reason:

* cheaper and simpler than real-time audio signal processing
* sufficient for MVP directional coaching

Method:

* use timestamps between final transcript chunk boundaries
* treat gaps above `700ms` as pauses
* compute average and longest pause
* compute `pauseCountAboveThreshold`

Future improvement:

* move to Web Audio analysis for better silence detection if transcript timing is too noisy

## 8.4 Speaking rate

Method:

* `currentWpm` from rolling 30-second transcript window
* `avgWpm` from all final transcript words over elapsed speaking minutes

Initial pace classification:

* `slow` if under 100 WPM
* `good` if 100 to 160 WPM
* `fast` if above 160 WPM

Thresholds can be tuned after real usage.

## 8.5 Confidence score

Heuristic score from `0` to `100`.

Starting point:

* base score `100`

Penalty weights:

* filler density: up to `-25`
* long pauses: up to `-20`
* hedge count: up to `-15`
* hesitation restarts: up to `-15`
* unstable pace: up to `-15`
* incomplete phrasing pattern: up to `-10`

Clamp final score to `0..100`.

Display label:

* `communication confidence estimate`

## 8.6 Relevance score

MVP baseline is local and cheap.

Topic source priority:

1. manual topic input if user adds one
2. current tab title
3. first 30 to 60 seconds of transcript summary keywords

Method:

* extract normalized keywords from topic context
* extract keywords from recent rolling transcript window
* compute weighted overlap ratio
* return score `0..100`

Optional enhancement when Gemini analysis is enabled:

* every 60 seconds or at session end, ask Gemini for a directional relevance rating and short reason
* never call model analysis on every chunk

---

## 9. UI specification

## 9.1 Main views

### Onboarding view

Fields:

* name
* Gemini API key

Actions:

* save profile
* continue to dashboard

### Live coaching view

Must display:

* session status badge
* elapsed time
* last transcript snippet
* filler count
* WPM
* pause metric
* confidence score
* relevance score
* one coaching message
* `Start Coaching` / `Stop Coaching`

### Session history view

Must display:

* reverse-chronological session list
* date/time
* meeting source
* duration
* confidence score
* filler count

### Session detail view

Must display:

* meeting metadata
* final metrics
* timeline summary cards or mini chart
* strengths
* weaknesses
* next steps
* transcript excerpts

### Settings view

Must display:

* editable profile
* editable Gemini API key
* clear local data
* export JSON

## 9.2 State management approach

Use local UI state plus one global app store.

Recommended store slices:

* `profile`
* `settings`
* `activeSession`
* `history`
* `uiStatus`

Do not keep the full session history permanently in memory. Load summaries first, then load detail on demand.

---

## 10. Extension manifest and permissions

## 10.1 Required permissions

Expected Manifest V3 permissions:

* `storage`
* `tabs`
* `sidePanel`

Possible optional permissions depending on implementation details:

* `alarms` for heartbeat or cleanup tasks
* `unlimitedStorage` if transcript history grows materially

Host permissions:

* `https://meet.google.com/*`
* Gemini API hosts

## 10.2 Why permissions stay minimal

We do not need:

* content script injection
* Meet DOM manipulation
* outgoing audio manipulation

This reduces review friction and security surface area.

---

## 11. Persistence strategy

## 11.1 What is stored

Persist:

* profile and keys
* session metadata
* transcript chunks
* timeline snapshots
* final metrics
* summary insights

Do not persist for MVP:

* raw microphone audio
* waveform blobs
* full intermediate provider responses

Reason:

* saves storage
* reduces privacy risk
* keeps the extension simpler

## 11.2 Write strategy

To avoid data loss, persist incrementally:

* create session shell immediately on start
* append transcript chunks in batches every few seconds
* append timeline snapshots periodically
* write final summary on stop

If the panel closes unexpectedly, the most recently persisted draft should still be recoverable.

---

## 12. Provider integration design

## 12.1 Gemini Live API

Use for:

* live speech-to-text
* optional short coaching refinement
* optional end-of-session summary
* optional relevance refinement

Flow:

1. open Live API session when session starts
2. send audio chunks continuously
3. receive transcript events and optional model responses
4. feed final transcript text into metrics engine
5. rotate or resume the Live session if the meeting exceeds a single session limit

If Gemini Live is unavailable:

* show connection error
* keep session shell
* let user retry or stop

Cost controls:

* no per-chunk analysis calls beyond the live transcript session
* at most one periodic coaching refinement window
* one final summary call per session

Fallback behavior with AI analysis disabled:

* relevance uses keyword overlap only
* summary uses template-based local summary generation
* coaching remains rules-based

---

## 13. Error handling and recovery

## 13.1 Errors to handle explicitly

* no Gemini key configured
* invalid Gemini key
* microphone denied
* no active tab URL
* Gemini Live disconnect
* duplicate active session
* storage write failure

## 13.2 Recovery rules

* never discard a started session silently
* save partial session data whenever possible
* surface short actionable error messages in the UI
* allow retry for microphone and transcript connection failures
* enforce only one active session at a time

---

## 14. Security and privacy

## 14.1 MVP security posture

Because there is no backend, API keys live on the user's machine in extension storage.

Implications:

* acceptable for MVP and personal use
* not ideal for enterprise or shared-machine use
* should be clearly communicated in the product

## 14.2 Basic safeguards

* mask keys in settings UI
* never log keys to console in production build
* never export keys in session JSON export unless user explicitly requests full backup export
* do not store raw audio by default

---

## 15. Performance and responsiveness

Targets:

* live metric updates every 2 to 5 seconds
* timeline snapshot write every 5 to 10 seconds
* history screen load under 1 second for normal session volumes

Performance rules:

* batch storage writes
* keep transcript rendering trimmed to recent snippets in live view
* avoid expensive re-computation in React components
* keep metrics engine pure and incremental

---

## 16. Testing strategy

## 16.1 Unit tests

Test these first:

* filler word detection
* hedge detection
* pause calculation
* WPM calculation
* confidence score formula
* relevance keyword overlap
* storage repository read/write behavior

## 16.2 Integration tests

Test flows:

* onboarding save and reload
* start session on Meet tab
* block duplicate session start
* transcript event updates metrics
* stop session persists final object
* history list loads summaries correctly

## 16.3 Manual MVP acceptance

Verify:

* side panel opens and persists state
* microphone permission flow works
* Gemini Live session connects with valid key
* partial session survives unexpected panel close
* sessions remain after browser restart

---

## 17. Delivery plan

## Phase 1: Extension shell and storage

Deliver:

* Manifest V3 app
* React side panel shell
* onboarding
* profile/settings persistence
* background messaging skeleton

## Phase 2: Session lifecycle and transcript streaming

Deliver:

* start/stop session flow
* active tab capture
* Meet URL detection
* microphone capture
* Gemini Live integration
* transcript rendering

## Phase 3: Local metric engine

Deliver:

* filler detection
* pause heuristics
* WPM
* confidence score
* coaching engine
* timeline snapshots

## Phase 4: History and summaries

Deliver:

* session history
* session detail
* export JSON
* local summary templates
* optional LLM summary and relevance refinement

---

## 18. MVP scope summary

What ships in MVP:

* Chrome side panel extension
* local onboarding and settings
* single active session
* Meet URL capture
* microphone transcription via Gemini Live
* local metrics
* local-first session storage
* session history and detail screens
* optional Gemini-enhanced summary

What is intentionally deferred:

* FastAPI backend
* cloud sync
* team features
* raw audio storage
* accurate diarization
* advanced semantic analysis on every chunk

---

## 19. Final recommendation

Build the MVP as a pure React + TypeScript Chrome extension with Gemini Live and no FastAPI service.

That is the simplest architecture that satisfies the feature spec, keeps cost low, shortens setup time, and preserves a clean path to add a backend later only if browser-side Gemini integration or product scope truly requires it.
