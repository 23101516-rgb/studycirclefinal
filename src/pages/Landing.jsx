import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  UserRound,
  Sparkles,
  CalendarDays,
  FileText,
  MessageCircle,
  SearchX,
  MessagesSquare,
  Armchair,
  ChevronDown,
  CalendarCheck,
  Users,
} from 'lucide-react'
import { Logo, Avatar } from '../components/ui'
import { useStore } from '../store'
const problems = [
  {
    icon: SearchX,
    title: 'Hard to find the right partners',
    text: 'In big classes or online programs, you rarely know who else is taking your course, or when they can meet.',
  },
  {
    icon: MessagesSquare,
    title: "Chat apps aren't built for this",
    text: 'Group chats and social media bury plans and notes. Nothing is built to coordinate study sessions.',
  },
  {
    icon: Armchair,
    title: 'Students end up studying alone',
    text: 'Even when peer support would help them learn faster and stay motivated.',
  },
]
const steps = [
  {
    n: 1,
    title: 'Build your profile',
    text: 'Add your school, the courses you\u2019re enrolled in, and when you\u2019re free to study.',
    icon: UserRound,
  },
  {
    n: 2,
    title: 'Get matched automatically',
    text: 'We match you with classmates by course, schedule and study goals. No cold messaging.',
    icon: Sparkles,
  },
  {
    n: 3,
    title: 'Study together',
    text: 'Book sessions, share notes and chat with your group, all in one place.',
    icon: Users,
  },
]
const features = [
  {
    icon: UserRound,
    title: 'User profiles',
    text: 'School, courses enrolled and weekly availability, so matches actually fit your life.',
    tags: ['School', 'Courses', 'Availability'],
  },
  {
    icon: Sparkles,
    title: 'Automatic matching',
    text: 'Get placed into small groups based on shared courses and overlapping schedules.',
    tags: ['Course', 'Schedule', 'Goals'],
  },
  {
    icon: CalendarDays,
    title: 'Group scheduling',
    text: 'Book study sessions in a couple of clicks and see who\u2019s going.',
    tags: ['Book a session', 'RSVP'],
  },
  {
    icon: FileText,
    title: 'Shared notes and files',
    text: 'Upload notes and files that stay with your group instead of getting lost in chat.',
    tags: ['Notes', 'Files'],
  },
  {
    icon: MessageCircle,
    title: 'In-app group chat',
    text: 'Coordinate plans and ask quick questions without leaving StudyCircle.',
    tags: ['Group chat'],
  },
]
const faqs = [
  [
    'Who can I be matched with?',
    'Only students taking the same course at the same school. Matching uses your courses, weekly availability and study goal.',
  ],
  [
    'How big are the groups?',
    'Small on purpose, usually 4 to 8 people, so everybody gets a chance to talk and nobody gets lost.',
  ],
  ['Does it cost anything?', 'StudyCircle is free for students while we build it out with real classes.'],
  [
    'Can I start my own group?',
    'Yes. Create a group for any course you\u2019re enrolled in and set your own meeting times.',
  ],
]
export default function Landing() {
  const { state, dispatch } = useStore()
  const [open, setOpen] = useState(0)
  const nav = useNavigate()
  return (
    <div className="landing">
      <header className="pnav">
        <div className="wrap pnav-in">
          <Logo />
          <nav aria-label="Sections" className="pnav-links">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#schools">For schools</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="pnav-cta">
            {state.user ? (
              <Link to="/app" className="btn btn-primary btn-sm">
                Open app
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Log in
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <section className="hero wrap">
        <div className="hero-copy">
          <span className="pill">
            <Sparkles size={14} /> Study groups for the classes you’re actually in
          </span>
          <h1>
            Study <em>together,</em>
            <br />
            not alone.
          </h1>
          <p className="lead">
            StudyCircle connects students taking the same course at the same school so they can form small
            study groups, schedule sessions, and share notes in one place.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-lg">
              Find my study group
            </Link>
            <button
              className="btn btn-outline btn-lg"
              onClick={async () => {
                if (await dispatch({ type: 'demo' }).catch(() => false)) nav('/app')
              }}
            >
              Try the demo
            </button>
          </div>
          <p className="muted small">Free for students · No credit card</p>
        </div>
        <div className="hero-art" aria-hidden>
          <div className="float-card fc-main">
            <p className="eyebrow">CIS 2102 · Data Structures</p>
            <h4>Data Structures Circle</h4>
            <div className="fc-row">
              <span className="avatar-stack">
                {['Ana Reyes', 'Marco Dela Cruz', 'Bea Santos', 'Kai Lim'].map((n) => (
                  <Avatar key={n} name={n} size={28} />
                ))}
              </span>
              <span className="tag tag-green">92% match</span>
            </div>
            <div className="fc-session">
              <CalendarCheck size={16} />{' '}
              <div>
                <b>Next session</b>
                <small>Thu, 7:00 PM · Library 2F</small>
              </div>
            </div>
            <span className="btn btn-primary btn-sm fc-btn">Join group</span>
          </div>
          <div className="float-card fc-note">
            <FileText size={15} />{' '}
            <span>
              <b>Heap sort cheat sheet</b>
              <small>Shared by Bea</small>
            </span>
          </div>
          <div className="float-card fc-chat">
            <Avatar name="Marco Dela Cruz" size={24} /> <span>Anyone free Thursday to review heaps?</span>
          </div>
        </div>
      </section>
      <section className="band">
        <div className="wrap center">
          <p className="eyebrow">The problem</p>
          <h2>Studying alone shouldn’t be the default.</h2>
          <p className="lead narrow">
            Many students struggle to find reliable study partners or groups for their specific courses,
            especially in large classes or online programs.
          </p>
          <div className="grid3">
            {problems.map(({ icon: I, title, text }) => (
              <article className="card" key={title}>
                <span className="ico ico-rose">
                  <I size={18} />
                </span>
                <h4>{title}</h4>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="band band-tint" id="how">
        <div className="wrap center">
          <p className="eyebrow">How StudyCircle helps</p>
          <h2>Same course. Same school. One place to study together.</h2>
          <div className="grid3">
            {steps.map(({ n, title, text, icon: I }) => (
              <article className="card step" key={n}>
                <span className="step-n">Step {n}</span>
                <span className="ico">
                  <I size={18} />
                </span>
                <h4>{title}</h4>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="band" id="features">
        <div className="wrap center">
          <p className="eyebrow">Features</p>
          <h2>Everything your study group needs</h2>
          <p className="lead narrow">
            Five core tools to find partners, plan sessions, and keep your notes and talk in one place.
          </p>
          <div className="grid-feat">
            {features.map(({ icon: I, title, text, tags }) => (
              <article className="card" key={title}>
                <span className="ico">
                  <I size={18} />
                </span>
                <h4>{title}</h4>
                <p>{text}</p>
                <div className="tags">
                  {tags.map((t) => (
                    <span key={t} className="tag tag-violet">
                      {t}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="band band-tint" id="schools">
        <div className="wrap split">
          <div>
            <p className="eyebrow">For schools</p>
            <h2>Peer support, without the admin work.</h2>
            <p className="lead">
              Groups form inside your school only, so students study with the classmates they’ll actually see
              on campus. We’re piloting with a few classes first. Want StudyCircle in yours?
            </p>
          </div>
          <ul className="checks">
            <li>Matching limited to the same school and course</li>
            <li>Small groups that keep everyone participating</li>
            <li>Sessions, notes and chat in one workspace</li>
          </ul>
        </div>
      </section>
      <section className="band" id="faq">
        <div className="wrap faq">
          <h2 className="center">Questions, answered</h2>
          {faqs.map(([q, a], i) => (
            <div className={`faq-item ${open === i ? 'open' : ''}`} key={q}>
              <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                {q}
                <ChevronDown size={18} />
              </button>
              {open === i && <p>{a}</p>}
            </div>
          ))}
        </div>
      </section>
      <section className="cta wrap">
        <h2>Ready to stop studying alone?</h2>
        <p>Create your profile in a minute and get matched with your classmates.</p>
        <Link to="/signup" className="btn btn-light btn-lg">
          Sign up free
        </Link>
      </section>
      <footer className="foot wrap">
        <Logo />
        <span className="muted small">
          © {new Date().getFullYear()} StudyCircle · Student project prototype
        </span>
      </footer>
    </div>
  )
}
