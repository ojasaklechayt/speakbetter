# SpeakBetter

## 1. Product summary

SpeakBetter is a Chrome side-panel extension that helps users improve spoken communication during live meetings.

The product does **not** modify outgoing audio, inject UI into Google Meet, or act as a Meet plugin.

It runs as a normal Chrome extension with a side panel. When the user is in a Google Meet and clicks **Start Coaching**, SpeakBetter creates a session, captures meeting context, streams the user’s microphone audio for analysis, computes communication metrics, and stores the session locally.

The initial version is optimized for:

* fast setup
* zero or near-zero cost
* local-first storage
* simple onboarding
* strong MVP utility

---

## 2. Product goal

Help users become better communicators in meetings by giving them:

* live communication metrics
* periodic coaching feedback
* a stored session history they can review later

The MVP should answer questions like:

* How many filler words did I use?
* Was I speaking too slowly or too quickly?
* Did I pause too much?
* Did I sound hesitant?
* Was I relevant to the discussion topic?
* Did my speaking improve across sessions?

---

## 3. Non-goals

The MVP will **not** include:

* audio rewriting into the meeting
* voice cloning
* text-to-speech playback
* Meet DOM injection
* multi-platform meeting support beyond basic Meet link capture
* cloud database storage
* team dashboards
* advanced emotion or personality analysis
* high-accuracy speaker diarization

---

## 4. Primary user flow

### 4.1 Onboarding

On first launch, the extension opens onboarding in the side panel.

The user is asked for:

* Deepgram API key
* LLM API key for optional AI analysis
* basic profile details

For MVP, profile data and keys are stored locally in a JSON-backed local storage approach.

### 4.2 Start of session

User opens a Google Meet in Chrome.

User opens the extension side panel.

User clicks **Start Coaching**.

The extension:

* creates a new session id
* detects and stores the current tab URL
* extracts the Google Meet link
* stores session start timestamp
* requests microphone access if not already granted
* begins audio capture
* starts transcript streaming
* starts metrics computation

### 4.3 During session

The side panel updates every few seconds with:

* live transcript snippets
* filler count
* speaking rate
* pause metrics
* confidence score
* relevance score
* one coaching insight

### 4.4 End of session

When the user clicks **Stop Coaching** or closes the meeting:

* session end time is stored
* duration is computed
* final metrics are generated
* optional summary is generated
* all session data is saved locally

### 4.5 Session review

User can open past sessions from the extension and view:

* meeting link
* date and time
* duration
* metric summary
* transcript snippets
* coaching summary

---

## 5. Product surfaces

### 5.1 Chrome side panel

This is the main product surface.

The side panel contains:

* onboarding
* live coaching view
* session history
* session detail view
* settings

### 5.2 Extension popup

Optional lightweight surface.

Purpose:

* quick open button for side panel
* current status indicator

The popup is not required for core MVP functionality.

---

## 6. Core MVP features

### 6.1 Onboarding

#### Purpose

Collect required credentials and basic user metadata.

#### Inputs

* Deepgram API key
* AI provider API key
* display name or username

#### MVP storage

Store in local extension-managed storage.

#### Notes

Although the user suggested storing in a JSON file in the codebase, in an actual extension the correct MVP equivalent is local storage managed by the extension runtime. If we want export/import JSON later, that can be added separately.

### 6.2 Session creation

When the user clicks Start Coaching, create a session record with:

* session_id
* user_id or local profile id
* meeting_url
* meeting_source = `google_meet`
* tab_title if available
* started_at
* status = `active`

### 6.3 Microphone capture

Capture microphone audio after explicit user permission.

Requirements:

* audio capture starts only after Start Coaching
* capture stops immediately on Stop Coaching
* clear user-visible recording state

### 6.4 Real-time transcript

Use Deepgram streaming transcription.

Requirements:

* show rolling transcript snippets
* support interim and final transcript segments
* persist transcript chunks into the active session

### 6.5 Communication metrics

Compute and display these metrics during session:

#### Filler words

Track count and density for words like:

* um
* uh
* aaa
* like
* you know
* basically

Outputs:

* total fillers
* fillers per minute
* recent filler count

#### Hesitation / restart signals

Heuristic detection of:

* repeated starts
* partial phrase restarts
* hedge words

Outputs:

* hesitation count
* hedge count

#### Pause metrics

Track silence and timing gaps.

Outputs:

* average pause duration
* longest pause
* pause count above threshold

#### Speaking rate

Track words per minute.

Outputs:

* current WPM
* average WPM
* pace classification: slow / good / fast

#### Confidence score

Heuristic score derived from:

* filler density
* pause behavior
* hedge words
* restart frequency
* sentence completeness
* pace stability

Output:

* score from 0 to 100

#### Relevance score

Estimate how relevant the user’s recent speech is to the discussion topic.

MVP approach:

* infer topic from meeting title, initial transcript, or manual topic input
* compare recent user transcript chunks against topic context

Output:

* score from 0 to 100

### 6.6 Coaching insights

Every 10 to 20 seconds, show one short coaching message.

Examples:

* “Too many fillers in the last segment.”
* “Your pace is stable.”
* “Try shorter answers.”
* “You are drifting from the main topic.”
* “Good improvement from the previous minute.”

### 6.7 Session storage

Store complete session data locally.

Each session should include:

* metadata
* transcript chunks
* computed metrics
* timeline snapshots
* final summary

### 6.8 Session history

User can browse past sessions.

List view should show:

* date
* meeting source
* duration
* confidence score
* filler count

Detail view should show:

* meeting URL
* transcript excerpts
* metric timeline
* summary insights

---

## 7. Data model

### 7.1 User profile

```json
{
  "user_id": "local-user-1",
  "name": "Ojas",
  "deepgram_api_key": "...",
  "llm_provider": "gemini",
  "llm_api_key": "...",
  "created_at": "2026-03-17T10:00:00Z"
}
```

### 7.2 Session object

```json
{
  "session_id": "sess_001",
  "user_id": "local-user-1",
  "meeting_source": "google_meet",
  "meeting_url": "https://meet.google.com/abc-defg-hij",
  "tab_title": "Weekly Product Sync",
  "started_at": "2026-03-17T10:30:00Z",
  "ended_at": "2026-03-17T11:02:00Z",
  "duration_sec": 1920,
  "status": "completed",
  "topic_context": "Weekly product sync about launch readiness",
  "metrics": {
    "total_fillers": 18,
    "fillers_per_min": 2.4,
    "avg_pause_ms": 1100,
    "longest_pause_ms": 3400,
    "avg_wpm": 132,
    "confidence_score": 71,
    "relevance_score": 84,
    "hedge_count": 9,
    "hesitation_count": 6
  },
  "timeline": [],
  "transcript_chunks": [],
  "insights": [],
  "summary": {
    "strengths": ["Good speaking pace", "Mostly relevant answers"],
    "weaknesses": ["Frequent filler usage", "Long pauses before key points"],
    "next_steps": ["Pause silently instead of saying um", "Lead with conclusion first"]
  }
}
```

### 7.3 Timeline snapshot object

```json
{
  "timestamp": "2026-03-17T10:36:10Z",
  "window_sec": 15,
  "fillers": 3,
  "avg_pause_ms": 900,
  "wpm": 141,
  "confidence_score": 74,
  "relevance_score": 80,
  "insight": "Good pace, but reduce fillers."
}
```

### 7.4 Transcript chunk object

```json
{
  "timestamp": "2026-03-17T10:35:42Z",
  "text": "I think um we should probably ship next week after QA closes the remaining bugs.",
  "is_final": true,
  "speaker": "user"
}
```

---

## 8. Storage plan

### MVP storage requirement

Use local file-system-like persistence for development.

### Practical implementation note

Since a Chrome extension cannot safely write arbitrary files into the user’s local filesystem as a normal app would, the MVP should use:

* `chrome.storage.local` for persistent extension data
* optional JSON import/export for backup/debugging

For development, the internal data structure can still be designed as JSON documents.

### Storage layout concept

* `profile`
* `sessions_index`
* `session:<session_id>`

### Future migration path

Later this can move to:

* SQLite via desktop app
* IndexedDB abstraction
* Supabase / Firebase / Postgres backend

---

## 9. AI provider strategy

### 9.1 Deepgram

Used for:

* streaming speech-to-text

### 9.2 LLM provider

Used for optional analysis such as:

* topic relevance scoring
* summary generation
* coaching message refinement
* cleaned phrasing suggestions

### 9.3 Zero-cost / low-cost provider approach

Support pluggable LLM providers.

Initial recommended providers:

* Gemini API
* Groq
* OpenAI if credits exist

The product should not hardcode one provider.

---

## 10. Scoring logic

### 10.1 Confidence score

Heuristic formula for MVP.

Base score: 100

Subtract for:

* high filler density
* pauses above threshold
* repeated hedge words
* incomplete restart patterns
* unstable pace

Add or preserve score for:

* concise complete phrasing
* steady pace
* lower hesitation
* lower redundancy

This should be clearly labeled as a communication heuristic, not an objective truth.

### 10.2 Relevance score

Inputs:

* meeting topic context
* recent transcript chunk window

Method:

* keyword overlap for cheap baseline
* optional embedding or LLM classification later

This score should be treated as directional, not authoritative.

---

## 11. UX requirements

### 11.1 Live coaching screen

Must show:

* session status
* elapsed time
* current transcript snippet
* top 4 to 6 metrics
* one coaching message
* Stop Coaching button

### 11.2 Session history screen

Must show:

* recent sessions list
* key summary metrics per session

### 11.3 Session detail screen

Must show:

* metadata
* final metrics
* timeline summary
* strengths
* weaknesses
* suggested improvement actions

### 11.4 Settings screen

Must allow:

* editing API keys
* editing profile
* selecting LLM provider
* clearing local data
* exporting session JSON

---

## 12. Functional requirements

### FR-1

The extension must run as a normal Chrome extension with side panel UI.

### FR-2

The extension must not inject custom UI into Google Meet as a required part of MVP.

### FR-3

The extension must create a new session on Start Coaching.

### FR-4

The extension must capture and store the active Google Meet URL when session starts.

### FR-5

The extension must stream microphone audio for transcription after explicit user action.

### FR-6

The extension must compute basic communication metrics locally where possible.

### FR-7

The extension must persist session data locally.

### FR-8

The extension must support viewing prior sessions.

### FR-9

The extension must stop transcription and metric generation immediately when the session ends.

### FR-10

The extension must work even if optional AI analysis is disabled, with reduced functionality.

---

## 13. Non-functional requirements

### NFR-1

The side panel should feel responsive and update without noticeable lag.

### NFR-2

The product should degrade gracefully if the LLM provider key is missing.

### NFR-3

The product should preserve session data across browser restarts.

### NFR-4

The product should minimize cost by limiting LLM calls.

### NFR-5

The product should be simple enough to build as a real MVP without backend infrastructure.

---

## 14. Cost-control rules

To keep the MVP near zero cost:

* compute fillers, pauses, WPM, and hedge detection locally
* do not call LLM on every transcript chunk
* only call LLM periodically or at end of session
* only generate one coaching message at a time
* only generate a final summary once per session

---

## 15. Edge cases

* user starts coaching outside Google Meet
* meeting URL cannot be extracted
* microphone permission denied
* Deepgram key missing or invalid
* LLM key missing or invalid
* transcript stream disconnects mid-session
* user closes side panel during active session
* user closes Meet tab during active session
* user starts multiple sessions accidentally

Expected MVP behavior:

* handle these cleanly
* do not lose existing session data
* show a simple error state

---

## 16. MVP release definition

Version 1 is complete when all of the following work:

* onboarding stores keys and local profile
* Start Coaching creates a session
* Google Meet link is captured
* transcript streams live
* fillers / pauses / WPM are tracked
* confidence score is computed
* relevance score works at a basic level
* session data persists locally
* user can review past sessions

---

## 17. Build order

### Phase 1

* extension shell
* side panel
* onboarding
* local storage model

### Phase 2

* session start/stop
* meet URL capture
* microphone capture
* Deepgram streaming transcript

### Phase 3

* local metric engine
* live dashboard
* timeline snapshots

### Phase 4

* summary generation
* relevance scoring
* session history and detail view

---

## 18. One-line product definition

SpeakBetter is a Chrome side-panel extension that analyzes a user’s live meeting speech, scores communication quality, stores sessions locally, and gives coaching feedback to help improve speaking over time.
