import { Link } from 'react-router-dom'
import { DAYS, BLOCKS } from '../data/seed'
export function Logo({ to = '/', light }) {
  return (
    <Link to={to} className={`logo ${light ? 'logo-light' : ''}`} aria-label="StudyCircle home">
      <span className="logo-mark" aria-hidden>
        <i />
        <b />
      </span>
      StudyCircle
    </Link>
  )
}
const HUES = [252, 12, 160, 36, 200, 330, 100, 280]
export function Avatar({ name = '?', size = 32 }) {
  const h = HUES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length]
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `hsl(${h} 70% 92%)`,
        color: `hsl(${h} 55% 32%)`,
      }}
      title={name}
    >
      {initials}
    </span>
  )
}
export function AvatarStack({ people, max = 4, size = 28 }) {
  const shown = people.slice(0, max)
  return (
    <span className="avatar-stack">
      {shown.map((p) => (
        <Avatar key={p.id} name={p.name} size={size} />
      ))}
      {people.length > max && (
        <span className="avatar more" style={{ width: size, height: size }}>
          +{people.length - max}
        </span>
      )}
    </span>
  )
}
export const Tag = ({ children, tone = 'violet' }) => <span className={`tag tag-${tone}`}>{children}</span>
export function AvailabilityGrid({ value, onChange, highlight = [] }) {
  const set = new Set(value)
  const toggle = (k) => onChange && onChange(set.has(k) ? value.filter((x) => x !== k) : [...value, k])
  return (
    <div className="avail" role="group" aria-label="Weekly availability">
      <span />
      {DAYS.map((d) => (
        <span key={d} className="avail-h">
          {d}
        </span>
      ))}
      {BLOCKS.map((b) => (
        <FragmentRow key={b.id}>
          <span className="avail-r">
            {b.label}
            <small>{b.hint}</small>
          </span>
          {DAYS.map((d) => {
            const k = `${d}-${b.id}`
            const on = set.has(k)
            return (
              <button
                key={k}
                type="button"
                disabled={!onChange}
                aria-pressed={on}
                aria-label={`${d} ${b.label}`}
                className={`avail-c ${on ? 'on' : ''} ${highlight.includes(k) ? 'hl' : ''}`}
                onClick={() => toggle(k)}
              />
            )
          })}
        </FragmentRow>
      ))}
    </div>
  )
}
const FragmentRow = ({ children }) => <>{children}</>
export function Empty({ icon, title, children }) {
  return (
    <div className="empty">
      {icon}
      <h4>{title}</h4>
      <p>{children}</p>
    </div>
  )
}
export const fmtDate = (iso) =>
  new Date(iso + 'T00:00').toLocaleDateString(void 0, { weekday: 'short', month: 'short', day: 'numeric' })
export const fmtTime = (t) => {
  const [h, m] = t.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}
export const fmtAgo = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 6e4)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.round(m / 60)}h ago`
  return `${Math.round(m / 1440)}d ago`
}
const URL_RE = /((?:https?:\/\/|www\.)[^\s<>"']+)/gi
export function Linkify({ text }) {
  if (!text) return null
  return text.split(URL_RE).map((part, i) => {
    if (i % 2 === 0) return part
    const m = part.match(/^(.*?)([.,;:!?)\]]*)$/)
    const url = m[1],
      tail = m[2]
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`
    return (
      <span key={i}>
        <a href={href} target="_blank" rel="noopener noreferrer" className="ext-link">
          {url}
        </a>
        {tail}
      </span>
    )
  })
}
export const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
