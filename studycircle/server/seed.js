import bcrypt from 'bcryptjs'
import { db, now } from './db.js'
const SCHOOL = 'University of San Carlos'
const iso = (off) => {
  const d = new Date()
  d.setDate(d.getDate() + off)
  return d.toISOString().slice(0, 10)
}
const ago = (m) => new Date(Date.now() - m * 6e4).toISOString()
export const DEMO = { email: 'alex@school.edu', password: 'demo1234' }
export function seedIfEmpty() {
  if (db.prepare('SELECT COUNT(*) c FROM users').get().c > 0) return false
  const hash = bcrypt.hashSync('password123', 10)
  const demoHash = bcrypt.hashSync(DEMO.password, 10)
  const addUser = db.prepare(
    `INSERT INTO users (name,email,password_hash,school,year,goal,courses,availability,created_at) VALUES (?,?,?,?,?,?,?,?,?)`,
  )
  const people = {}
  for (const [key, name] of Object.entries({
    ana: 'Ana Reyes',
    marco: 'Marco Dela Cruz',
    bea: 'Bea Santos',
    kai: 'Kai Lim',
    jo: 'Jo Villanueva',
    paolo: 'Paolo Tan',
    mika: 'Mika Ramos',
    ethan: 'Ethan Cruz',
  })) {
    people[key] = addUser.run(
      name,
      `${key}@school.edu`,
      hash,
      SCHOOL,
      '2nd year',
      'Ace the exams',
      '[]',
      '[]',
      now(),
    ).lastInsertRowid
  }
  addUser.run(
    'Alex Rivera',
    DEMO.email,
    demoHash,
    SCHOOL,
    '2nd year',
    'Ace the exams',
    JSON.stringify(['CIS 2102', 'MATH 1101']),
    JSON.stringify(['Tue-Eve', 'Thu-Eve', 'Sat-Aft', 'Mon-Aft', 'Wed-Aft']),
    now(),
  )
  const G = [
    [
      'CIS 2102',
      'Data Structures Circle',
      'Ace the exams',
      6,
      'Library 2F / Discord',
      'Weekly problem sets, then a mock quiz on Saturdays.',
      ['Tue-Eve', 'Thu-Eve', 'Sat-Aft'],
      ['ana', 'marco', 'bea', 'kai'],
    ],
    [
      'CIS 2102',
      'Late-night Debuggers',
      'Project work',
      5,
      'Discord',
      'We pair-program the course projects and trade code reviews.',
      ['Mon-Eve', 'Wed-Eve', 'Fri-Eve'],
      ['jo', 'paolo', 'mika'],
    ],
    [
      'CIS 2102',
      'Weekend Review Crew',
      'Deep understanding',
      6,
      'Cafeteria',
      'Slow and thorough. We re-derive every algorithm on the whiteboard.',
      ['Sat-Mor', 'Sun-Aft', 'Sun-Eve'],
      ['ethan', 'ana', 'kai', 'bea', 'jo'],
    ],
    [
      'MATH 1101',
      'Calculus Survivors',
      'Ace the exams',
      6,
      'Math Lounge',
      'Drilling past exams every Friday.',
      ['Mon-Aft', 'Wed-Aft', 'Fri-Aft'],
      ['mika', 'paolo', 'bea'],
    ],
    [
      'MATH 1101',
      'Limits & Coffee',
      'Keep up with lectures',
      5,
      'Coffee shop near gate 2',
      'Morning people. We recap the week over coffee.',
      ['Tue-Mor', 'Thu-Mor', 'Sat-Mor'],
      ['kai', 'jo'],
    ],
    [
      'PHYS 1101',
      'Force Awakens',
      'Keep up with lectures',
      6,
      'Physics Building',
      'Lab report buddies and problem-set swaps.',
      ['Tue-Aft', 'Thu-Aft'],
      ['marco', 'ethan', 'ana', 'mika'],
    ],
    [
      'STAT 2101',
      'p < 0.05 Club',
      'Ace the exams',
      6,
      'Discord',
      'We work through R and the textbook exercises together.',
      ['Wed-Eve', 'Sun-Eve'],
      ['bea', 'paolo'],
    ],
    [
      'CIS 1103',
      'Hello World Gang',
      'Keep up with lectures',
      8,
      'Computer Lab',
      'Beginner friendly. No question is too small.',
      ['Mon-Aft', 'Thu-Aft', 'Fri-Eve'],
      ['jo', 'kai', 'ethan'],
    ],
    [
      'ENG 1101',
      'Draft & Revise',
      'Project work',
      5,
      'Writing Center',
      'Peer review for essays before the deadline.',
      ['Tue-Eve', 'Sun-Aft'],
      ['ana', 'mika'],
    ],
  ]
  const addG = db.prepare(
    `INSERT INTO groups (course,name,goal,capacity,place,blurb,avail,school,created_at) VALUES (?,?,?,?,?,?,?,?,?)`,
  )
  const addM = db.prepare(`INSERT INTO members (group_id,user_id,joined_at) VALUES (?,?,?)`)
  const ids = G.map(([course, name, goal, cap, place, blurb, avail, members]) => {
    const gid = addG.run(
      course,
      name,
      goal,
      cap,
      place,
      blurb,
      JSON.stringify(avail),
      SCHOOL,
      now(),
    ).lastInsertRowid
    members.forEach((m) => addM.run(gid, people[m], now()))
    return gid
  })
  const msg = db.prepare(`INSERT INTO messages (group_id,user_id,text,created_at) VALUES (?,?,?,?)`)
  msg.run(
    ids[0],
    people.ana,
    'Hi everyone! Welcome to the circle \u{1F44B} Quiz 2 covers trees and heaps, right?',
    ago(300),
  )
  msg.run(
    ids[0],
    people.marco,
    "Yep. I'm still shaky on heap sort, anyone free to go over it Thursday?",
    ago(280),
  )
  msg.run(
    ids[0],
    people.bea,
    "I can walk through it Thursday evening, I made a diagram I'll upload to Notes & files.",
    ago(240),
  )
  msg.run(ids[0], people.kai, "Perfect. I'll book the session. Library 2F?", ago(200))
  msg.run(ids[1], people.jo, 'Anyone up for reviewing the linked list project tonight?', ago(500))
  const ses = db.prepare(
    `INSERT INTO sessions (group_id,title,date,time,place,created_by) VALUES (?,?,?,?,?,?)`,
  )
  const rsvp = db.prepare(`INSERT INTO rsvps (session_id,user_id) VALUES (?,?)`)
  const s1 = ses.run(
    ids[0],
    'Heap sort walkthrough',
    iso(2),
    '19:00',
    'Library 2F',
    people.kai,
  ).lastInsertRowid
  ;['ana', 'bea', 'kai'].forEach((p) => rsvp.run(s1, people[p]))
  const s2 = ses.run(
    ids[0],
    'Mock quiz: trees & heaps',
    iso(5),
    '15:00',
    'Discord',
    people.marco,
  ).lastInsertRowid
  rsvp.run(s2, people.marco)
  const item = db.prepare(
    `INSERT INTO items (group_id,user_id,kind,title,body,created_at) VALUES (?,?,?,?,?,?)`,
  )
  item.run(
    ids[0],
    people.bea,
    'note',
    'Heap sort cheat sheet',
    '1. Build max-heap (O(n))\n2. Swap root with last element\n3. Shrink heap, sift-down root\n4. Repeat until heap size is 1\n\nTotal: O(n log n), in-place, not stable.',
    ago(230),
  )
  item.run(
    ids[0],
    people.ana,
    'note',
    'BST deletion: 3 cases',
    'Leaf \u2192 remove.\nOne child \u2192 splice out.\nTwo children \u2192 replace with in-order successor, then delete the successor.',
    ago(900),
  )
  return true
}
