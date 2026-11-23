export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const BLOCKS = [
  { id: 'Mor', label: 'Morning', hint: '8\u201312' },
  { id: 'Aft', label: 'Afternoon', hint: '1\u20135' },
  { id: 'Eve', label: 'Evening', hint: '6\u201310' },
]
export const GOALS = ['Ace the exams', 'Keep up with lectures', 'Project work', 'Deep understanding']
export const COURSES = [
  { code: 'CIS 1103', name: 'Introduction to Programming' },
  { code: 'CIS 2102', name: 'Data Structures' },
  { code: 'MATH 1101', name: 'Calculus I' },
  { code: 'PHYS 1101', name: 'General Physics' },
  { code: 'STAT 2101', name: 'Probability & Statistics' },
  { code: 'ENG 1101', name: 'Academic Writing' },
]
export const SCHOOLS = [
  'University of San Carlos',
  'University of the Philippines',
  'Ateneo de Manila University',
  'De La Salle University',
  'University of Santo Tomas',
]
const P = (id, name) => ({ id, name })
export const PEOPLE = {
  ana: P('ana', 'Ana Reyes'),
  marco: P('marco', 'Marco Dela Cruz'),
  bea: P('bea', 'Bea Santos'),
  kai: P('kai', 'Kai Lim'),
  jo: P('jo', 'Jo Villanueva'),
  paolo: P('paolo', 'Paolo Tan'),
  mika: P('mika', 'Mika Ramos'),
  ethan: P('ethan', 'Ethan Cruz'),
}
const M = (...k) => k.map((x) => PEOPLE[x])
export const seedGroups = [
  {
    id: 'g1',
    course: 'CIS 2102',
    name: 'Data Structures Circle',
    goal: 'Ace the exams',
    capacity: 6,
    place: 'Library 2F / Discord',
    avail: ['Tue-Eve', 'Thu-Eve', 'Sat-Aft'],
    members: M('ana', 'marco', 'bea', 'kai'),
    blurb: 'Weekly problem sets, then a mock quiz on Saturdays.',
  },
  {
    id: 'g2',
    course: 'CIS 2102',
    name: 'Late-night Debuggers',
    goal: 'Project work',
    capacity: 5,
    place: 'Discord',
    avail: ['Mon-Eve', 'Wed-Eve', 'Fri-Eve'],
    members: M('jo', 'paolo', 'mika'),
    blurb: 'We pair-program the course projects and trade code reviews.',
  },
  {
    id: 'g3',
    course: 'CIS 2102',
    name: 'Weekend Review Crew',
    goal: 'Deep understanding',
    capacity: 6,
    place: 'Cafeteria',
    avail: ['Sat-Mor', 'Sun-Aft', 'Sun-Eve'],
    members: M('ethan', 'ana', 'kai', 'bea', 'jo'),
    blurb: 'Slow and thorough. We re-derive every algorithm on the whiteboard.',
  },
  {
    id: 'g4',
    course: 'MATH 1101',
    name: 'Calculus Survivors',
    goal: 'Ace the exams',
    capacity: 6,
    place: 'Math Lounge',
    avail: ['Mon-Aft', 'Wed-Aft', 'Fri-Aft'],
    members: M('mika', 'paolo', 'bea'),
    blurb: 'Drilling past exams every Friday.',
  },
  {
    id: 'g5',
    course: 'MATH 1101',
    name: 'Limits & Coffee',
    goal: 'Keep up with lectures',
    capacity: 5,
    place: 'Coffee shop near gate 2',
    avail: ['Tue-Mor', 'Thu-Mor', 'Sat-Mor'],
    members: M('kai', 'jo'),
    blurb: 'Morning people. We recap the week over coffee.',
  },
  {
    id: 'g6',
    course: 'PHYS 1101',
    name: 'Force Awakens',
    goal: 'Keep up with lectures',
    capacity: 6,
    place: 'Physics Building',
    avail: ['Tue-Aft', 'Thu-Aft'],
    members: M('marco', 'ethan', 'ana', 'mika'),
    blurb: 'Lab report buddies and problem-set swaps.',
  },
  {
    id: 'g7',
    course: 'STAT 2101',
    name: 'p < 0.05 Club',
    goal: 'Ace the exams',
    capacity: 6,
    place: 'Discord',
    avail: ['Wed-Eve', 'Sun-Eve'],
    members: M('bea', 'paolo'),
    blurb: 'We work through R and the textbook exercises together.',
  },
  {
    id: 'g8',
    course: 'CIS 1103',
    name: 'Hello World Gang',
    goal: 'Keep up with lectures',
    capacity: 8,
    place: 'Computer Lab',
    avail: ['Mon-Aft', 'Thu-Aft', 'Fri-Eve'],
    members: M('jo', 'kai', 'ethan'),
    blurb: 'Beginner friendly. No question is too small.',
  },
  {
    id: 'g9',
    course: 'ENG 1101',
    name: 'Draft & Revise',
    goal: 'Project work',
    capacity: 5,
    place: 'Writing Center',
    avail: ['Tue-Eve', 'Sun-Aft'],
    members: M('ana', 'mika'),
    blurb: 'Peer review for essays before the deadline.',
  },
]
const iso = (offset) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}
const mins = (m) => new Date(Date.now() - m * 6e4).toISOString()
export const seedMessages = () => ({
  g1: [
    {
      id: 'm1',
      by: 'ana',
      text: 'Hi everyone! Welcome to the circle \u{1F44B} Quiz 2 covers trees and heaps, right?',
      at: mins(300),
    },
    {
      id: 'm2',
      by: 'marco',
      text: "Yep. I'm still shaky on heap sort, anyone free to go over it Thursday?",
      at: mins(280),
    },
    {
      id: 'm3',
      by: 'bea',
      text: "I can walk through it Thursday evening, I made a diagram I'll upload to Notes & files.",
      at: mins(240),
    },
    { id: 'm4', by: 'kai', text: "Perfect. I'll book the session. Library 2F?", at: mins(200) },
  ],
  g2: [
    { id: 'm5', by: 'jo', text: 'Anyone up for reviewing the linked list project tonight?', at: mins(500) },
  ],
})
export const seedSessions = () => [
  {
    id: 's1',
    groupId: 'g1',
    title: 'Heap sort walkthrough',
    date: iso(2),
    time: '19:00',
    place: 'Library 2F',
    rsvp: ['ana', 'bea', 'kai'],
  },
  {
    id: 's2',
    groupId: 'g1',
    title: 'Mock quiz: trees & heaps',
    date: iso(5),
    time: '15:00',
    place: 'Discord',
    rsvp: ['marco'],
  },
]
export const seedFiles = () => ({
  g1: [
    {
      id: 'f1',
      kind: 'note',
      title: 'Heap sort cheat sheet',
      body: '1. Build max-heap (O(n))\n2. Swap root with last element\n3. Shrink heap, sift-down root\n4. Repeat until heap size is 1\n\nTotal: O(n log n), in-place, not stable.',
      by: 'bea',
      at: mins(230),
    },
    {
      id: 'f2',
      kind: 'note',
      title: 'BST deletion: 3 cases',
      body: 'Leaf \u2192 remove.\nOne child \u2192 splice out.\nTwo children \u2192 replace with in-order successor, then delete the successor.',
      by: 'ana',
      at: mins(900),
    },
  ],
})
export const DEMO_USER = {
  id: 'me',
  name: 'Alex Rivera',
  email: 'alex@school.edu',
  school: 'University of San Carlos',
  year: '2nd year',
  goal: 'Ace the exams',
  courses: ['CIS 2102', 'MATH 1101'],
  availability: ['Tue-Eve', 'Thu-Eve', 'Sat-Aft', 'Mon-Aft', 'Wed-Aft'],
}
