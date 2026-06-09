import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'

declare global {
  interface Window {
    Chart?: new (context: CanvasRenderingContext2D, config: Record<string, unknown>) => { destroy: () => void }
  }
}

type ScreenKey = 'instructor' | 'student' | 'admin' | 'modules'
type Role = 'Instructor' | 'Student' | 'Admin'
type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'learnhub-theme'

const screenTabs: Array<{ key: ScreenKey; label: string; icon: string }> = [
  { key: 'instructor', label: 'Instructor', icon: 'layout-dashboard' },
  { key: 'student', label: 'Student home', icon: 'home' },
  { key: 'admin', label: 'Admin analytics', icon: 'chart-bar' },
  { key: 'modules', label: 'Course modules', icon: 'list-details' },
]

const instructorModules = [
  { type: 'video', icon: 'video', name: 'Building Accessible Course Intros', status: 'published', progress: 92, meta: '18 min video' },
  { type: 'doc', icon: 'file-text', name: 'Inclusive Design Workbook', status: 'published', progress: 88, meta: 'PDF handout' },
  { type: 'quiz', icon: 'clipboard-check', name: 'Module 3 Knowledge Check', status: 'review', progress: 64, meta: '12 questions' },
  { type: 'audio', icon: 'headphones', name: 'Interview with Maya Chen', status: 'draft', progress: 36, meta: '24 min audio' },
]

const courses = [
  {
    icon: 'brand-react',
    color: 'blue',
    tag: 'Frontend',
    title: 'React Design Systems',
    progress: 72,
    modules: '9 of 12 modules',
  },
  {
    icon: 'database',
    color: 'teal',
    tag: 'Data',
    title: 'SQL for Product Teams',
    progress: 58,
    modules: '7 of 12 modules',
  },
  {
    icon: 'sparkles',
    color: 'purple',
    tag: 'AI Ops',
    title: 'Applied AI Workflows',
    progress: 41,
    modules: '5 of 12 modules',
  },
]

const activities = [
  { icon: 'player-play', title: 'Watched Layout Systems chapter', time: '28 min ago', xp: '+80 XP' },
  { icon: 'clipboard-check', title: 'Scored 91% on SQL joins quiz', time: '2 hours ago', xp: '+140 XP' },
  { icon: 'message-circle', title: 'Replied in AI ethics discussion', time: 'Yesterday', xp: '+45 XP' },
]

const deadlines = [
  { date: 'Jun 11', title: 'Design token audit', subtitle: 'React Design Systems', urgency: '2d', tone: 'danger' },
  { date: 'Jun 14', title: 'Window functions quiz', subtitle: 'SQL for Product Teams', urgency: '5d', tone: 'blue' },
  { date: 'Jun 21', title: 'Workflow review memo', subtitle: 'Applied AI Workflows', urgency: '12d', tone: 'teal' },
]

const sections = [
  {
    title: 'Foundations',
    complete: '4/4 complete',
    locked: false,
    modules: [
      { status: 'done', type: 'video', name: 'Course orientation', meta: 'Video - 8 min', score: 'Complete', progress: 100 },
      { status: 'done', type: 'doc', name: 'Design system vocabulary', meta: 'Document - 12 min', score: 'Complete', progress: 100 },
      { status: 'done', type: 'quiz', name: 'Foundations check', meta: 'Quiz - 10 min', score: '94%', progress: 94 },
      { status: 'done', type: 'audio', name: 'Critique habits', meta: 'Audio - 14 min', score: 'Complete', progress: 100 },
    ],
  },
  {
    title: 'Components and Patterns',
    complete: '2/5 complete',
    locked: false,
    modules: [
      { status: 'done', type: 'video', name: 'Anatomy of reusable components', meta: 'Video - 22 min', score: 'Complete', progress: 100 },
      { status: 'progress', type: 'video', name: 'Stateful form patterns', meta: 'Video - 31 min', score: 'In progress', progress: 64 },
      { status: 'todo', type: 'doc', name: 'Component API checklist', meta: 'Document - 16 min', score: 'Not started', progress: 0 },
      { status: 'todo', type: 'quiz', name: 'Pattern selection quiz', meta: 'Quiz - 15 min', score: 'Not started', progress: 0 },
      { status: 'todo', type: 'audio', name: 'Systems thinking roundtable', meta: 'Audio - 20 min', score: 'Not started', progress: 0 },
    ],
  },
  {
    title: 'Governance',
    complete: '0/3 complete',
    locked: true,
    unlock: 'Unlocks after section Components and Patterns',
    modules: [
      { status: 'locked', type: 'video', name: 'Release strategy', meta: 'Video - 18 min', score: 'Locked', progress: 0 },
      { status: 'locked', type: 'doc', name: 'Contribution model', meta: 'Document - 11 min', score: 'Locked', progress: 0 },
      { status: 'locked', type: 'quiz', name: 'Governance assessment', meta: 'Quiz - 20 min', score: 'Locked', progress: 0 },
    ],
  },
]

function loadExternalAssets() {
  if (!document.querySelector('link[data-learnhub-icons]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css'
    link.dataset.learnhubIcons = 'true'
    document.head.appendChild(link)
  }

  if (!document.querySelector('script[data-learnhub-chart]')) {
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
    script.async = true
    script.dataset.learnhubChart = 'true'
    document.head.appendChild(script)
  }
}

function Logo({ role }: { role: Role }) {
  return (
    <div className="lh-logo-row">
      <div className="lh-logo">
        learn<span>hub</span>
      </div>
      {role === 'Admin' ? <span className="lh-admin-pill">Admin</span> : null}
    </div>
  )
}

function Sidebar({ role, active }: { role: Role; active: string }) {
  const isAdmin = role === 'Admin'
  const name = role === 'Instructor' ? 'Avery Brooks' : role === 'Admin' ? 'Priya Shah' : 'Jordan Lee'
  const nav: Array<[string, string[]]> =
    role === 'Instructor'
      ? [
          ['TEACH', ['Dashboard', 'My courses', 'Students', 'Analytics']],
          ['CREATE', ['Upload', 'Media library', 'Quizzes', 'Course settings']],
        ]
      : role === 'Admin'
        ? [
            ['PLATFORM', ['Analytics', 'Users', 'Courses', 'Revenue']],
            ['OPERATIONS', ['Reports', 'Integrations', 'System health']],
          ]
        : [
            ['LEARN', ['Home', 'My courses', 'Assignments', 'Messages']],
            ['TOOLS', ['Calendar', 'Achievements', 'Settings']],
          ]

  function openSidebarScreen(item: string) {
    const target = sidebarScreenTarget(role, item)

    if (!target) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    params.set('screen', target)
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
    window.dispatchEvent(new CustomEvent('learnhub-screen', { detail: target }))
  }

  return (
    <aside className={`lh-sidebar ${isAdmin ? 'lh-sidebar-admin' : ''}`}>
      <Logo role={role} />
      <div className="lh-profile">
        <div className={`lh-avatar ${isAdmin ? 'lh-avatar-admin' : ''}`}>
          <i className={`ti ti-${isAdmin ? 'shield-check' : role === 'Instructor' ? 'chalkboard' : 'user'}`} />
        </div>
        <div>
          <strong>{name}</strong>
          <span>{role}</span>
        </div>
      </div>
      {role === 'Student' ? (
        <div className="lh-xp">
          <div>
            <span>XP progress</span>
            <strong>2340/3000</strong>
          </div>
          <div className="lh-progress"><span style={{ width: '78%' }} /></div>
        </div>
      ) : null}
      <nav className="lh-nav">
        {nav.map(([section, items]) => (
          <div key={section}>
            <p className="lh-section-label">{section}</p>
            {items.map((item, index) => (
              <button className={item === active ? 'is-active' : ''} key={item} onClick={() => openSidebarScreen(item)} type="button">
                <i className={`ti ti-${navIcon(item)}`} />
                <span>{item}</span>
                {isAdmin && index === 1 ? <em>{item === 'Users' ? '18' : '3'}</em> : null}
              </button>
            ))}
          </div>
        ))}
      </nav>
      {isAdmin ? (
        <div className="lh-system">
          <span />
          All systems operational
        </div>
      ) : null}
    </aside>
  )
}

function sidebarScreenTarget(role: Role, item: string): ScreenKey | null {
  if (role === 'Student' && item === 'Home') {
    return 'student'
  }

  if (role === 'Student' && item === 'My courses') {
    return 'modules'
  }

  if (role === 'Instructor' && item === 'Dashboard') {
    return 'instructor'
  }

  if (role === 'Admin' && item === 'Analytics') {
    return 'admin'
  }

  return null
}

function navIcon(item: string) {
  const icons: Record<string, string> = {
    Dashboard: 'layout-dashboard',
    'My courses': 'books',
    Students: 'users',
    Analytics: 'chart-line',
    Upload: 'cloud-upload',
    'Media library': 'photo-video',
    Quizzes: 'clipboard-check',
    'Course settings': 'settings',
    Home: 'home',
    Assignments: 'calendar-check',
    Messages: 'messages',
    Calendar: 'calendar',
    Achievements: 'award',
    Settings: 'settings',
    Users: 'users-group',
    Courses: 'book',
    Revenue: 'credit-card',
    Reports: 'report-analytics',
    Integrations: 'plug',
    'System health': 'heartbeat',
  }
  return icons[item] ?? 'circle'
}

function StatCard({ label, value, icon, delta, tone = 'blue' }: { label: string; value: string; icon: string; delta?: string; tone?: string }) {
  return (
    <article className="lh-card lh-stat">
      <div className={`lh-stat-icon ${tone}`}><i className={`ti ti-${icon}`} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      {delta ? <small className={delta.startsWith('↓') ? 'down' : 'up'}>{delta}</small> : null}
    </article>
  )
}

function Progress({ value, tone = 'blue' }: { value: number; tone?: string }) {
  return <div className="lh-progress"><span className={tone} style={{ width: `${value}%` }} /></div>
}

function InstructorDashboard() {
  return (
    <div className="lh-shell">
      <Sidebar role="Instructor" active="Dashboard" />
      <main className="lh-main">
        <TopTabs />
        <header className="lh-topbar">
          <div>
            <h1>Course studio</h1>
            <p>Manage content for Product Design Foundations</p>
          </div>
          <button className="lh-primary" type="button"><i className="ti ti-plus" />New module</button>
        </header>
        <section className="lh-stats-grid">
          <StatCard label="Total modules" value="28" icon="stack-2" />
          <StatCard label="Published" value="21" icon="circle-check" tone="teal" />
          <StatCard label="Drafts" value="5" icon="pencil" tone="amber" />
          <StatCard label="Avg completion" value="76%" icon="progress-check" tone="purple" />
        </section>
        <section className="lh-card lh-upload">
          <div className="lh-upload-icon"><i className="ti ti-cloud-upload" /></div>
          <h2>Upload learning content</h2>
          <p>Drag files here or choose a source from your media library.</p>
          <div className="lh-file-pills">
            {['MP4/MOV', 'PDF', 'PPTX', 'DOCX', 'MP3', 'ZIP'].map((file) => <span key={file}>{file}</span>)}
          </div>
        </section>
        <section className="lh-card">
          <div className="lh-card-head">
            <div>
              <h2>Current module list</h2>
              <p>Drag to reorder course content before publishing.</p>
            </div>
            <button className="lh-icon-btn" type="button" aria-label="Filter modules"><i className="ti ti-adjustments-horizontal" /></button>
          </div>
          <div className="lh-module-list">
            {instructorModules.map((module) => (
              <div className={`lh-module-row ${module.status}`} key={module.name}>
                <i className="ti ti-grip-vertical lh-drag" />
                <div className={`lh-type ${module.type}`}><i className={`ti ti-${module.icon}`} /></div>
                <div className="lh-module-name">
                  <strong>{module.name}</strong>
                  <span>{module.meta}</span>
                </div>
                <span className={`lh-badge ${module.status}`}>{module.status === 'review' ? 'In review' : module.status}</span>
                <div className="lh-row-progress"><Progress value={module.progress} tone={module.status === 'published' ? 'teal' : module.status === 'draft' ? 'amber' : 'purple'} /></div>
                <button className="lh-icon-btn" type="button" aria-label="Edit module"><i className="ti ti-edit" /></button>
                <button className="lh-icon-btn" type="button" aria-label="More module actions"><i className="ti ti-dots" /></button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function StudentHome() {
  return (
    <div className="lh-shell">
      <Sidebar role="Student" active="Home" />
      <main className="lh-main">
        <TopTabs />
        <header className="lh-topbar">
          <div>
            <h1>Good morning, Jordan</h1>
            <p>You are on track to finish two modules this week.</p>
          </div>
          <span className="lh-streak"><i className="ti ti-flame" />14 day streak</span>
        </header>
        <section className="lh-stats-grid">
          <StatCard label="Enrolled" value="6" icon="books" />
          <StatCard label="Completed" value="18" icon="circle-check" tone="teal" />
          <StatCard label="Hours learned" value="42.5" icon="clock-hour-4" tone="purple" />
          <StatCard label="Avg score" value="89%" icon="target-arrow" tone="amber" />
        </section>
        <section>
          <div className="lh-section-head">
            <h2>Continue learning</h2>
            <button className="lh-secondary" type="button">View all</button>
          </div>
          <div className="lh-course-grid">
            {courses.map((course) => (
              <article className="lh-card lh-course-card" key={course.title}>
                <div className={`lh-course-thumb ${course.color}`}><i className={`ti ti-${course.icon}`} /></div>
                <span className={`lh-tag ${course.color}`}>{course.tag}</span>
                <h3>{course.title}</h3>
                <p>{course.modules}</p>
                <Progress value={course.progress} tone={course.color} />
                <strong>{course.progress}% complete</strong>
              </article>
            ))}
          </div>
        </section>
        <section className="lh-two-col">
          <div className="lh-card">
            <div className="lh-card-head"><h2>Recent activity</h2></div>
            <div className="lh-feed">
              {activities.map((item) => (
                <div className="lh-feed-item" key={item.title}>
                  <div className="lh-feed-icon"><i className={`ti ti-${item.icon}`} /></div>
                  <div><strong>{item.title}</strong><span>{item.time}</span></div>
                  <em>{item.xp}</em>
                </div>
              ))}
            </div>
          </div>
          <div className="lh-card">
            <div className="lh-card-head"><h2>Upcoming deadlines</h2></div>
            <div className="lh-deadlines">
              {deadlines.map((item) => (
                <div className="lh-deadline" key={item.title}>
                  <div className="lh-date">{item.date}</div>
                  <div><strong>{item.title}</strong><span>{item.subtitle}</span></div>
                  <em className={item.tone}>{item.urgency}</em>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function useChart(canvasRef: React.RefObject<HTMLCanvasElement | null>, config: Record<string, unknown>) {
  useEffect(() => {
    let chart: { destroy: () => void } | null = null
    let timer = window.setInterval(() => {
      const context = canvasRef.current?.getContext('2d')
      if (!context || !window.Chart) {
        return
      }
      chart = new window.Chart(context, config)
      window.clearInterval(timer)
    }, 100)

    return () => {
      window.clearInterval(timer)
      chart?.destroy()
    }
  }, [canvasRef, config])
}

function AdminAnalytics() {
  const trendRef = useRef<HTMLCanvasElement>(null)
  const usersRef = useRef<HTMLCanvasElement>(null)
  const donutRef = useRef<HTMLCanvasElement>(null)

  const weeks = useMemo(() => ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'], [])
  useChart(trendRef, {
    type: 'line',
    data: {
      labels: weeks,
      datasets: [
        { label: 'This year', data: [420, 480, 510, 560, 610, 690, 720, 760, 835, 890, 940, 990], borderColor: '#7F77DD', backgroundColor: 'rgba(127,119,221,0.12)', tension: 0.35, fill: true },
        { label: 'Last year', data: [360, 390, 430, 455, 500, 520, 540, 575, 630, 670, 690, 730], borderColor: '#9ca3af', borderDash: [6, 5], tension: 0.35 },
      ],
    },
    options: chartOptions(),
  })
  useChart(usersRef, {
    type: 'bar',
    data: {
      labels: Array.from({ length: 30 }, (_, index) => `${index + 1}`),
      datasets: [{ label: 'Daily active users', data: [410, 438, 455, 462, 480, 520, 545, 610, 642, 601, 588, 615, 660, 690, 720, 780, 742, 735, 768, 805, 820, 840, 910, 875, 852, 890, 930, 960, 984, 1015], backgroundColor: Array.from({ length: 30 }, (_, index) => (index > 26 ? '#534AB7' : '#CECBF6')), borderRadius: 5 }],
    },
    options: chartOptions(),
  })
  useChart(donutRef, {
    type: 'doughnut',
    data: {
      labels: ['Video', 'Documents', 'Quizzes', 'Audio'],
      datasets: [{ data: [48, 24, 18, 10], backgroundColor: ['#534AB7', '#5d87ff', '#1D9E75', '#EF9F27'], borderWidth: 0 }],
    },
    options: { cutout: '68%', plugins: { legend: { display: false } } },
  })

  return (
    <div className="lh-shell lh-admin-theme">
      <Sidebar role="Admin" active="Analytics" />
      <main className="lh-main">
        <TopTabs />
        <header className="lh-topbar">
          <div>
            <h1>Platform analytics</h1>
            <p>Enrollment, engagement, and content performance.</p>
          </div>
          <div className="lh-range">
            {['7d', '30d', '90d', 'All time'].map((item) => <button className={item === '30d' ? 'is-selected' : ''} key={item} type="button">{item}</button>)}
          </div>
        </header>
        <section className="lh-stats-grid">
          <StatCard label="Total students" value="24,892" icon="users" delta="↑ 12.4%" tone="purple" />
          <StatCard label="Active courses" value="186" icon="book" delta="↑ 6.8%" tone="purple" />
          <StatCard label="Completions" value="9,742" icon="circle-check" delta="↑ 18.1%" tone="teal" />
          <StatCard label="Avg time/week" value="5.7h" icon="clock" delta="↓ 2.3%" tone="amber" />
        </section>
        <section className="lh-two-col">
          <div className="lh-card lh-chart-card"><div className="lh-card-head"><h2>Enrollment trend</h2></div><canvas ref={trendRef} /></div>
          <div className="lh-card lh-chart-card"><div className="lh-card-head"><h2>Daily active users</h2></div><canvas ref={usersRef} /></div>
        </section>
        <section className="lh-two-col">
          <div className="lh-card">
            <div className="lh-card-head"><h2>Top courses</h2></div>
            <div className="lh-table">
              {[
                ['React Design Systems', 92, '91%', 'high'],
                ['SQL for Product Teams', 78, '74%', 'mid'],
                ['Applied AI Workflows', 64, '67%', 'mid'],
                ['Manager Finance Basics', 48, '52%', 'low'],
              ].map(([name, enrollment, completion, tone]) => (
                <div className="lh-table-row" key={name as string}>
                  <strong>{name}</strong>
                  <div className="lh-enroll-bar"><span style={{ width: `${enrollment}%` }} /></div>
                  <em className={tone as string}>{completion}</em>
                </div>
              ))}
            </div>
          </div>
          <div className="lh-card lh-donut-card">
            <div className="lh-card-head"><h2>Content type mix</h2></div>
            <div className="lh-donut-layout">
              <canvas ref={donutRef} />
              <div className="lh-legend">
                {[
                  ['Video', '48%', '#534AB7'],
                  ['Documents', '24%', '#5d87ff'],
                  ['Quizzes', '18%', '#1D9E75'],
                  ['Audio', '10%', '#EF9F27'],
                ].map(([label, value, color]) => (
                  <div key={label}><span style={{ background: color }} />{label}<strong>{value}</strong></div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { boxWidth: 10, boxHeight: 10, color: '#6b7280', font: { size: 11 } } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#9ca3af', font: { size: 10 } } },
      y: { border: { display: false }, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#9ca3af', font: { size: 10 } } },
    },
  }
}

function CourseModules() {
  return (
    <div className="lh-shell">
      <Sidebar role="Student" active="My courses" />
      <main className="lh-main">
        <TopTabs />
        <section className="lh-card lh-course-header">
          <div className="lh-course-thumb blue"><i className="ti ti-brand-react" /></div>
          <div className="lh-course-title">
            <h1>React Design Systems</h1>
            <p>Avery Brooks - 12 modules - 6h 40m total</p>
            <Progress value={72} />
          </div>
          <strong>72%</strong>
          <button className="lh-primary" type="button"><i className="ti ti-player-play" />Resume</button>
        </section>
        <div className="lh-sections">
          {sections.map((section) => (
            <section className={`lh-card lh-module-section ${section.locked ? 'is-locked' : ''}`} key={section.title}>
              <div className="lh-section-bar">
                <button type="button"><i className="ti ti-chevron-down" /></button>
                <h2>{section.title}</h2>
                <span>{section.complete}</span>
                {section.locked ? <em>{section.unlock}</em> : null}
              </div>
              <div className="lh-course-modules">
                {section.modules.map((module) => (
                  <div className={`lh-course-module ${module.status}`} key={module.name}>
                    <div className={`lh-status-dot ${module.status}`}>
                      <i className={`ti ti-${module.status === 'done' ? 'check' : module.status === 'progress' ? 'player-play' : module.status === 'locked' ? 'lock' : 'circle'}`} />
                    </div>
                    <div className={`lh-type ${module.type}`}><i className={`ti ti-${typeIcon(module.type)}`} /></div>
                    <div className="lh-module-name"><strong>{module.name}</strong><span>{module.meta}</span></div>
                    <div className="lh-row-progress">{module.progress > 0 ? <Progress value={module.progress} tone={module.type === 'quiz' ? 'purple' : module.status === 'done' ? 'teal' : 'blue'} /> : null}</div>
                    <span className={`lh-badge ${module.status === 'done' ? 'published' : module.status === 'progress' ? 'active' : module.status}`}>{module.score}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}

function typeIcon(type: string) {
  return { video: 'video', doc: 'file-text', quiz: 'clipboard-check', audio: 'headphones' }[type] ?? 'file'
}

function TopTabs() {
  const [active, setActive] = useState<ScreenKey>(() => (new URLSearchParams(window.location.search).get('screen') as ScreenKey) || 'instructor')
  const [theme, setTheme] = useState<Theme>(() => (window.localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'light')

  useEffect(() => {
    const handler = (event: Event) => setActive((event as CustomEvent<ScreenKey>).detail)
    window.addEventListener('learnhub-screen', handler)
    return () => window.removeEventListener('learnhub-screen', handler)
  }, [])

  function switchScreen(key: ScreenKey) {
    const params = new URLSearchParams(window.location.search)
    params.set('screen', key)
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`)
    window.dispatchEvent(new CustomEvent('learnhub-screen', { detail: key }))
    setActive(key)
  }

  function switchTheme(nextTheme: Theme) {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    window.dispatchEvent(new CustomEvent('learnhub-theme', { detail: nextTheme }))
    setTheme(nextTheme)
  }

  return (
    <div className="lh-demo-tabs">
      <div className="lh-screen-tabs">
        {screenTabs.map((tab) => (
          <button className={active === tab.key ? 'is-active' : ''} key={tab.key} onClick={() => switchScreen(tab.key)} type="button">
            <i className={`ti ti-${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="lh-theme-toggle" aria-label="Theme selection">
        <button className={theme === 'light' ? 'is-active' : ''} onClick={() => switchTheme('light')} type="button">
          <i className="ti ti-sun" />
          Light
        </button>
        <button className={theme === 'dark' ? 'is-active' : ''} onClick={() => switchTheme('dark')} type="button">
          <i className="ti ti-moon" />
          Dark
        </button>
      </div>
    </div>
  )
}

export function LearnHubDemo() {
  const [screen, setScreen] = useState<ScreenKey>(() => (new URLSearchParams(window.location.search).get('screen') as ScreenKey) || 'instructor')
  const [theme, setTheme] = useState<Theme>(() => (window.localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'light')

  useEffect(() => {
    loadExternalAssets()
    const screenHandler = (event: Event) => setScreen((event as CustomEvent<ScreenKey>).detail)
    const themeHandler = (event: Event) => setTheme((event as CustomEvent<Theme>).detail)
    window.addEventListener('learnhub-screen', screenHandler)
    window.addEventListener('learnhub-theme', themeHandler)
    return () => {
      window.removeEventListener('learnhub-screen', screenHandler)
      window.removeEventListener('learnhub-theme', themeHandler)
    }
  }, [])

  return (
    <LearnHubStyles data-theme={theme}>
      {screen === 'instructor' ? <InstructorDashboard /> : null}
      {screen === 'student' ? <StudentHome /> : null}
      {screen === 'admin' ? <AdminAnalytics /> : null}
      {screen === 'modules' ? <CourseModules /> : null}
    </LearnHubStyles>
  )
}

const LearnHubStyles = styled.div`
  --primary: #5d87ff;
  --active-bg: #E6F1FB;
  --active-text: #0C447C;
  --active-dark: #185FA5;
  --success-bg: #E1F5EE;
  --success-text: #0F6E56;
  --success-fill: #1D9E75;
  --purple-bg: #EEEDFE;
  --purple-text: #534AB7;
  --purple-dark: #3C3489;
  --warning-bg: #FAEEDA;
  --warning-text: #854F0B;
  --warning-fill: #EF9F27;
  --danger-bg: #FCEBEB;
  --danger-text: #A32D2D;
  --text: #1a1a1a;
  --secondary: #6b7280;
  --tertiary: #9ca3af;
  --border: rgba(0,0,0,0.1);
  --border-light: rgba(0,0,0,0.06);
  --page: #f9f9f9;
  --surface: #fff;
  --surface-muted: #f3f4f6;
  --track: #edf0f4;
  --button-bg: #fff;
  --row-bg: #fff;
  min-height: 100vh;
  font: 13px/1.45 var(--font-sans, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  color: var(--text);
  background: var(--page);

  &[data-theme='dark'] {
    --active-bg: rgba(93,135,255,0.18);
    --active-text: #BFD1FF;
    --active-dark: #D7E2FF;
    --success-bg: rgba(29,158,117,0.18);
    --success-text: #9DE5CC;
    --purple-bg: rgba(127,119,221,0.2);
    --purple-text: #C9C5FF;
    --purple-dark: #DCD9FF;
    --warning-bg: rgba(239,159,39,0.18);
    --warning-text: #F8D38D;
    --danger-bg: rgba(163,45,45,0.2);
    --danger-text: #F4A9A9;
    --text: #F5F7FB;
    --secondary: #B6BFCC;
    --tertiary: #7F8A99;
    --border: rgba(255,255,255,0.14);
    --border-light: rgba(255,255,255,0.08);
    --page: #101318;
    --surface: #171B22;
    --surface-muted: #202631;
    --track: #2A3140;
    --button-bg: #1B2029;
    --row-bg: #151922;
  }

  * { box-sizing: border-box; }
  button { font: inherit; }
  h1, h2, h3, p { margin: 0; }

  .lh-shell { display: grid; grid-template-columns: 200px minmax(0, 1fr); min-height: 100vh; }
  .lh-sidebar { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; gap: 1rem; padding: 1rem; background: var(--surface); border-right: 0.5px solid var(--border); }
  .lh-logo-row { display: flex; align-items: center; justify-content: space-between; min-height: 30px; }
  .lh-logo { font-weight: 800; font-size: 18px; letter-spacing: 0; }
  .lh-logo span { color: var(--primary); }
  .lh-admin-pill { padding: 0.2rem 0.45rem; border-radius: 20px; background: var(--purple-bg); color: var(--purple-dark); font-size: 11px; font-weight: 700; }
  .lh-profile { display: flex; gap: 0.75rem; align-items: center; padding: 0.75rem; border: 0.5px solid var(--border-light); border-radius: 8px; background: var(--button-bg); }
  .lh-profile strong, .lh-profile span { display: block; }
  .lh-profile strong { font-size: 13px; }
  .lh-profile span { color: var(--secondary); font-size: 12px; }
  .lh-avatar, .lh-stat-icon, .lh-type, .lh-feed-icon, .lh-status-dot { display: grid; place-items: center; flex: 0 0 auto; }
  .lh-avatar { width: 34px; height: 34px; border-radius: 20px; background: var(--active-bg); color: var(--active-dark); font-size: 18px; }
  .lh-avatar-admin { background: var(--purple-bg); color: var(--purple-dark); }
  .lh-xp { padding: 0.75rem; border: 0.5px solid var(--border-light); border-radius: 8px; }
  .lh-xp > div:first-child { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 11px; color: var(--secondary); }
  .lh-nav { display: grid; gap: 1rem; }
  .lh-section-label { margin: 0 0 0.4rem; color: var(--tertiary); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
  .lh-nav button { width: 100%; display: flex; align-items: center; gap: 0.55rem; min-height: 34px; padding: 0.45rem 0.55rem; border: 0; border-radius: 6px; color: var(--secondary); background: transparent; text-align: left; cursor: pointer; }
  .lh-nav button i { font-size: 17px; }
  .lh-nav button.is-active { background: var(--active-bg); color: var(--active-dark); font-weight: 700; }
  .lh-admin-theme .lh-nav button.is-active, .lh-sidebar-admin .lh-nav button.is-active { background: var(--purple-bg); color: var(--purple-dark); }
  .lh-nav em { margin-left: auto; min-width: 22px; padding: 0.1rem 0.35rem; border-radius: 20px; background: var(--danger-bg); color: var(--danger-text); font-style: normal; font-size: 10px; text-align: center; }
  .lh-system { margin-top: auto; display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; border: 0.5px solid var(--border-light); border-radius: 8px; color: var(--success-text); font-size: 12px; }
  .lh-system span { width: 8px; height: 8px; border-radius: 20px; background: var(--success-fill); }
  .lh-main { min-width: 0; padding: 1.5rem; background: var(--page); }
  .lh-demo-tabs { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem; }
  .lh-screen-tabs, .lh-theme-toggle { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .lh-theme-toggle { padding: 0.2rem; border: 0.5px solid var(--border); border-radius: 8px; background: var(--surface); }
  .lh-demo-tabs button, .lh-range button, .lh-secondary { display: inline-flex; align-items: center; gap: 0.4rem; min-height: 32px; padding: 0.35rem 0.7rem; border: 0.5px solid var(--border); border-radius: 6px; background: var(--button-bg); color: var(--secondary); cursor: pointer; }
  .lh-demo-tabs .is-active, .lh-range .is-selected { background: var(--active-bg); border-color: rgba(93,135,255,0.3); color: var(--active-dark); font-weight: 700; }
  .lh-admin-theme .lh-demo-tabs .is-active, .lh-admin-theme .lh-range .is-selected { background: var(--purple-bg); color: var(--purple-dark); border-color: rgba(83,74,183,0.24); }
  .lh-topbar { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
  .lh-topbar h1, .lh-course-title h1 { font-size: 18px; line-height: 1.2; }
  .lh-topbar p, .lh-card-head p, .lh-course-title p { color: var(--secondary); margin-top: 0.2rem; }
  .lh-primary { display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem; min-height: 34px; padding: 0.45rem 0.8rem; border: 0.5px solid transparent; border-radius: 6px; background: var(--primary); color: #fff; font-weight: 700; cursor: pointer; }
  .lh-card { padding: 1rem; border: 0.5px solid var(--border); border-radius: 8px; background: var(--surface); box-shadow: none; }
  .lh-two-col, .lh-sections { margin-top: 1rem; }
  .lh-stats-grid { display: flex; flex-wrap: nowrap; align-items: stretch; gap: 1rem; margin-bottom: 1rem; }
  .lh-stats-grid > .lh-card,
  .lh-course-grid > .lh-card,
  .lh-two-col > .lh-card,
  .lh-sections > .lh-card {
    flex: 1 1 0;
    min-width: 0;
    height: 100%;
  }
  .lh-stat { display: grid; grid-template-columns: 38px 1fr; gap: 0.1rem 0.75rem; align-items: center; }
  .lh-stat-icon { grid-row: span 3; width: 38px; height: 38px; border-radius: 8px; background: var(--active-bg); color: var(--active-dark); font-size: 20px; }
  .lh-stat-icon.teal { background: var(--success-bg); color: var(--success-text); }
  .lh-stat-icon.amber { background: var(--warning-bg); color: var(--warning-text); }
  .lh-stat-icon.purple { background: var(--purple-bg); color: var(--purple-text); }
  .lh-stat span { color: var(--secondary); font-size: 12px; }
  .lh-stat strong { font-size: 18px; }
  .lh-stat small { font-weight: 700; font-size: 11px; }
  .lh-stat small.up { color: var(--success-text); }
  .lh-stat small.down { color: var(--danger-text); }
  .lh-upload { display: grid; place-items: center; gap: 0.55rem; margin-bottom: 1rem; min-height: 178px; border-style: dashed; border-color: rgba(93,135,255,0.55); text-align: center; }
  .lh-upload-icon { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 20px; background: var(--active-bg); color: var(--active-dark); font-size: 24px; }
  .lh-upload h2, .lh-card-head h2, .lh-section-head h2 { font-size: 15px; }
  .lh-upload p { color: var(--secondary); }
  .lh-file-pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.45rem; }
  .lh-file-pills span, .lh-badge, .lh-tag, .lh-streak, .lh-table-row em, .lh-deadline em { border-radius: 6px; padding: 0.22rem 0.5rem; font-size: 11px; font-weight: 700; }
  .lh-file-pills span { border: 0.5px solid var(--border-light); background: var(--button-bg); color: var(--secondary); }
  .lh-card-head, .lh-section-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.85rem; }
  .lh-icon-btn { display: grid; place-items: center; width: 30px; height: 30px; border: 0.5px solid var(--border-light); border-radius: 6px; background: var(--button-bg); color: var(--secondary); cursor: pointer; }
  .lh-module-list, .lh-feed, .lh-deadlines, .lh-table, .lh-course-modules { display: grid; gap: 0.55rem; }
  .lh-module-row, .lh-course-module, .lh-feed-item, .lh-deadline, .lh-table-row { display: grid; align-items: center; gap: 0.75rem; padding: 0.75rem; border: 0.5px solid var(--border-light); border-radius: 8px; background: var(--row-bg); }
  .lh-module-row { grid-template-columns: 18px 34px minmax(180px, 1fr) auto minmax(120px, 180px) 30px 30px; border-left: 3px solid var(--success-fill); }
  .lh-module-row.draft { border-left-color: var(--warning-fill); }
  .lh-module-row.review { border-left-color: var(--purple-text); }
  .lh-drag { color: var(--tertiary); }
  .lh-type { width: 34px; height: 34px; border-radius: 8px; font-size: 18px; }
  .lh-type.video { color: var(--active-dark); background: var(--active-bg); }
  .lh-type.doc { color: var(--success-text); background: var(--success-bg); }
  .lh-type.quiz { color: var(--purple-text); background: var(--purple-bg); }
  .lh-type.audio { color: var(--warning-text); background: var(--warning-bg); }
  .lh-module-name strong, .lh-module-name span { display: block; }
  .lh-module-name span { color: var(--secondary); font-size: 12px; }
  .lh-badge { justify-self: start; text-transform: capitalize; }
  .lh-badge.published { background: var(--success-bg); color: var(--success-text); }
  .lh-badge.draft { background: var(--warning-bg); color: var(--warning-text); }
  .lh-badge.review, .lh-badge.active { background: var(--purple-bg); color: var(--purple-text); }
  .lh-badge.progress { background: var(--active-bg); color: var(--active-text); }
  .lh-badge.todo, .lh-badge.locked { background: var(--surface-muted); color: var(--secondary); }
  .lh-progress { height: 7px; overflow: hidden; border-radius: 20px; background: var(--track); }
  .lh-progress span { display: block; height: 100%; border-radius: inherit; background: var(--primary); }
  .lh-progress span.teal { background: var(--success-fill); }
  .lh-progress span.amber { background: var(--warning-fill); }
  .lh-progress span.purple { background: var(--purple-text); }
  .lh-streak { display: inline-flex; align-items: center; gap: 0.35rem; background: var(--warning-bg); color: var(--warning-text); }
  .lh-course-grid { display: flex; flex-wrap: nowrap; align-items: stretch; gap: 1rem; }
  .lh-course-card { display: flex; flex-direction: column; gap: 0.65rem; }
  .lh-course-thumb { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 8px; font-size: 26px; }
  .lh-course-thumb.blue, .lh-tag.blue { background: var(--active-bg); color: var(--active-dark); }
  .lh-course-thumb.teal, .lh-tag.teal { background: var(--success-bg); color: var(--success-text); }
  .lh-course-thumb.purple, .lh-tag.purple { background: var(--purple-bg); color: var(--purple-text); }
  .lh-course-card h3 { font-size: 15px; }
  .lh-course-card p { color: var(--secondary); }
  .lh-course-card .lh-progress { margin-top: auto; }
  .lh-course-card > strong { font-size: 12px; color: var(--secondary); }
  .lh-two-col { display: flex; flex-wrap: nowrap; align-items: stretch; gap: 1rem; }
  .lh-feed-item { grid-template-columns: 34px minmax(0, 1fr) auto; }
  .lh-feed-icon { width: 34px; height: 34px; border-radius: 8px; background: var(--active-bg); color: var(--active-dark); }
  .lh-feed-item span, .lh-deadline span { display: block; color: var(--secondary); font-size: 12px; }
  .lh-feed-item em { padding: 0.2rem 0.45rem; border-radius: 20px; background: var(--success-bg); color: var(--success-text); font-style: normal; font-size: 11px; font-weight: 700; }
  .lh-deadline { grid-template-columns: 54px minmax(0, 1fr) auto; }
  .lh-date { display: grid; place-items: center; min-height: 42px; border-radius: 8px; background: var(--surface-muted); color: var(--secondary); font-weight: 800; font-size: 12px; }
  .lh-deadline em { font-style: normal; }
  .lh-deadline em.danger { background: var(--danger-bg); color: var(--danger-text); }
  .lh-deadline em.blue { background: var(--active-bg); color: var(--active-text); }
  .lh-deadline em.teal { background: var(--success-bg); color: var(--success-text); }
  .lh-range { display: flex; gap: 0.4rem; }
  .lh-chart-card { min-height: 310px; }
  .lh-chart-card canvas { width: 100% !important; height: 235px !important; }
  .lh-table-row { grid-template-columns: minmax(160px, 1fr) minmax(120px, 200px) 54px; }
  .lh-enroll-bar { height: 8px; border-radius: 20px; background: var(--track); overflow: hidden; }
  .lh-enroll-bar span { display: block; height: 100%; border-radius: inherit; background: var(--purple-text); }
  .lh-table-row em { text-align: center; font-style: normal; }
  .lh-table-row em.high { background: var(--success-bg); color: var(--success-text); }
  .lh-table-row em.mid { background: var(--warning-bg); color: var(--warning-text); }
  .lh-table-row em.low { background: var(--danger-bg); color: var(--danger-text); }
  .lh-donut-layout { display: grid; grid-template-columns: 170px 1fr; align-items: center; gap: 1rem; }
  .lh-donut-layout canvas { width: 170px !important; height: 170px !important; }
  .lh-legend { display: grid; gap: 0.65rem; }
  .lh-legend div { display: grid; grid-template-columns: 10px 1fr auto; align-items: center; gap: 0.5rem; color: var(--secondary); }
  .lh-legend span { width: 10px; height: 10px; border-radius: 20px; }
  .lh-legend strong { color: var(--text); }
  .lh-course-header { display: grid; grid-template-columns: 56px minmax(0, 1fr) auto auto; align-items: center; gap: 1rem; }
  .lh-course-title { display: grid; gap: 0.45rem; }
  .lh-course-header > strong { color: var(--active-dark); font-size: 16px; }
  .lh-section-bar { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.75rem; }
  .lh-section-bar button { display: grid; place-items: center; width: 26px; height: 26px; border: 0.5px solid var(--border-light); border-radius: 6px; background: var(--button-bg); color: var(--secondary); }
  .lh-section-bar h2 { font-size: 15px; }
  .lh-section-bar span { margin-left: auto; color: var(--secondary); font-size: 12px; }
  .lh-section-bar em { color: var(--tertiary); font-style: normal; font-size: 12px; }
  .lh-module-section.is-locked { opacity: 0.5; }
  .lh-sections { display: grid; align-items: stretch; gap: 1rem; }
  .lh-course-module { grid-template-columns: 30px 34px minmax(180px, 1fr) minmax(110px, 180px) auto; }
  .lh-course-module.locked { pointer-events: none; }
  .lh-status-dot { width: 30px; height: 30px; border-radius: 20px; border: 0.5px solid var(--border); color: var(--secondary); }
  .lh-status-dot.done { background: var(--success-bg); color: var(--success-text); border-color: transparent; }
  .lh-status-dot.progress { background: var(--active-bg); color: var(--active-text); border-color: transparent; }
  .lh-status-dot.locked { background: var(--surface-muted); color: var(--secondary); }

  .lh-main > * {
    width: min(100%, 1200px);
    margin-left: auto;
    margin-right: auto;
  }

  @media (max-width: 980px) {
    .lh-shell { grid-template-columns: 1fr; }
    .lh-sidebar { position: static; height: auto; }
    .lh-stats-grid, .lh-course-grid, .lh-two-col { flex-direction: column; }
    .lh-module-row, .lh-course-module, .lh-course-header { grid-template-columns: 1fr; align-items: start; }
    .lh-row-progress { width: 100%; }
  }
`
