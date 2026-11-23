import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Plus, Sparkles, Clock, Check } from 'lucide-react'
import { useStore } from '../store'
import { COURSES, GOALS } from '../data/seed'
import { isFull, isMember, matchScore, overlap, slotLabel, normCourse, validCourse } from '../lib/match'
import { AvatarStack, Tag, AvailabilityGrid, Empty } from '../components/ui'
export default function FindGroups() {
  const { state, dispatch } = useStore()
  const { user, groups } = state
  const nav = useNavigate()
  const [course, setCourse] = useState('mine')
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const courseChips = useMemo(
    () => [...new Set([...user.courses, ...groups.map((g) => g.course)])].sort(),
    [user.courses, groups],
  )
  const list = useMemo(
    () =>
      groups
        .filter((g) =>
          course === 'mine' ? user.courses.includes(g.course) : course === 'all' ? true : g.course === course,
        )
        .filter((g) => `${g.name} ${g.course} ${g.goal}`.toLowerCase().includes(q.toLowerCase()))
        .map((g) => ({ g, score: matchScore(user, g), shared: overlap(user.availability, g.avail) }))
        .sort((a, b) => b.score - a.score || a.g.name.localeCompare(b.g.name)),
    [groups, course, q, user],
  )
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Find groups</p>
          <h1>Study groups for your courses</h1>
          <p className="muted">Ranked by how well their schedule and goal match yours.</p>
        </div>
        <div className="row gap">
          <button className="btn btn-outline" onClick={() => dispatch({ type: 'automatch' })}>
            <Sparkles size={16} /> Auto-match me
          </button>
          <button className="btn btn-primary" onClick={() => setCreating(!creating)}>
            <Plus size={16} /> New group
          </button>
        </div>
      </header>
      {creating && (
        <CreateGroup
          onDone={(id) => {
            setCreating(false)
            id && nav(`/app/groups/${id}`)
          }}
        />
      )}
      <div className="toolbar">
        <label className="search">
          <Search size={16} />
          <input
            placeholder="Search groups"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search groups"
          />
        </label>
        <div className="chips" role="tablist" aria-label="Filter by course">
          <button className={`chip ${course === 'mine' ? 'on' : ''}`} onClick={() => setCourse('mine')}>
            My courses
          </button>
          <button className={`chip ${course === 'all' ? 'on' : ''}`} onClick={() => setCourse('all')}>
            All
          </button>
          {courseChips.map((code) => (
            <button
              key={code}
              className={`chip ${course === code ? 'on' : ''}`}
              onClick={() => setCourse(code)}
            >
              {code}
            </button>
          ))}
        </div>
      </div>
      {user.courses.length === 0 && course === 'mine' && (
        <div className="notice">
          Add your courses on your <Link to="/app/profile">profile</Link> to see matches here.
        </div>
      )}
      {list.length === 0 ? (
        <Empty icon={<Search size={22} />} title="No groups found">
          Try another course or start your own group.
        </Empty>
      ) : (
        <div className="grid2">
          {list.map(({ g, score, shared }) => {
            const member = isMember(g)
            const full = isFull(g)
            const enrolled = user.courses.includes(g.course)
            return (
              <article className="group-card" key={g.id}>
                <div className="between">
                  <Tag>{g.course}</Tag>
                  {enrolled && !member && <Tag tone={score >= 60 ? 'green' : 'amber'}>{score}% match</Tag>}
                  {member && <Tag tone="green">Joined</Tag>}
                </div>
                <h3>{g.name}</h3>
                <p className="muted">{g.blurb}</p>
                <div className="meta">
                  <span>
                    <Clock size={14} /> {g.avail.map(slotLabel).join(' \xB7 ')}
                  </span>
                </div>
                {shared.length > 0 && !member && (
                  <p className="small ok">You overlap on {shared.map(slotLabel).join(', ')}</p>
                )}
                <div className="between foot-row">
                  <div className="row gap-s">
                    <AvatarStack people={g.members} size={26} />
                    <small className="muted">
                      {g.members.length}/{g.capacity}
                    </small>
                  </div>
                  {member ? (
                    <Link className="btn btn-primary btn-sm" to={`/app/groups/${g.id}`}>
                      Open
                    </Link>
                  ) : (
                    <button
                      className="btn btn-accent btn-sm"
                      disabled={full || !enrolled}
                      title={!enrolled ? 'Add this course to your profile to join' : void 0}
                      onClick={() => dispatch({ type: 'join', id: g.id })}
                    >
                      {full ? 'Full' : 'Join group'}
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
function CreateGroup({ onDone }) {
  const { state, dispatch } = useStore()
  const { user, groups } = state
  const [f, setF] = useState({
    name: '',
    course: user.courses[0] || '',
    courseName: '',
    goal: user.goal,
    place: '',
    blurb: '',
    avail: user.availability.slice(0, 3),
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const [err, setErr] = useState('')
  const known = new Map()
  user.courses.forEach((c) => known.set(c, user.courseNames?.[c] || ''))
  COURSES.forEach((c) => known.has(c.code) || known.set(c.code, c.name))
  groups.forEach((g) => known.has(g.course) || known.set(g.course, ''))
  const code = normCourse(f.course)
  const valid = validCourse(code)
  const isNew = valid && !user.courses.includes(code)
  const suggestedName = known.get(code) || ''
  const submit = async (e) => {
    e.preventDefault()
    if (!valid) return setErr('Enter a course code like \u201CCIS 2102\u201D (letters, numbers and spaces).')
    setErr('')
    const id = await dispatch({
      type: 'create',
      group: {
        ...f,
        course: code,
        courseName: (f.courseName || suggestedName).trim(),
        name: f.name.trim(),
        blurb: f.blurb.trim(),
      },
    })
    if (id) onDone(id)
  }
  return (
    <form className="panel form-grid" onSubmit={submit}>
      <h3 className="span2">Start a new group</h3>
      <label>
        Group name
        <input
          required
          value={f.name}
          onChange={set('name')}
          maxLength={60}
          placeholder="e.g. Tree Huggers"
        />
      </label>
      <label>
        Course
        <input
          required
          list="course-options"
          maxLength={20}
          value={f.course}
          onChange={(e) => {
            setErr('')
            set('course')(e)
          }}
          placeholder="Pick one or type your own, e.g. BIO 101"
          autoComplete="off"
        />
        <datalist id="course-options">
          {[...known].map(([c, n]) => (
            <option key={c} value={c}>
              {n}
            </option>
          ))}
        </datalist>
      </label>
      <label>
        Study goal
        <input
          required
          list="goal-options"
          maxLength={80}
          value={f.goal}
          onChange={set('goal')}
          placeholder="Pick or type your own"
        />
        <datalist id="goal-options">
          {GOALS.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
      </label>
      {isNew ? (
        <label>
          Course name (optional)
          <input
            value={f.courseName}
            maxLength={80}
            onChange={set('courseName')}
            placeholder={suggestedName || 'e.g. Introduction to Biology'}
          />
        </label>
      ) : (
        <label>
          Where you meet
          <input value={f.place} onChange={set('place')} placeholder="Library, Discord…" />
        </label>
      )}
      {isNew && (
        <p className="small ok span2">
          <Check size={14} /> “{code}” isn’t on your profile yet. It will be added when you create this group.
        </p>
      )}
      {isNew && (
        <label className="span2">
          Where you meet
          <input value={f.place} onChange={set('place')} placeholder="Library, Discord…" />
        </label>
      )}
      <label className="span2">
        Short description
        <input value={f.blurb} onChange={set('blurb')} maxLength={200} placeholder="What’s the vibe?" />
      </label>
      <div className="span2">
        <span className="label">When you usually meet</span>
        <AvailabilityGrid value={f.avail} onChange={(avail) => setF({ ...f, avail })} />
      </div>
      {err && (
        <p className="error span2" role="alert">
          {err}
        </p>
      )}
      <div className="span2 row gap">
        <button className="btn btn-primary">Create group</button>
        <button type="button" className="btn btn-ghost" onClick={() => onDone(null)}>
          Cancel
        </button>
      </div>
    </form>
  )
}
