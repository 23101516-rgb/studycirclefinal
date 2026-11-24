import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const here = path.dirname(fileURLToPath(import.meta.url))
const PORT = 4100 + Math.floor(Math.random() * 500)
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'studycircle-test-'))
const server = spawn(process.execPath, [path.join(here, 'index.js')], {
  env: { ...process.env, PORT, DATA_DIR: dir },
  stdio: 'ignore',
})
const cleanup = () => {
  server.kill()
  fs.rmSync(dir, { recursive: true, force: true })
}
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(`http://localhost:${PORT}/api/health`)).ok) break
  } catch {}
  await new Promise((r) => setTimeout(r, 100))
}
const exit = (c) => {
  cleanup()
  process.exit(c)
}
const B = `http://localhost:${PORT}/api`
let pass = 0,
  fail = 0
const ok = (c, m) => {
  c ? pass++ : (fail++, console.log('FAIL:', m))
}
const call = async (method, path2, { token, body, form } = {}) => {
  const r = await fetch(B + path2, {
    method,
    headers: {
      ...(token && { Authorization: 'Bearer ' + token }),
      ...(body && { 'Content-Type': 'application/json' }),
    },
    body: form || (body && JSON.stringify(body)),
  })
  const t = await r.text()
  let d
  try {
    d = JSON.parse(t)
  } catch {
    d = t
  }
  return { s: r.status, d }
}
ok((await call('GET', '/bootstrap')).s === 401, 'bootstrap needs login')
ok(
  (await call('POST', '/auth/login', { body: { email: 'alex@school.edu', password: 'wrong' } })).s === 401,
  'bad password rejected',
)
const demo = (await call('POST', '/auth/demo')).d
ok(demo.token, 'demo login')
const A = demo.token
let boot = (await call('GET', '/bootstrap', { token: A })).d
ok(boot.groups.length === 9, '9 seeded groups visible')
ok(boot.user.id === 'me', 'user is me')
const g1 = boot.groups.find((g) => g.name === 'Data Structures Circle')
ok(
  g1.members.some((m) => m.id === 'me'),
  'demo is member of g1',
)
ok(boot.messages[g1.id].length >= 4, 'chat history loads')
ok(
  (
    await call('POST', '/auth/signup', {
      body: { name: 'X', email: 'bad', password: 'secret1', school: 'USC' },
    })
  ).s === 400,
  'bad email rejected',
)
ok(
  (
    await call('POST', '/auth/signup', {
      body: { name: 'X', email: 'alex@school.edu', password: 'secret1', school: 'USC' },
    })
  ).s === 409,
  'dup email rejected',
)
const b = (
  await call('POST', '/auth/signup', {
    body: { name: 'Bob Tester', email: 'bob@x.edu', password: 'secret1', school: 'University of San Carlos' },
  })
).d
const Bt = b.token
ok(Bt, 'signup ok')
ok((await call('GET', `/groups/${g1.id}/messages`, { token: Bt })).s === 403, 'non-member cannot read chat')
ok(
  (await call('POST', `/groups/${g1.id}/messages`, { token: Bt, body: { text: 'hi' } })).s === 403,
  'non-member cannot post',
)
ok(
  (await call('POST', `/groups/${g1.id}/notes`, { token: Bt, body: { title: 't', body: 'b' } })).s === 403,
  'non-member cannot add note',
)
ok((await call('POST', `/groups/${g1.id}/join`, { token: Bt })).s === 403, 'cannot join without course')
let pr = await call('PATCH', '/me', {
  token: Bt,
  body: { courses: ['CIS 2102'], availability: ['Tue-Eve', 'Thu-Eve'], goal: 'Ace the exams' },
})
ok(pr.s === 200 && pr.d.user.courses[0] === 'CIS 2102', 'profile saved')
ok(
  (await call('PATCH', '/me', { token: Bt, body: { courses: ['<script>'] } })).s === 400,
  'invalid course rejected',
)
ok(
  (await call('PATCH', '/me', { token: Bt, body: { availability: ['Funday-Eve'] } })).s === 400,
  'invalid slot rejected',
)
const am = (await call('POST', '/automatch', { token: Bt })).d
const joined = am.groups.filter((g) => g.members.some((m) => m.id === 'me'))
ok(
  joined.length === 1 && joined[0].name === 'Data Structures Circle',
  'automatch -> best group: ' + joined.map((g) => g.name),
)
ok(
  (await call('POST', `/groups/${g1.id}/messages`, { token: Bt, body: { text: 'Hello from Bob' } })).s ===
    201,
  'post message',
)
const seen = (await call('GET', `/groups/${g1.id}/messages?after=0`, { token: A })).d
ok(
  seen.at(-1).text === 'Hello from Bob' && seen.at(-1).by !== 'me' && seen.at(-1).name === 'Bob Tester',
  'demo user sees Bob message as not-me',
)
ok(
  (await call('POST', `/groups/${g1.id}/messages`, { token: Bt, body: { text: '   ' } })).s === 400,
  'empty message rejected',
)
const full = (
  await call('POST', '/auth/signup', {
    body: { name: 'Carl', email: 'carl@x.edu', password: 'secret1', school: 'University of San Carlos' },
  })
).d.token
await call('PATCH', '/me', { token: full, body: { courses: ['CIS 2102'] } })
ok((await call('POST', `/groups/${g1.id}/join`, { token: full })).s === 409, 'full group rejects join')
const s = await call('POST', `/groups/${g1.id}/sessions`, {
  token: Bt,
  body: { title: 'Bob study', date: '2030-01-05', time: '18:30', place: 'Lib' },
})
ok(s.s === 201 && s.d.rsvp[0] === 'me', 'session created w/ creator rsvp')
ok(
  (
    await call('POST', `/groups/${g1.id}/sessions`, {
      token: Bt,
      body: { title: 'x', date: '2030-13-45', time: '99:99' },
    })
  ).s === 400,
  'bad date rejected',
)
ok((await call('POST', `/sessions/${s.d.id}/rsvp`, { token: A })).d.going === true, 'demo rsvp on')
ok((await call('POST', `/sessions/${s.d.id}/rsvp`, { token: A })).d.going === false, 'demo rsvp off')
ok((await call('POST', `/sessions/${s.d.id}/rsvp`, { token: full })).s === 403, 'non-member cannot rsvp')
const fd = new FormData()
fd.append('file', new Blob(['hello file']), 'a"b.txt')
ok((await call('POST', `/groups/${g1.id}/files`, { token: Bt, form: fd })).s === 201, 'upload')
const items = (await call('GET', '/bootstrap', { token: A })).d.files[g1.id]
const f = items.find((i) => i.kind === 'file')
ok(f && f.downloadable && f.bytes === 10, 'file listed')
const dl = await fetch(`${B}/items/${f.id}/download`, { headers: { Authorization: 'Bearer ' + A } })
ok(dl.status === 200 && (await dl.text()) === 'hello file', 'member downloads file')
ok(dl.headers.get('content-type') === 'application/octet-stream', 'download is octet-stream')
ok(
  (await fetch(`${B}/items/${f.id}/download`, { headers: { Authorization: 'Bearer ' + full } })).status ===
    403,
  'non-member cannot download',
)
ok((await fetch(`${B}/items/${f.id}/download`)).status === 401, 'anonymous cannot download')
const big = new FormData()
big.append('file', new Blob([new Uint8Array(11 * 1024 * 1024)]), 'big.bin')
ok((await call('POST', `/groups/${g1.id}/files`, { token: Bt, form: big })).s === 413, '>10MB rejected')
ok((await call('DELETE', `/items/${f.id}`, { token: Bt })).s === 204, 'delete file')
const other = (
  await call('POST', '/auth/signup', {
    body: { name: 'Zed', email: 'zed@x.edu', password: 'secret1', school: 'Other University' },
  })
).d.token
ok(
  (await call('GET', '/bootstrap', { token: other })).d.groups.length === 0,
  'other school sees no USC groups',
)
ok((await call('POST', `/groups/${g1.id}/join`, { token: other })).s === 404, 'cross-school join blocked')
const cg = await call('POST', '/groups', {
  token: Bt,
  body: { name: 'Tree Huggers', course: 'CIS 2102', goal: 'Project work', avail: ['Mon-Eve'] },
})
ok(cg.s === 201 && cg.d.id, 'group created')
const parent = (await call('GET', `/groups/${g1.id}/messages?after=0`, { token: A })).d.at(-1)
const rep = await call('POST', `/groups/${g1.id}/messages`, {
  token: Bt,
  body: { text: 'reply test', replyTo: parent.id },
})
ok(rep.s === 201 && rep.d.replyTo && rep.d.replyTo.id === parent.id, 'reply to a message')
ok(
  (await call('POST', `/groups/${g1.id}/messages`, { token: Bt, body: { text: 'bad', replyTo: '999999' } }))
    .s === 400,
  'reply to missing message rejected',
)
const mm = (await call('GET', `/groups/${g1.id}/messages?after=0`, { token: Bt })).d.find(
  (m) => m.text === 'Hello from Bob',
)
ok(
  (await call('DELETE', `/messages/${mm.id}`, { token: A })).s === 403,
  "cannot delete someone else's message",
)
ok((await call('DELETE', `/messages/${mm.id}`, { token: other })).s === 403, 'outsider cannot delete message')
ok((await call('DELETE', `/messages/${mm.id}`, { token: Bt })).s === 204, 'author deletes own message')
ok(
  !(await call('GET', `/groups/${g1.id}/messages?after=0`, { token: A })).d.some((m) => m.id === mm.id),
  'deleted message is gone for others',
)
ok((await call('DELETE', `/messages/${mm.id}`, { token: Bt })).s === 404, 'deleting twice -> 404')
const myG = (await call('GET', '/bootstrap', { token: Bt })).d.groups
ok(
  myG.find((g) => g.id === cg.d.id).owner === true && myG.find((g) => g.id === g1.id).owner === false,
  'owner flag',
)
ok((await call('DELETE', `/groups/${cg.d.id}`, { token: A })).s === 403, 'non-owner cannot delete group')
ok(
  (await call('DELETE', `/groups/${g1.id}`, { token: Bt })).s === 403,
  'member of seeded group cannot delete it',
)
ok((await call('DELETE', `/groups/${cg.d.id}`, { token: Bt })).s === 204, 'owner deletes group')
ok(
  !(await call('GET', '/bootstrap', { token: Bt })).d.groups.some((g) => g.id === cg.d.id),
  'deleted group is gone',
)
ok((await call('DELETE', `/groups/${cg.d.id}`, { token: Bt })).s === 404, 'deleting group twice -> 404')
const link = 'https://us02web.zoom.us/j/84291234567?pwd=' + 'a'.repeat(120)
const ls = await call('POST', `/groups/${g1.id}/sessions`, {
  token: A,
  body: { title: 'Zoom night', date: '2030-02-01', time: '20:00', place: link },
})
ok(ls.s === 201 && ls.d.place === link, 'long meeting link accepted for session place')
const C1 = (
  await call('POST', '/auth/signup', {
    body: { name: 'Cora', email: 'cora@x.edu', password: 'secret1', school: 'University of San Carlos' },
  })
).d.token
let cp = await call('PATCH', '/me', {
  token: C1,
  body: {
    courses: ['cis2102', 'bio 101', 'cis2102'],
    courseNames: { cis2102: 'Data Structures', 'BIO 101': 'Intro Biology', 'GONE 1': 'ignored' },
    goal: 'Pass the board exam',
  },
})
ok(cp.s === 200, 'custom courses accepted')
ok(
  JSON.stringify(cp.d.user.courses) === JSON.stringify(['CIS 2102', 'BIO 101']),
  'codes normalised and de-duplicated: ' + cp.d.user.courses,
)
ok(
  cp.d.user.courseNames['CIS 2102'] === 'Data Structures' &&
    cp.d.user.courseNames['BIO 101'] === 'Intro Biology' &&
    !cp.d.user.courseNames['GONE 1'],
  'course names saved, stray names dropped',
)
ok(cp.d.user.goal === 'Pass the board exam', 'custom goal saved')
cp = await call('PATCH', '/me', { token: C1, body: { courses: ['BIO 102'] } })
ok(
  cp.d.user.courses[0] === 'BIO 102' && Object.keys(cp.d.user.courseNames).length === 0,
  'editing/removing a course drops its old name',
)
ok(
  (
    await call('PATCH', '/me', {
      token: C1,
      body: { courses: Array.from({ length: 13 }, (_, i) => 'X ' + i) },
    })
  ).s === 400,
  'more than 12 courses rejected',
)
ok(
  (await call('PATCH', '/me', { token: C1, body: { goal: 'x'.repeat(81) } })).s === 400,
  'goal over 80 chars rejected',
)
ok((await call('PATCH', '/me', { token: C1, body: { goal: '   ' } })).s === 400, 'blank goal rejected')
ok(
  (await call('POST', '/groups', { token: C1, body: { name: 'Nope', course: '###' } })).s === 400,
  'invalid course code rejected when creating a group',
)
const ng = await call('POST', '/groups', {
  token: C1,
  body: {
    name: 'Chem Club',
    course: 'chem 201',
    courseName: 'Organic Chemistry',
    goal: 'Ace the exams',
    avail: [],
  },
})
ok(
  ng.s === 201 &&
    ng.d.user.courses.includes('CHEM 201') &&
    ng.d.user.courseNames['CHEM 201'] === 'Organic Chemistry',
  'new course typed in New group is added to my profile with its name',
)
ok(
  ng.d.groups.find((g) => g.id === ng.d.id).members.some((m) => m.id === 'me'),
  'creator is a member of the group',
)
const ng2 = await call('POST', '/groups', {
  token: C1,
  body: { name: 'Chem Club 2', course: 'CHEM 201', courseName: 'Renamed?', avail: [] },
})
ok(
  ng2.d.user.courseNames['CHEM 201'] === 'Organic Chemistry' &&
    ng2.d.user.courses.filter((c) => c === 'CHEM 201').length === 1,
  'existing course/name not duplicated or overwritten',
)
const full12 = await call('PATCH', '/me', {
  token: C1,
  body: { courses: Array.from({ length: 12 }, (_, i) => 'FULL ' + i) },
})
ok(
  (await call('POST', '/groups', { token: C1, body: { name: 'Too many', course: 'NEW 999' } })).s === 400,
  'cannot exceed 12 courses via New group',
)
await call('PATCH', '/me', { token: C1, body: { courses: ['BIO 102'] } })
const cg2 = await call('POST', '/groups', {
  token: C1,
  body: { name: 'Bio Buddies', course: 'bio102', goal: 'Finish my thesis', avail: [] },
})
ok(
  cg2.s === 201 &&
    cg2.d.groups.find((g) => g.id === cg2.d.id).course === 'BIO 102' &&
    cg2.d.groups.find((g) => g.id === cg2.d.id).goal === 'Finish my thesis',
  'group for custom course + custom goal',
)
console.log(`
${pass} passed, ${fail} failed`)
exit(fail ? 1 : 0)
