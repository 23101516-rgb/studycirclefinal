import { Link } from 'react-router-dom'
import { CalendarDays, Sparkles, Users, FileText, ArrowRight } from 'lucide-react'
import { useStore } from '../store'
import { isMember, suggestions } from '../lib/match'
import { AvatarStack, Tag, Empty, fmtDate, fmtTime, todayStr } from '../components/ui'
export default function Dashboard() {
  const { state, dispatch } = useStore()
  const { user, groups, sessions, files } = state
  const mine = groups.filter((g) => isMember(g))
  const ids = new Set(mine.map((g) => g.id))
  const today = todayStr()
  const upcoming = sessions
    .filter((s) => ids.has(s.groupId) && s.date >= today)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const noteCount = [...ids].reduce((n, id) => n + (files[id]?.length || 0), 0)
  const sugg = suggestions(user, groups).slice(0, 3)
  const profileDone = user.courses.length > 0 && user.availability.length > 0
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Hi {user.name.split(' ')[0]} 👋</h1>
          <p className="muted">
            {mine.length
              ? `You\u2019re in ${mine.length} study ${mine.length > 1 ? 'groups' : 'group'}.`
              : 'Let\u2019s get you into a study group.'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => dispatch({ type: 'automatch' })}
          disabled={!profileDone}
        >
          <Sparkles size={16} /> Auto-match me
        </button>
      </header>
      {!profileDone && (
        <div className="notice">
          <div>
            <b>Finish your profile to get matched.</b>
            <br />
            Add your courses and weekly availability so we can find your group.
          </div>
          <Link to="/app/profile" className="btn btn-primary btn-sm">
            Complete profile
          </Link>
        </div>
      )}
      <div className="stats">
        <Stat icon={Users} label="My groups" value={mine.length} />
        <Stat icon={CalendarDays} label="Upcoming sessions" value={upcoming.length} />
        <Stat icon={FileText} label="Notes & files shared" value={noteCount} />
      </div>
      <div className="two-col">
        <section className="panel">
          <h3>Upcoming sessions</h3>
          {upcoming.length === 0 ? (
            <Empty icon={<CalendarDays size={22} />} title="Nothing booked">
              Open one of your groups and book a session.
            </Empty>
          ) : (
            upcoming.slice(0, 4).map((s) => {
              const g = groups.find((x) => x.id === s.groupId)
              return (
                <Link to={`/app/groups/${g.id}`} className="row-link" key={s.id}>
                  <span className="date-chip">
                    <b>{fmtDate(s.date).split(' ').slice(1).join(' ')}</b>
                    <small>{fmtDate(s.date).split(' ')[0].replace(',', '')}</small>
                  </span>
                  <span className="grow">
                    <b>{s.title}</b>
                    <small>
                      {g.name} · {fmtTime(s.time)} · {s.place}
                    </small>
                  </span>
                  <ArrowRight size={16} />
                </Link>
              )
            })
          )}
        </section>
        <section className="panel">
          <h3>My groups</h3>
          {mine.length === 0 ? (
            <Empty icon={<Users size={22} />} title="No groups yet">
              Use auto-match or browse groups for your courses.
            </Empty>
          ) : (
            mine.map((g) => (
              <Link to={`/app/groups/${g.id}`} className="row-link" key={g.id}>
                <span className="grow">
                  <b>{g.name}</b>
                  <small>
                    {g.course} · {g.members.length}/{g.capacity} members
                  </small>
                </span>
                <AvatarStack people={g.members} max={3} size={26} />
              </Link>
            ))
          )}
        </section>
      </div>
      {sugg.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h3>Suggested for you</h3>
            <Link to="/app/find" className="link">
              See all groups
            </Link>
          </div>
          <div className="grid3">
            {sugg.map(({ group: g, score }) => (
              <article className="mini-card" key={g.id}>
                <div className="between">
                  <Tag>{g.course}</Tag>
                  <Tag tone="green">{score}% match</Tag>
                </div>
                <h4>{g.name}</h4>
                <p className="muted small">
                  {g.members.length}/{g.capacity} members · {g.goal}
                </p>
                <button
                  className="btn btn-accent btn-sm"
                  onClick={() => dispatch({ type: 'join', id: g.id })}
                >
                  Join group
                </button>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
const Stat = ({ icon: I, label, value }) => (
  <div className="stat">
    <span className="ico">
      <I size={18} />
    </span>
    <div>
      <b>{value}</b>
      <small>{label}</small>
    </div>
  </div>
)
