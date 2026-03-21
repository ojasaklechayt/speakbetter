import type { CommunicationSession } from '../../services/session-manager'
import { groupTranscriptPoints } from '../../utils/transcript'

type SessionDetailScreenProps = {
  sessionId: string
  session?: CommunicationSession | null
  onBack?: () => void
}

function SessionDetailScreen({ sessionId, session, onBack }: SessionDetailScreenProps) {
  const transcriptLines = groupTranscriptPoints(session?.liveSession.transcript ?? [])

  return (
    <div className="flex h-full flex-col bg-[#fcfaf7]">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Session detail
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950">
              {session?.metadata.title || 'No session selected'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {session?.postSession.verdict || session?.liveSession.insight.description || 'Session insights will appear here after you complete a meeting.'}
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

        {session ? (
          <>
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Verdict
              </p>
              <p className="mt-3 text-base font-semibold leading-6 text-slate-950">
                {session.postSession.verdict || 'Post-session verdict not generated yet.'}
              </p>
            </section>

            <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Strengths
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-700">
                {session.postSession.strengths.length > 0 ? (
                  session.postSession.strengths.map((strength) => (
                    <span
                      key={strength}
                      className="rounded-full bg-emerald-50 px-3 py-1 ring-1 ring-emerald-200"
                    >
                      {strength}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">No strengths captured yet.</span>
                )}
              </div>
            </section>

            <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Needs Work
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                {session.postSession.needsWork.length > 0 ? (
                  session.postSession.needsWork.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li className="text-slate-500">No post-session items captured yet.</li>
                )}
              </ul>
            </section>

            <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Transcript
              </p>
              <div className="mt-3 space-y-2">
                {transcriptLines.length > 0 ? (
                  transcriptLines.map((line, index) => (
                    <p key={`${index}-${line}`} className="text-sm leading-6 text-slate-700">
                      {line}
                    </p>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-slate-500">
                    No transcript captured for this session yet.
                  </p>
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="mt-5 rounded-[1.8rem] border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-950">No completed session data</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Start a meeting session, stop coaching when you are done, and this screen can show your
              verdict, transcript excerpts, strengths, and next steps.
            </p>
            {sessionId ? (
              <p className="mt-3 text-xs text-slate-500">Requested session id: {sessionId}</p>
            ) : null}
          </section>
        )}
      </div>
    </div>
  )
}

export default SessionDetailScreen
