import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { db, now, j, jo, DATA_DIR, UPLOAD_DIR } from './db.js'
import { seedIfEmpty, DEMO } from './seed.js'
import { matchScore, normCourse, validCourse } from '../src/lib/match.js'
const here = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 4e3
const secretFile = path.join(DATA_DIR, '.jwt-secret')
const SECRET =
  process.env.JWT_SECRET ||
  (fs.existsSync(secretFile)
    ? fs.readFileSync(secretFile, 'utf8')
    : (() => {
        const s = crypto.randomBytes(32).toString('hex')
        fs.writeFileSync(secretFile, s, { mode: 384 })
        return s
      })())
const COURSES = [
  { code: 'CIS 1103', name: 'Introduction to Programming' },
  { code: 'CIS 2102', name: 'Data Structures' },
  { code: 'MATH 1101', name: 'Calculus I' },
  { code: 'PHYS 1101', name: 'General Physics' },
  { code: 'STAT 2101', name: 'Probability & Statistics' },
  { code: 'ENG 1101', name: 'Academic Writing' },
]
const GOALS = ['Ace the exams', 'Keep up with lectures', 'Project work', 'Deep understanding']
const YEARS = ['1st year', '2nd year', '3rd year', '4th year', 'Graduate', 'Other', 'Prefer not to say']
const SLOT = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)-(Mor|Aft|Eve)$/
const MAX_COURSES = 12
seedIfEmpty()
class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
const bad = (m) => new HttpError(400, m)
const wrap = (fn) => (req, res, next) => {
  try {
    fn(req, res, next)
  } catch (e) {
    next(e)
  }
}
const str = (v, max, field, { required = true } = {}) => {
  const s = typeof v === 'string' ? v.trim() : ''
  if (required && !s) throw bad(`${field} is required.`)
  if (s.length > max) throw bad(`${field} is too long (max ${max}).`)
  return s
}
const slots = (v) => {
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || !SLOT.test(x)))
    throw bad('Invalid availability.')
  return [...new Set(v)]
}
const uidFor = (viewer) => (id) => (id === viewer ? 'me' : String(id))
const publicUser = (u) => ({
  id: 'me',
  name: u.name,
  email: u.email,
  school: u.school,
  year: u.year,
  goal: u.goal,
  courses: j(u.courses),
  courseNames: jo(u.course_names),
  availability: j(u.availability),
})
const sign = (u) => jwt.sign({ sub: u.id }, SECRET, { expiresIn: '14d' })
function auth(req, _res, next) {
  const h = req.headers.authorization || ''
  try {
    const { sub } = jwt.verify(h.startsWith('Bearer ') ? h.slice(7) : '', SECRET)
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(sub)
    if (!user) throw new Error('gone')
    req.user = user
    next()
  } catch {
    next(new HttpError(401, 'Please log in.'))
  }
}
const getGroup = (id) => db.prepare('SELECT * FROM groups WHERE id = ?').get(id)
const isMember = (gid, uid) =>
  !!db.prepare('SELECT 1 FROM members WHERE group_id=? AND user_id=?').get(gid, uid)
const memberCount = (gid) => db.prepare('SELECT COUNT(*) c FROM members WHERE group_id=?').get(gid).c
function groupFor(req, { member = false } = {}) {
  const g = getGroup(Number(req.params.id))
  if (!g || g.school.toLowerCase() !== req.user.school.toLowerCase())
    throw new HttpError(404, 'Group not found.')
  if (member && !isMember(g.id, req.user.id)) throw new HttpError(403, 'Join this group first.')
  return g
}
function serializeGroups(rows, viewer) {
  const U = uidFor(viewer)
  const ids = rows.map((g) => g.id)
  const byGroup = new Map(ids.map((id) => [id, []]))
  if (ids.length) {
    const q = db
      .prepare(
        `SELECT m.group_id, u.id, u.name FROM members m JOIN users u ON u.id = m.user_id
      WHERE m.group_id IN (${ids.map(() => '?').join(',')}) ORDER BY m.joined_at, u.id`,
      )
      .all(...ids)
    q.forEach((r) => byGroup.get(r.group_id).push({ id: U(r.id), name: r.name }))
  }
  return rows.map((g) => ({
    id: String(g.id),
    course: g.course,
    name: g.name,
    goal: g.goal,
    capacity: g.capacity,
    place: g.place,
    blurb: g.blurb,
    avail: j(g.avail),
    members: byGroup.get(g.id),
    owner: g.created_by === viewer,
  }))
}
const serializeMessage = (m, viewer) => ({
  id: String(m.id),
  by: uidFor(viewer)(m.user_id),
  name: m.name,
  text: m.text,
  at: m.created_at,
})
function serializeSessions(gids, viewer) {
  if (!gids.length) return []
  const U = uidFor(viewer)
  const marks = gids.map(() => '?').join(',')
  const rows = db
    .prepare(`SELECT * FROM sessions WHERE group_id IN (${marks}) ORDER BY date, time`)
    .all(...gids)
  const rs = db
    .prepare(
      `SELECT r.session_id, r.user_id FROM rsvps r JOIN sessions s ON s.id=r.session_id WHERE s.group_id IN (${marks})`,
    )
    .all(...gids)
  return rows.map((s) => ({
    id: String(s.id),
    groupId: String(s.group_id),
    title: s.title,
    date: s.date,
    time: s.time,
    place: s.place,
    rsvp: rs.filter((r) => r.session_id === s.id).map((r) => U(r.user_id)),
  }))
}
function serializeItems(gids, viewer) {
  const out = {}
  if (!gids.length) return out
  const U = uidFor(viewer)
  const rows = db
    .prepare(
      `SELECT * FROM items WHERE group_id IN (${gids.map(() => '?').join(',')}) ORDER BY created_at DESC, id DESC`,
    )
    .all(...gids)
  for (const r of rows) {
    ;(out[r.group_id] ||= []).push({
      id: String(r.id),
      kind: r.kind,
      title: r.title,
      body: r.body,
      by: U(r.user_id),
      at: r.created_at,
      bytes: r.bytes,
      mime: r.mime,
      downloadable: !!r.stored_name,
    })
  }
  return out
}
function bootstrap(user) {
  const rows = db
    .prepare('SELECT * FROM groups WHERE lower(school) = lower(?) ORDER BY id DESC')
    .all(user.school)
  const groups = serializeGroups(rows, user.id)
  const mineIds = db
    .prepare('SELECT group_id FROM members WHERE user_id=?')
    .all(user.id)
    .map((r) => r.group_id)
  const messages = {}
  for (const gid of mineIds) {
    messages[gid] = db
      .prepare(
        `SELECT * FROM (SELECT m.*, u.name FROM messages m JOIN users u ON u.id=m.user_id WHERE m.group_id=? ORDER BY m.id DESC LIMIT 200) ORDER BY id`,
      )
      .all(gid)
      .map((m) => serializeMessage(m, user.id))
  }
  return {
    user: publicUser(user),
    groups,
    messages,
    sessions: serializeSessions(mineIds, user.id),
    files: serializeItems(mineIds, user.id),
  }
}
const join = (gid, uid) =>
  db.prepare('INSERT OR IGNORE INTO members (group_id,user_id,joined_at) VALUES (?,?,?)').run(gid, uid, now())
const app = express()
app.disable('x-powered-by')
if (process.env.TRUST_PROXY)
  app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY)
app.use(express.json({ limit: '100kb' }))
const hits = new Map()
const limit = (req, _res, next) => {
  const k = req.ip,
    t = Date.now()
  const arr = (hits.get(k) || []).filter((x) => t - x < 6e4)
  if (arr.length >= 15) return next(new HttpError(429, 'Too many attempts. Try again in a minute.'))
  arr.push(t)
  hits.set(k, arr)
  next()
}
const api = express.Router()
api.get('/health', (_q, r) => r.json({ ok: true }))
api.get('/catalog', (_q, r) => r.json({ courses: COURSES, goals: GOALS, years: YEARS }))
api.post(
  '/auth/signup',
  limit,
  wrap((req, res) => {
    const name = str(req.body.name, 80, 'Name')
    const email = str(req.body.email, 120, 'Email').toLowerCase()
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    const school = str(req.body.school, 120, 'School')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw bad('Enter a valid email.')
    if (password.length < 6 || password.length > 100) throw bad('Password must be 6\u2013100 characters.')
    if (db.prepare('SELECT 1 FROM users WHERE email=?').get(email))
      throw new HttpError(409, 'That email already has an account. Try logging in.')
    const id = db
      .prepare('INSERT INTO users (name,email,password_hash,school,created_at) VALUES (?,?,?,?,?)')
      .run(name, email, bcrypt.hashSync(password, 10), school, now()).lastInsertRowid
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(id)
    res.status(201).json({ token: sign(user), user: publicUser(user) })
  }),
)
const login = (email, password) => {
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(
    String(email || '')
      .trim()
      .toLowerCase(),
  )
  if (!u || !bcrypt.compareSync(String(password || ''), u.password_hash))
    throw new HttpError(401, 'No account matches that email and password.')
  return u
}
api.post(
  '/auth/login',
  limit,
  wrap((req, res) => {
    const user = login(req.body.email, req.body.password)
    res.json({ token: sign(user), user: publicUser(user) })
  }),
)
api.post(
  '/auth/demo',
  limit,
  wrap((_req, res) => {
    const user = login(DEMO.email, DEMO.password)
    const g = db.prepare("SELECT id FROM groups WHERE name='Data Structures Circle'").get()
    if (g) join(g.id, user.id)
    res.json({ token: sign(user), user: publicUser(user) })
  }),
)
api.use(auth)
api.get(
  '/bootstrap',
  wrap((req, res) => res.json(bootstrap(req.user))),
)
api.patch(
  '/me',
  wrap((req, res) => {
    const b = req.body,
      u = req.user
    const name = b.name !== void 0 ? str(b.name, 80, 'Name') : u.name
    const school = b.school !== void 0 ? str(b.school, 120, 'School') : u.school
    const year =
      b.year !== void 0
        ? YEARS.includes(b.year)
          ? b.year
          : (() => {
              throw bad('Invalid year.')
            })()
        : u.year
    const goal = b.goal !== void 0 ? str(b.goal, 80, 'Study goal') : u.goal
    let courses = j(u.courses)
    let courseNames = jo(u.course_names)
    if (b.courses !== void 0) {
      if (!Array.isArray(b.courses) || b.courses.length > MAX_COURSES)
        throw bad(`You can list up to ${MAX_COURSES} courses.`)
      courses = [...new Set(b.courses.map((c) => normCourse(typeof c === 'string' ? c : '')))]
      const badOne = courses.find((c) => !validCourse(c))
      if (badOne !== void 0)
        throw bad('Course codes use letters, numbers and spaces, like \u201CCIS 2102\u201D.')
    }
    if (b.courseNames !== void 0) {
      if (!b.courseNames || typeof b.courseNames !== 'object' || Array.isArray(b.courseNames))
        throw bad('Invalid course names.')
      courseNames = {}
      for (const [code, name2] of Object.entries(b.courseNames))
        courseNames[normCourse(code)] = str(name2, 80, 'Course name', { required: false })
    }
    courseNames = Object.fromEntries(courses.filter((c) => courseNames[c]).map((c) => [c, courseNames[c]]))
    const availability = b.availability !== void 0 ? slots(b.availability) : j(u.availability)
    db.prepare(
      'UPDATE users SET name=?,school=?,year=?,goal=?,courses=?,course_names=?,availability=? WHERE id=?',
    ).run(
      name,
      school,
      year,
      goal,
      JSON.stringify(courses),
      JSON.stringify(courseNames),
      JSON.stringify(availability),
      u.id,
    )
    res.json(bootstrap(db.prepare('SELECT * FROM users WHERE id=?').get(u.id)))
  }),
)
api.post(
  '/groups',
  wrap((req, res) => {
    const b = req.body
    const course = normCourse(typeof b.course === 'string' ? b.course : '')
    if (!validCourse(course))
      throw bad('Enter a course code like \u201CCIS 2102\u201D (letters, numbers and spaces).')
    const courseName = str(b.courseName, 80, 'Course name', { required: false })
    const goal = str(b.goal, 80, 'Study goal', { required: false }) || GOALS[0]
    const name = str(b.name, 60, 'Group name')
    const place = str(b.place, 300, 'Place', { required: false })
    const blurb = str(b.blurb, 200, 'Description', { required: false }) || 'A new study circle.'
    const avail = JSON.stringify(slots(b.avail || []))
    const id = db.transaction(() => {
      const mine = j(req.user.courses)
      const names = jo(req.user.course_names)
      if (!mine.includes(course)) {
        if (mine.length >= MAX_COURSES)
          throw bad(`You can list up to ${MAX_COURSES} courses. Remove one on your profile first.`)
        mine.push(course)
      }
      if (courseName && !names[course]) names[course] = courseName
      db.prepare('UPDATE users SET courses=?, course_names=? WHERE id=?').run(
        JSON.stringify(mine),
        JSON.stringify(names),
        req.user.id,
      )
      const gid = db
        .prepare(
          'INSERT INTO groups (course,name,goal,capacity,place,blurb,avail,school,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
        )
        .run(course, name, goal, 6, place, blurb, avail, req.user.school, req.user.id, now()).lastInsertRowid
      join(gid, req.user.id)
      return gid
    })()
    res
      .status(201)
      .json({ id: String(id), ...bootstrap(db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)) })
  }),
)
api.post(
  '/groups/:id/join',
  wrap((req, res) => {
    const g = groupFor(req)
    if (!j(req.user.courses).includes(g.course))
      throw new HttpError(403, 'Add this course to your profile to join.')
    const tx = db.transaction(() => {
      if (isMember(g.id, req.user.id)) return
      if (memberCount(g.id) >= g.capacity) throw new HttpError(409, 'This group is full.')
      join(g.id, req.user.id)
    })
    tx()
    res.json(bootstrap(req.user))
  }),
)
api.delete(
  '/groups/:id',
  wrap((req, res) => {
    const g = groupFor(req)
    if (g.created_by !== req.user.id)
      throw new HttpError(403, 'Only the person who created this group can delete it.')
    const files = db
      .prepare('SELECT stored_name FROM items WHERE group_id=? AND stored_name IS NOT NULL')
      .all(g.id)
    db.prepare('DELETE FROM groups WHERE id=?').run(g.id)
    files.forEach((f) => fs.rm(path.join(UPLOAD_DIR, f.stored_name), () => {}))
    res.status(204).end()
  }),
)
api.post(
  '/groups/:id/leave',
  wrap((req, res) => {
    const g = groupFor(req)
    db.prepare('DELETE FROM members WHERE group_id=? AND user_id=?').run(g.id, req.user.id)
    res.json(bootstrap(req.user))
  }),
)
api.post(
  '/automatch',
  wrap((req, res) => {
    const user = { courses: j(req.user.courses), availability: j(req.user.availability), goal: req.user.goal }
    const mine = new Set(
      db
        .prepare('SELECT g.course FROM members m JOIN groups g ON g.id=m.group_id WHERE m.user_id=?')
        .all(req.user.id)
        .map((r) => r.course),
    )
    const tx = db.transaction(() => {
      for (const course of user.courses) {
        if (mine.has(course)) continue
        const cands = db
          .prepare('SELECT * FROM groups WHERE course=? AND lower(school)=lower(?)')
          .all(course, req.user.school)
          .filter((g) => memberCount(g.id) < g.capacity)
          .map((g) => ({ g, score: matchScore(user, { ...g, avail: j(g.avail) }) }))
          .sort((a, b) => b.score - a.score)
        if (cands[0]) join(cands[0].g.id, req.user.id)
      }
    })
    tx()
    res.json(bootstrap(req.user))
  }),
)
api.get(
  '/groups/:id/messages',
  wrap((req, res) => {
    const g = groupFor(req, { member: true })
    const after = Number(req.query.after) || 0
    const rows = db
      .prepare(
        'SELECT m.*, u.name FROM messages m JOIN users u ON u.id=m.user_id WHERE m.group_id=? AND m.id>? ORDER BY m.id LIMIT 200',
      )
      .all(g.id, after)
    res.json(rows.map((m) => serializeMessage(m, req.user.id)))
  }),
)
api.post(
  '/groups/:id/messages',
  wrap((req, res) => {
    const g = groupFor(req, { member: true })
    const text = str(req.body.text, 2e3, 'Message')
    const id = db
      .prepare('INSERT INTO messages (group_id,user_id,text,created_at) VALUES (?,?,?,?)')
      .run(g.id, req.user.id, text, now()).lastInsertRowid
    res
      .status(201)
      .json(
        serializeMessage(
          db
            .prepare('SELECT m.*, u.name FROM messages m JOIN users u ON u.id=m.user_id WHERE m.id=?')
            .get(id),
          req.user.id,
        ),
      )
  }),
)
api.delete(
  '/messages/:mid',
  wrap((req, res) => {
    const m = db.prepare('SELECT * FROM messages WHERE id=?').get(Number(req.params.mid))
    if (!m) throw new HttpError(404, 'Message not found.')
    if (m.user_id !== req.user.id) throw new HttpError(403, 'You can only delete your own messages.')
    if (!isMember(m.group_id, req.user.id)) throw new HttpError(403, 'Join this group first.')
    db.prepare('DELETE FROM messages WHERE id=?').run(m.id)
    res.status(204).end()
  }),
)
api.post(
  '/groups/:id/sessions',
  wrap((req, res) => {
    const g = groupFor(req, { member: true })
    const date = str(req.body.date, 10, 'Date'),
      time = str(req.body.time, 5, 'Time')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw bad('Invalid date.')
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw bad('Invalid time.')
    const id = db
      .prepare('INSERT INTO sessions (group_id,title,date,time,place,created_by) VALUES (?,?,?,?,?,?)')
      .run(
        g.id,
        str(req.body.title, 100, 'Title'),
        date,
        time,
        str(req.body.place, 300, 'Place', { required: false }),
        req.user.id,
      ).lastInsertRowid
    db.prepare('INSERT INTO rsvps (session_id,user_id) VALUES (?,?)').run(id, req.user.id)
    res.status(201).json(serializeSessions([g.id], req.user.id).find((s) => s.id === String(id)))
  }),
)
function sessionFor(req) {
  const s = db.prepare('SELECT * FROM sessions WHERE id=?').get(Number(req.params.sid))
  if (!s) throw new HttpError(404, 'Session not found.')
  if (!isMember(s.group_id, req.user.id)) throw new HttpError(403, 'Join this group first.')
  return s
}
api.post(
  '/sessions/:sid/rsvp',
  wrap((req, res) => {
    const s = sessionFor(req)
    const had = db
      .prepare('DELETE FROM rsvps WHERE session_id=? AND user_id=?')
      .run(s.id, req.user.id).changes
    if (!had) db.prepare('INSERT INTO rsvps (session_id,user_id) VALUES (?,?)').run(s.id, req.user.id)
    res.json({ going: !had })
  }),
)
api.delete(
  '/sessions/:sid',
  wrap((req, res) => {
    const s = sessionFor(req)
    db.prepare('DELETE FROM sessions WHERE id=?').run(s.id)
    res.status(204).end()
  }),
)
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_q, _f, cb) => cb(null, crypto.randomBytes(16).toString('hex')),
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
})
api.post(
  '/groups/:id/notes',
  wrap((req, res) => {
    const g = groupFor(req, { member: true })
    db.prepare('INSERT INTO items (group_id,user_id,kind,title,body,created_at) VALUES (?,?,?,?,?,?)').run(
      g.id,
      req.user.id,
      'note',
      str(req.body.title, 120, 'Title'),
      str(req.body.body, 1e4, 'Note'),
      now(),
    )
    res.status(201).json({ ok: true })
  }),
)
api.post('/groups/:id/files', (req, res, next) => {
  try {
    groupFor(req, { member: true })
  } catch (e) {
    return next(e)
  }
  upload.single('file')(req, res, (err) => {
    if (err)
      return next(
        err.code === 'LIMIT_FILE_SIZE'
          ? new HttpError(413, 'File is too large (max 10 MB).')
          : bad('Upload failed.'),
      )
    if (!req.file) return next(bad('Choose a file to upload.'))
    const name = (req.file.originalname || 'file').replace(/[\r\n"]/g, '').slice(0, 120)
    db.prepare(
      'INSERT INTO items (group_id,user_id,kind,title,stored_name,mime,bytes,created_at) VALUES (?,?,?,?,?,?,?,?)',
    ).run(
      Number(req.params.id),
      req.user.id,
      'file',
      name,
      req.file.filename,
      req.file.mimetype,
      req.file.size,
      now(),
    )
    res.status(201).json({ ok: true })
  })
})
function itemFor(req) {
  const it = db.prepare('SELECT * FROM items WHERE id=?').get(Number(req.params.iid))
  if (!it) throw new HttpError(404, 'Item not found.')
  if (!isMember(it.group_id, req.user.id)) throw new HttpError(403, 'Join this group first.')
  return it
}
api.get(
  '/items/:iid/download',
  wrap((req, res) => {
    const it = itemFor(req)
    if (!it.stored_name) throw new HttpError(404, 'No file attached.')
    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.download(path.join(UPLOAD_DIR, it.stored_name), it.title)
  }),
)
api.delete(
  '/items/:iid',
  wrap((req, res) => {
    const it = itemFor(req)
    db.prepare('DELETE FROM items WHERE id=?').run(it.id)
    if (it.stored_name) fs.rm(path.join(UPLOAD_DIR, it.stored_name), () => {})
    res.status(204).end()
  }),
)
api.use((_q, _r, next) => next(new HttpError(404, 'Not found.')))
app.use('/api', api)
const dist = path.join(here, '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^\/(?!api\/).*/, (_q, r) => r.sendFile(path.join(dist, 'index.html')))
}
app.use((err, _req, res, _next) => {
  if (!(err instanceof HttpError)) console.error(err)
  const status = err.status || 500
  res.status(status).json({ error: status === 500 ? 'Something went wrong on the server.' : err.message })
})
app.listen(PORT, () =>
  console.log(`StudyCircle API on http://localhost:${PORT}  (demo login: ${DEMO.email} / ${DEMO.password})`),
)
