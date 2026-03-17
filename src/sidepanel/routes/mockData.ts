export type SessionRecord = {
  id: string
  title: string
  time: string
  duration: string
  confidence: string
  relevance: string
  pace: string
  fillers: string
  fillersPerMinute: string
  averagePause: string
  longestPause: string
  hedgeCount: string
  hesitationCount: string
  feedback: string
  verdict: string
  strengths: string[]
  weaknesses: string[]
  actions: string[]
  transcript: string[]
  meetLink: string
}

export const activeMeeting = {
  title: 'Product strategy sync',
  source: 'Google Meet',
  link: 'https://meet.google.com/qmv-hfss-zky',
  elapsed: '09:42 elapsed',
}

export const dashboardScoreTiles = [
  { label: 'Sessions', value: '12', detail: 'last 30 days' },
  { label: 'Confidence', value: '82', detail: 'avg score' },
  { label: 'Fillers', value: '1.9', detail: 'per minute' },
]

export const liveMetrics = [
  { label: 'Fillers', value: '6', detail: '1 in last minute' },
  { label: 'Fillers/min', value: '1.6', detail: 'better than average' },
  { label: 'WPM', value: '142', detail: 'steady pace' },
  { label: 'Pause avg', value: '1.4s', detail: 'clean response timing' },
  { label: 'Confidence', value: '84', detail: 'strong delivery' },
  { label: 'Relevance', value: '79', detail: 'on topic' },
]

export const liveTrendRows = [
  { label: 'Pace', detail: 'Slightly higher than your recent average.' },
  { label: 'Confidence', detail: 'Stable after the opening minute.' },
  { label: 'Relevance', detail: 'Staying aligned with the main discussion.' },
]

export const mockSessions: SessionRecord[] = [
  {
    id: 'session-1',
    title: 'Product strategy sync',
    time: 'Today, 9:42 AM',
    duration: '34 min',
    confidence: '84',
    relevance: '79',
    pace: '141 WPM',
    fillers: '6',
    fillersPerMinute: '1.6',
    averagePause: '1.4s',
    longestPause: '3.1s',
    hedgeCount: '3',
    hesitationCount: '4',
    feedback: 'Good clarity. Shorten your pauses before the first answer.',
    verdict: 'Clear delivery, but longer pauses softened some of your strongest points.',
    strengths: ['Strong clarity in answer structure', 'Calm pace through follow-up questions'],
    weaknesses: ['Pauses stretched before direct answers', 'A few filler words slipped in under pressure'],
    actions: ['Lead with the answer first', 'Reduce setup phrases before key points', 'Hold steady pace through objections'],
    transcript: [
      'We should start with the rollout risk, then explain the implementation plan.',
      'The fastest version is shipping the side panel flow first and tuning the coaching after that.',
      'That gives us a cleaner baseline for comparing future sessions.',
    ],
    meetLink: 'https://meet.google.com/qmv-hfss-zky',
  },
  {
    id: 'session-2',
    title: 'Customer discovery call',
    time: 'Yesterday, 4:10 PM',
    duration: '27 min',
    confidence: '76',
    relevance: '82',
    pace: '136 WPM',
    fillers: '8',
    fillersPerMinute: '2.1',
    averagePause: '1.7s',
    longestPause: '4.0s',
    hedgeCount: '5',
    hesitationCount: '6',
    feedback: 'Tone stayed calm. Remove filler words during objection handling.',
    verdict: 'Good relevance, but filler words weakened confidence during the hardest moments.',
    strengths: ['Stayed on topic throughout the call', 'Handled objections without rushing'],
    weaknesses: ['Filler words increased during objections', 'Hedging language softened conviction'],
    actions: ['Replace filler resets with a short pause', 'Use firmer sentence openings', 'Practice objection answers aloud'],
    transcript: [
      'The main issue customers mention is setup friction in the first session.',
      'We can reduce that if the dashboard is ready immediately after onboarding.',
      'That should make the value more obvious in the first two minutes.',
    ],
    meetLink: 'https://meet.google.com/abx-cdef-ghj',
  },
  {
    id: 'session-3',
    title: 'Weekly standup',
    time: 'Mar 14, 10:00 AM',
    duration: '18 min',
    confidence: '79',
    relevance: '85',
    pace: '145 WPM',
    fillers: '5',
    fillersPerMinute: '1.8',
    averagePause: '1.2s',
    longestPause: '2.4s',
    hedgeCount: '2',
    hesitationCount: '3',
    feedback: 'Stronger structure this time. Lead with the answer faster.',
    verdict: 'Pacing improved, and the structure was clearer than your prior baseline.',
    strengths: ['Crisp update structure', 'Stronger pacing than previous sessions'],
    weaknesses: ['Intro to answers still slightly long', 'A few pauses before direct status updates'],
    actions: ['Start with outcome, then context', 'Trim update intros', 'Keep mid-sentence pauses short'],
    transcript: [
      'The onboarding flow is stable and the next screens are lined up for implementation.',
      'The main risk is tying too much polish into the first pass.',
      'We should finish the core screen flow before deeper interaction work.',
    ],
    meetLink: 'https://meet.google.com/xyz-mnop-qrs',
  },
]
