import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  MessageCircle,
  CalendarDays,
  FileText,
  Send,
  Plus,
  Trash2,
  Reply,
  X,
  Download,
  UploadCloud,
  ExternalLink,
  MapPin,
  Clock,
  Check,
  LogOut,
  StickyNote,
} from 'lucide-react'
import { useStore, downloadItem, openPdf, isPdf } from '../store'
import { isMember, slotLabel, overlap } from '../lib/match'
import {
  Avatar,
  Tag,
  Empty,
  AvailabilityGrid,
  Linkify,
  fmtAgo,
  fmtDate,
  fmtTime,
  todayStr,
} from '../components/ui'
const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'sessions', label: 'Sessions', icon: CalendarDays },
  { id: 'files', label: 'Notes & files', icon: FileText },
]
export default function Group() {
  const { id } = useParams()
  const { state, dispatch } = useStore()
  const [tab, setTab] = useState('chat')
  const nav = useNavigate()
  const g = state.groups.find((x) => x.id === id)
  if (!g) return <Navigate to="/app/find" replace />
  const member = isMember(g)
  const who = (uid) =>
    uid === 'me'
      ? { id: 'me', name: state.user.name }
      : g.members.find((m) => m.id === uid) || { id: uid, name: 'Member' }
  const nextSession = state.sessions
    .filter((s) => s.groupId === g.id && s.date >= todayStr())
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0]
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">
            {g.course} · {g.goal}
          </p>
          <h1>{g.name}</h1>
          <p className="muted">{g.blurb}</p>
        </div>
        {member ? (
          <div className="row gap-s">
            <button
              className="btn btn-outline"
              onClick={() => confirm('Leave this group?') && dispatch({ type: 'leave', id: g.id })}
            >
              <LogOut size={16} /> Leave
            </button>
            {g.owner && (
              <button
                className="btn btn-danger"
                onClick={async () => {
                  if (
                    !confirm(
                      `Delete \u201C${g.name}\u201D for everyone? Its chat, sessions, notes and files will be removed permanently.`,
                    )
                  )
                    return
                  if (await dispatch({ type: 'delGroup', id: g.id })) nav('/app/find')
                }}
              >
                <Trash2 size={16} /> Delete group
              </button>
            )}
          </div>
        ) : (
          <button
            className="btn btn-accent"
            disabled={g.members.length >= g.capacity}
            onClick={() => dispatch({ type: 'join', id: g.id })}
          >
            Join group
          </button>
        )}
      </header>
      {!member ? (
        <div className="notice">
          You’re viewing this group as a guest. <b>Join</b> to chat, book sessions and see shared notes.{' '}
          <Link to="/app/find">Back to groups</Link>
        </div>
      ) : (
        <div className="group-layout">
          <section className="panel flush">
            <div className="tabs" role="tablist">
              {TABS.map(({ id: t, label, icon: I }) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  className={tab === t ? 'on' : ''}
                  onClick={() => setTab(t)}
                >
                  <I size={16} /> {label}
                </button>
              ))}
            </div>
            <div className="tab-body">
              {tab === 'chat' && <Chat g={g} who={who} />}
              {tab === 'sessions' && <Sessions g={g} />}
              {tab === 'files' && <Files g={g} who={who} />}
            </div>
          </section>
          <aside className="rail">
            <section className="panel">
              <h4>Next session</h4>
              {nextSession ? (
                <p>
                  <b>{nextSession.title}</b>
                  <br />
                  <span className="muted small">
                    {fmtDate(nextSession.date)} · {fmtTime(nextSession.time)}
                    <br />
                    <Linkify text={nextSession.place} />
                  </span>
                </p>
              ) : (
                <p className="muted small">None booked yet.</p>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => setTab('sessions')}>
                Book a session
              </button>
            </section>
            <section className="panel">
              <h4>
                Members ({g.members.length}/{g.capacity})
              </h4>
              <ul className="members">
                {g.members.map((m) => (
                  <li key={m.id}>
                    <Avatar name={m.name} size={28} /> {m.name}
                    {m.id === 'me' && <Tag tone="gray">You</Tag>}
                  </li>
                ))}
              </ul>
            </section>
            <section className="panel">
              <h4>Meets</h4>
              <p className="small muted">
                <MapPin size={13} /> <Linkify text={g.place || 'TBD'} />
              </p>
              <AvailabilityGrid value={g.avail} highlight={overlap(state.user.availability, g.avail)} />
              <p className="small muted">Highlighted = you’re free too.</p>
            </section>
          </aside>
        </div>
      )}
    </div>
  )
}
function Chat({ g, who }) {
  const { state, dispatch } = useStore()
  const msgs = state.messages[g.id] || []
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const end = useRef(null)
  const input = useRef(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [msgs.length])
  const jumpTo = (id) => {
    const el = document.getElementById(`msg-${id}`)
    if (!el) return
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    el.classList.add('flash')
    setTimeout(() => el.classList.remove('flash'), 1200)
  }
  const startReply = (m, name) => {
    setReplyTo({ id: m.id, name, text: m.text.length > 140 ? m.text.slice(0, 140) + '\u2026' : m.text })
    input.current?.focus()
  }
  const send = async (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    const r = replyTo
    setText('')
    setReplyTo(null)
    if (
      !(await dispatch({ type: 'message', groupId: g.id, message: { text: t, replyTo: r ? r.id : null } }))
    ) {
      setText(t)
      setReplyTo(r)
    }
  }
  return (
    <div className="chat">
      <div className="chat-log" role="log" aria-live="polite">
        {msgs.length === 0 && (
          <Empty icon={<MessageCircle size={22} />} title="No messages yet">
            Say hi and suggest a time to meet.
          </Empty>
        )}
        {msgs.map((m) => {
          const p = { ...who(m.by), name: m.name || who(m.by).name }
          const mine = m.by === 'me'
          return (
            <div key={m.id} id={`msg-${m.id}`} className={`msg ${mine ? 'mine' : ''}`}>
              {!mine && <Avatar name={p.name} size={30} />}
              <div className="bubble">
                {!mine && <b>{p.name.split(' ')[0]}</b>}
                {m.replyTo &&
                  (m.replyTo.id ? (
                    <button type="button" className="quote" onClick={() => jumpTo(m.replyTo.id)}>
                      <b>{m.replyTo.name.split(' ')[0]}</b>
                      <span>{m.replyTo.text}</span>
                    </button>
                  ) : (
                    <div className="quote gone">
                      <span>Original message was deleted</span>
                    </div>
                  ))}
                <p>{m.text}</p>
                <small>
                  {fmtAgo(m.at)}
                  <button
                    className="msg-del"
                    aria-label="Reply"
                    title="Reply"
                    onClick={() => startReply(m, p.name)}
                  >
                    <Reply size={12} />
                  </button>
                  {mine && (
                    <button
                      className="msg-del"
                      aria-label="Delete message"
                      title="Delete message"
                      onClick={() =>
                        confirm('Delete this message?') && dispatch({ type: 'delMessage', id: m.id })
                      }
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </small>
              </div>
            </div>
          )
        })}
        <div ref={end} />
      </div>
      {replyTo && (
        <div className="replying">
          <Reply size={14} />
          <span>
            Replying to <b>{replyTo.name.split(' ')[0]}</b>: {replyTo.text}
          </span>
          <button
            type="button"
            aria-label="Cancel reply"
            title="Cancel reply"
            onClick={() => setReplyTo(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}
      <form className="composer" onSubmit={send}>
        <input
          ref={input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message the group"
          aria-label="Message"
        />
        <button className="btn btn-primary" aria-label="Send" disabled={!text.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
function Sessions({ g }) {
  const { state, dispatch } = useStore()
  const today = todayStr()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ title: '', date: today, time: '19:00', place: g.place || '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const all = state.sessions
    .filter((s) => s.groupId === g.id)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const upcoming = all.filter((s) => s.date >= today)
  const past = all.filter((s) => s.date < today)
  const submit = async (e) => {
    e.preventDefault()
    const title = f.title.trim()
    const made = await dispatch({ type: 'addSession', session: { ...f, groupId: g.id, title } })
    if (!made) return
    await dispatch({
      type: 'message',
      groupId: g.id,
      message: { text: `\u{1F4C5} Booked \u201C${title}\u201D on ${fmtDate(f.date)} at ${fmtTime(f.time)}.` },
    })
    setOpen(false)
    setF({ ...f, title: '' })
  }
  const nameOf = (r) =>
    r === 'me'
      ? state.user.name.split(' ')[0]
      : g.members.find((m) => m.id === r)?.name.split(' ')[0] || 'Member'
  const Card = ({ s, old }) => {
    const going = s.rsvp.includes('me')
    return (
      <article className={`session ${old ? 'old' : ''}`}>
        <span className="date-chip">
          <b>{fmtDate(s.date).split(' ').slice(1).join(' ')}</b>
          <small>{fmtDate(s.date).split(' ')[0].replace(',', '')}</small>
        </span>
        <div className="grow">
          <b>{s.title}</b>
          <small>
            <Clock size={12} /> {fmtTime(s.time)} · <MapPin size={12} /> <Linkify text={s.place || 'TBD'} />
          </small>
          <small className="muted">
            {s.rsvp.length} going: {s.rsvp.map(nameOf).join(', ') || 'nobody yet'}
          </small>
        </div>
        {!old && (
          <button
            className={`btn btn-sm ${going ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => dispatch({ type: 'rsvp', id: s.id })}
          >
            {going ? (
              <>
                <Check size={14} /> Going
              </>
            ) : (
              'RSVP'
            )}
          </button>
        )}
        <button
          className="icon-btn"
          aria-label="Delete session"
          onClick={() => dispatch({ type: 'delSession', id: s.id })}
        >
          <Trash2 size={15} />
        </button>
      </article>
    )
  }
  return (
    <div className="stack">
      <div className="between">
        <h3>Study sessions</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setOpen(!open)}>
          <Plus size={15} /> Book session
        </button>
      </div>
      {open && (
        <form className="form-grid inset" onSubmit={submit}>
          <label className="span2">
            What are you studying?
            <input
              required
              value={f.title}
              onChange={set('title')}
              placeholder="e.g. Graph traversal practice"
            />
          </label>
          <label>
            Date
            <input required type="date" min={today} value={f.date} onChange={set('date')} />
          </label>
          <label>
            Time
            <input required type="time" value={f.time} onChange={set('time')} />
          </label>
          <label className="span2">
            Where
            <input
              value={f.place}
              onChange={set('place')}
              placeholder="Library, or paste a Zoom / Meet / Discord link"
            />
          </label>
          <div className="span2 row gap">
            <button className="btn btn-primary btn-sm">Book it</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {upcoming.length === 0 && !open && (
        <Empty icon={<CalendarDays size={22} />} title="No upcoming sessions">
          Book one so everyone can RSVP.
        </Empty>
      )}
      {upcoming.map((s) => (
        <Card key={s.id} s={s} />
      ))}
      {past.length > 0 && (
        <>
          <p className="eyebrow">Past</p>
          {past.map((s) => (
            <Card key={s.id} s={s} old />
          ))}
        </>
      )}
    </div>
  )
}
const MAX_BYTES = 10 * 1024 * 1024
const MAX_FILES_AT_ONCE = 10
const size = (b) =>
  b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`
function Files({ g, who }) {
  const { state, dispatch } = useStore()
  const items = state.files[g.id] || []
  const [open, setOpen] = useState(false)
  const [n, setN] = useState({ title: '', body: '' })
  const [note, setNote] = useState('')
  const addNote = async (e) => {
    e.preventDefault()
    if (
      await dispatch({ type: 'addItem', groupId: g.id, item: { title: n.title.trim(), body: n.body.trim() } })
    ) {
      setN({ title: '', body: '' })
      setOpen(false)
    }
  }
  const [drag, setDrag] = useState(false)
  const [busy, setBusy] = useState(false)
  const picker = useRef(null)
  const uploadMany = async (list) => {
    const all = [...list].filter((f) => f.type || f.size > 0)
    if (!all.length) return setNote('Drop files, not folders.')
    const files = all.slice(0, MAX_FILES_AT_ONCE)
    const problems = []
    if (all.length > files.length) problems.push(`Only the first ${MAX_FILES_AT_ONCE} files were added.`)
    setBusy(true)
    let done = 0
    for (const file of files) {
      if (file.size > MAX_BYTES) {
        problems.push(`${file.name} is over 10 MB.`)
        continue
      }
      setNote(`Uploading ${file.name}\u2026`)
      if (await dispatch({ type: 'upload', groupId: g.id, file })) done++
      else problems.push(`${file.name} failed to upload.`)
    }
    setBusy(false)
    setNote(
      [done ? `Uploaded ${done} file${done > 1 ? 's' : ''}.` : '', ...problems].filter(Boolean).join(' '),
    )
  }
  const onPick = (e) => {
    const list = e.target.files
    if (list?.length) uploadMany(list)
    e.target.value = ''
  }
  const onDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    if (!busy) uploadMany(e.dataTransfer.files)
  }
  const download = async (it) => {
    try {
      await downloadItem(it)
    } catch (err) {
      setNote(err.message)
    }
  }
  const openIt = async (it) => {
    try {
      await openPdf(it)
    } catch (err) {
      setNote(err.message)
    }
  }
  return (
    <div className="stack">
      <div className="between">
        <h3>Notes & files</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setOpen(!open)}>
          <Plus size={15} /> New note
        </button>
      </div>
      <div
        className={`dropzone ${drag ? 'over' : ''} ${busy ? 'busy' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setDrag(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDrag(false)
        }}
        onDrop={onDrop}
      >
        <UploadCloud size={26} />
        <p>
          <b>{drag ? 'Drop to share with your group' : 'Drag & drop your PDF notes or other files here'}</b>
        </p>
        <p className="small muted">
          or{' '}
          <button type="button" className="link-btn" disabled={busy} onClick={() => picker.current?.click()}>
            browse your files
          </button>{' '}
          · up to 10 MB each
        </p>
        <input ref={picker} type="file" multiple hidden onChange={onPick} />
      </div>
      {note && (
        <p className="small muted" role="status">
          {note}
        </p>
      )}
      {open && (
        <form className="form-grid inset" onSubmit={addNote}>
          <label className="span2">
            Title
            <input
              required
              value={n.title}
              onChange={(e) => setN({ ...n, title: e.target.value })}
              placeholder="e.g. Big-O cheat sheet"
            />
          </label>
          <label className="span2">
            Note
            <textarea
              required
              rows={5}
              value={n.body}
              onChange={(e) => setN({ ...n, body: e.target.value })}
              placeholder="Write something your group will find useful"
            />
          </label>
          <div className="span2 row gap">
            <button className="btn btn-primary btn-sm">Share with group</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {items.length === 0 && !open && (
        <Empty icon={<FileText size={22} />} title="Nothing shared yet">
          Drop a PDF or write a quick note for the group.
        </Empty>
      )}
      {items.map((it) => (
        <article className="item" key={it.id}>
          <span className="ico">
            {it.kind === 'note' ? <StickyNote size={17} /> : <FileText size={17} />}
          </span>
          <div className="grow">
            <b>{it.title}</b>
            <small className="muted">
              {who(it.by).name} · {fmtAgo(it.at)}
              {it.kind === 'file' && ` \xB7 ${size(it.bytes)}`}
            </small>
            {it.kind === 'note' && <pre>{it.body}</pre>}
          </div>
          {it.downloadable && isPdf(it) && (
            <button
              className="icon-btn"
              aria-label={`Open ${it.title}`}
              title="Open PDF in a new tab"
              onClick={() => openIt(it)}
            >
              <ExternalLink size={16} />
            </button>
          )}
          {it.downloadable && (
            <button className="icon-btn" aria-label={`Download ${it.title}`} onClick={() => download(it)}>
              <Download size={16} />
            </button>
          )}
          <button
            className="icon-btn"
            aria-label="Remove"
            onClick={() => dispatch({ type: 'delItem', id: it.id })}
          >
            <Trash2 size={15} />
          </button>
        </article>
      ))}
    </div>
  )
}
