import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Logo } from '../components/ui'
import { useStore } from '../store'
import { SCHOOLS } from '../data/seed'
export default function Auth({ mode }) {
  const signup = mode === 'signup'
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', password: '', school: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  if (state.user && !busy) return <Navigate to="/app" replace />
  const run = async (fn, to) => {
    setErr('')
    setBusy(true)
    try {
      await fn()
      nav(to)
    } catch (e) {
      setErr(e.message)
      setBusy(false)
    }
  }
  const submit = (e) => {
    e.preventDefault()
    if (f.password.length < 6) return setErr('Password must be at least 6 characters.')
    const email = f.email.trim().toLowerCase()
    if (signup)
      run(
        () =>
          dispatch({
            type: 'signup',
            user: { name: f.name.trim(), email, password: f.password, school: f.school.trim() },
          }),
        '/app/profile?welcome=1',
      )
    else run(() => dispatch({ type: 'login', user: { email, password: f.password } }), '/app')
  }
  return (
    <div className="auth">
      <div className="auth-art">
        <Logo light />
        <h2>
          Study together,
          <br />
          not alone.
        </h2>
        <p>Match with classmates in your course, book sessions, and keep your notes and chat in one place.</p>
      </div>
      <form className="auth-form" onSubmit={submit}>
        <h1>{signup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">{signup ? 'It takes about a minute.' : 'Log in to see your study groups.'}</p>
        {signup && (
          <label>
            Full name
            <input
              required
              value={f.name}
              onChange={set('name')}
              placeholder="Alex Rivera"
              autoComplete="name"
            />
          </label>
        )}
        <label>
          Email
          <input
            required
            type="email"
            value={f.email}
            onChange={set('email')}
            placeholder="you@school.edu"
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            required
            type="password"
            value={f.password}
            onChange={set('password')}
            placeholder="At least 6 characters"
            autoComplete={signup ? 'new-password' : 'current-password'}
          />
        </label>
        {signup && (
          <label>
            School
            <input
              required
              list="schools"
              value={f.school}
              onChange={set('school')}
              placeholder="Start typing your school"
            />
            <datalist id="schools">
              {SCHOOLS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
        )}
        {err && (
          <p className="error" role="alert">
            {err}
          </p>
        )}
        <button className="btn btn-primary btn-lg block" disabled={busy}>
          {busy ? 'Please wait\u2026' : signup ? 'Create account' : 'Log in'}
        </button>
        <button
          type="button"
          className="btn btn-outline block"
          disabled={busy}
          onClick={() => run(() => dispatch({ type: 'demo' }), '/app')}
        >
          Continue with demo account
        </button>
        <p className="muted small center">
          {signup ? (
            <>
              Already have an account? <Link to="/login">Log in</Link>
            </>
          ) : (
            <>
              New here? <Link to="/signup">Sign up free</Link>
            </>
          )}
        </p>
      </form>
    </div>
  )
}
