import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Pencil, Plus, X } from 'lucide-react'
import { useStore } from '../store'
import { COURSES, GOALS, SCHOOLS } from '../data/seed'
import { AvailabilityGrid, Avatar } from '../components/ui'
import { normCourse, validCourse } from '../lib/match'
const YEARS = ['1st year', '2nd year', '3rd year', '4th year', 'Graduate', 'Other', 'Prefer not to say']
const MAX_COURSES = 12
export default function Profile() {
  const { state, dispatch } = useStore()
  const [params] = useSearchParams()
  const [f, setF] = useState({ ...state.user })
  const [saved, setSaved] = useState(false)
  const set = (k) => (e) => {
    setSaved(false)
    setF({ ...f, [k]: e.target.value })
  }
  const names = f.courseNames || {}
  const [cErr, setCErr] = useState('')
  const [add, setAdd] = useState({ code: '', name: '' })
  const [edit, setEdit] = useState(null)
  const checkCode = (raw, ignore) => {
    const code = normCourse(raw)
    if (!validCourse(code))
      return { error: 'Enter a course code like \u201CCIS 2102\u201D (letters, numbers and spaces).' }
    if (f.courses.some((c) => c === code && c !== ignore))
      return { error: `${code} is already in your list.` }
    return { code }
  }
  const addCourse = (rawCode, rawName = '') => {
    const { code, error } = checkCode(rawCode)
    if (error) return setCErr(error)
    if (f.courses.length >= MAX_COURSES) return setCErr(`You can list up to ${MAX_COURSES} courses.`)
    setCErr('')
    setSaved(false)
    setF({ ...f, courses: [...f.courses, code], courseNames: { ...names, [code]: rawName.trim() } })
    setAdd({ code: '', name: '' })
  }
  const removeCourse = (code) => {
    setSaved(false)
    setCErr('')
    const { [code]: _gone, ...rest } = names
    setF({ ...f, courses: f.courses.filter((c) => c !== code), courseNames: rest })
  }
  const saveEdit = () => {
    const { code, error } = checkCode(edit.code, edit.from)
    if (error) return setCErr(error)
    const { [edit.from]: _old, ...rest } = names
    setCErr('')
    setSaved(false)
    setF({
      ...f,
      courses: f.courses.map((c) => (c === edit.from ? code : c)),
      courseNames: { ...rest, [code]: edit.name.trim() },
    })
    setEdit(null)
  }
  const enterTo = (fn) => (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      fn()
    }
  }
  const suggestions = COURSES.filter((c) => !f.courses.includes(c.code))
  const goalIsPreset = GOALS.some((g) => g.toLowerCase() === (f.goal || '').trim().toLowerCase())
  const submit = async (e) => {
    e.preventDefault()
    const { name, school, year, goal, courses, courseNames, availability } = f
    if (
      await dispatch({
        type: 'profile',
        patch: {
          name: name.trim(),
          school: school.trim(),
          year,
          goal: goal.trim(),
          courses,
          courseNames,
          availability,
        },
      })
    )
      setSaved(true)
  }
  return (
    <div className="page narrow-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">My profile</p>
          <h1>{params.get('welcome') ? 'Welcome! Let\u2019s set up your profile' : 'Your profile'}</h1>
          <p className="muted">This is what we use to match you with classmates.</p>
        </div>
      </header>
      <form className="panel stack-lg" onSubmit={submit}>
        <div className="row gap id-row">
          <Avatar name={f.name || '?'} size={56} />
          <div className="form-grid grow">
            <label>
              Full name
              <input required value={f.name} onChange={set('name')} />
            </label>
            <label>
              Email
              <input disabled value={f.email} />
            </label>
            <label>
              School
              <input required list="schools" value={f.school} onChange={set('school')} />
              <datalist id="schools">
                {SCHOOLS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </label>
            <label>
              Year level
              <select value={f.year} onChange={set('year')}>
                {YEARS.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <fieldset>
          <legend>Courses enrolled</legend>
          <p className="muted small">
            Add the courses you’re taking this term. Use the same course code your classmates use so you can
            be matched.
          </p>
          {f.courses.length === 0 && (
            <p className="muted small course-empty">No courses yet. Add your first one below.</p>
          )}
          <ul className="course-list">
            {f.courses.map((code) => (
              <li key={code} className="course-row">
                {edit?.from === code ? (
                  <>
                    <input
                      aria-label="Course code"
                      value={edit.code}
                      maxLength={20}
                      onChange={(e) => setEdit({ ...edit, code: e.target.value })}
                      onKeyDown={enterTo(saveEdit)}
                      placeholder="Code"
                      className="in-code"
                    />
                    <input
                      aria-label="Course name"
                      value={edit.name}
                      maxLength={80}
                      onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                      onKeyDown={enterTo(saveEdit)}
                      placeholder="Course name (optional)"
                    />
                    <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit}>
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setEdit(null)
                        setCErr('')
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="course-code">{code}</span>
                    <span className="course-name">{names[code] || <em>No name</em>}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Edit ${code}`}
                      title="Edit"
                      onClick={() => {
                        setCErr('')
                        setEdit({ from: code, code, name: names[code] || '' })
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Remove ${code}`}
                      title="Remove"
                      onClick={() => removeCourse(code)}
                    >
                      <X size={16} />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="course-add">
            <input
              aria-label="New course code"
              className="in-code"
              value={add.code}
              maxLength={20}
              onChange={(e) => setAdd({ ...add, code: e.target.value })}
              onKeyDown={enterTo(() => addCourse(add.code, add.name))}
              placeholder="e.g. CIS 2102"
            />
            <input
              aria-label="New course name"
              value={add.name}
              maxLength={80}
              onChange={(e) => setAdd({ ...add, name: e.target.value })}
              onKeyDown={enterTo(() => addCourse(add.code, add.name))}
              placeholder="Course name (optional)"
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => addCourse(add.code, add.name)}
            >
              <Plus size={15} /> Add course
            </button>
          </div>
          {cErr && (
            <p className="error" role="alert">
              {cErr}
            </p>
          )}
          {suggestions.length > 0 && (
            <div>
              <p className="muted small">Quick add:</p>
              <div className="chips wrap-chips">
                {suggestions.map((c) => (
                  <button
                    type="button"
                    key={c.code}
                    className="chip"
                    onClick={() => addCourse(c.code, c.name)}
                  >
                    <Plus size={13} /> {c.code} · {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="muted small">Changes apply when you press “Save profile”.</p>
        </fieldset>
        <fieldset>
          <legend>Weekly availability</legend>
          <p className="muted small">Tap the blocks when you’re usually free to study.</p>
          <AvailabilityGrid
            value={f.availability}
            onChange={(availability) => {
              setSaved(false)
              setF({ ...f, availability })
            }}
          />
        </fieldset>
        <fieldset>
          <legend>Study goal</legend>
          <p className="muted small">
            Pick one, or write your own. Groups with the same goal rank higher for you.
          </p>
          <div className="chips wrap-chips">
            {GOALS.map((g) => {
              const on = (f.goal || '').trim().toLowerCase() === g.toLowerCase()
              return (
                <button
                  type="button"
                  key={g}
                  className={`chip ${on ? 'on' : ''}`}
                  aria-pressed={on}
                  onClick={() => {
                    setSaved(false)
                    setF({ ...f, goal: g })
                  }}
                >
                  {g}
                </button>
              )
            })}
          </div>
          <label>
            {goalIsPreset ? 'Or write your own' : 'Your own goal'}
            <input
              required
              value={f.goal}
              maxLength={80}
              onChange={set('goal')}
              placeholder="e.g. Pass the board exam, finish my thesis chapter"
            />
          </label>
        </fieldset>
        <div className="row gap">
          <button className="btn btn-primary">Save profile</button>
          {saved && (
            <span className="ok small" role="status">
              <Check size={14} /> Saved. Head to “Find groups” to see your matches.
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
