import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import SkillSwapLogo from '../components/common/SkillSwapLogo'
import FeatureCard from '../components/landing/FeatureCard'
import SectionBlock from '../components/landing/SectionBlock'
import SectionTitle from '../components/landing/SectionTitle'

const coreFeatures = [
  {
    title: 'Live 1:1 Video Sessions',
    description: 'High-quality mentor sessions with post-class feedback and ratings.',
    icon: '🎥',
  },
  {
    title: 'Smart Scheduling',
    description: 'Calendar-first booking with flexible slots for both mentors and learners.',
    icon: '🗓️',
  },
  {
    title: 'Hybrid Credit Economy',
    description: 'Pay with money or earn credits by teaching and use them to learn.',
    icon: '💳',
  },
  {
    title: 'Goal-Based Roadmaps',
    description: 'Structured milestones like frontend, guitar, or public speaking goals.',
    icon: '🧭',
  },
  {
    title: 'Roadmap-Aware Matching',
    description: 'Find mentors by skill, milestone, ratings, and compatibility.',
    icon: '🎯',
  },
  {
    title: 'AI Learning Assistant',
    description: 'Roadmaps, summaries, next steps, and guided progression support.',
    icon: '🤖',
  },
  {
    title: 'Real-Time Translation',
    description: 'Subtitles and language support for inclusive global learning.',
    icon: '🌍',
  },
  {
    title: 'Campus Leaderboards',
    description: 'Mentor rankings, streaks, and badges that reward contribution.',
    icon: '🏆',
  },
]

const skillGroups = [
  {
    title: 'Academic Skills',
    items: ['Mathematics', 'Science', 'Programming', 'Competitive Exams', 'Language Learning'],
    color: 'from-sky-100 to-blue-50',
  },
  {
    title: 'Technical Skills',
    items: ['Web Development', 'App Development', 'UI/UX Design', 'Data Science', 'AI Fundamentals'],
    color: 'from-violet-100 to-indigo-50',
  },
  {
    title: 'Extracurricular Skills',
    items: ['Guitar', 'Singing', 'Chess', 'Photography', 'Video Editing', 'Fitness', 'Debate'],
    color: 'from-emerald-100 to-teal-50',
  },
]

const platformFlow = [
  'Choose a Skill or Goal',
  'Get Matched by Milestone',
  'Learn or Teach Live',
  'Earn and Spend Credits',
  'Track Progress and Streaks',
]

const trustSignals = [
  { label: 'Students onboarded', value: '10K+' },
  { label: 'Skill sessions hosted', value: '45K+' },
  { label: 'Mentor satisfaction', value: '4.9/5' },
]

function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 16)
    }

    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main className="bg-[#fbfcff] text-slate-800">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.16),transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(56,189,248,0.14),transparent_40%)]" />

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'border-b border-slate-200/70 bg-white/75 backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <a href="#top" className="flex items-center gap-2">
            <SkillSwapLogo />
          </a>

          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="transition hover:text-slate-900">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-slate-900">
              How It Works
            </a>
            <a href="#community" className="transition hover:text-slate-900">
              Community
            </a>
            <Link to="/login" className="transition hover:text-slate-900">
              Login
            </Link>
            <Link
              to="/register"
              className="animated-gradient-btn rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-200 transition hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>

          <Link to="/register" className="animated-gradient-btn rounded-lg px-3 py-2 text-xs font-semibold text-white md:hidden">
            Get Started
          </Link>
        </nav>
      </header>

      <section id="top" className="mx-auto w-full max-w-6xl px-6 pb-16 pt-28 md:pt-36">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-5 inline-flex rounded-full border border-violet-100 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 shadow-sm"
            >
              Student-Driven Skill Ecosystem
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="text-4xl font-bold tracking-tight text-slate-900 md:text-6xl"
            >
              Learn Any Skill. Teach What You Know.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg"
            >
              SkillSwap is a modern peer-to-peer platform where students grow by learning one skill and teaching
              another, powered by credits, AI guidance, and roadmap-aware mentor matching.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Link
                to="/register"
                className="animated-gradient-btn rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5"
              >
                Start Learning
              </Link>
              <Link
                to="/register"
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700"
              >
                Become a Mentor
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_-40px_rgba(99,102,241,0.55)] backdrop-blur"
          >
            <p className="mb-4 text-sm font-semibold text-slate-700">Live Collaboration Preview</p>
            <div className="grid gap-4 md:grid-cols-2">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-2xl border border-sky-100 bg-sky-50 p-4"
              >
                <p className="text-sm font-semibold text-sky-700">Frontend Roadmap</p>
                <p className="mt-2 text-xs text-slate-600">Milestone 3 in progress • AI summary ready</p>
              </motion.div>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                className="rounded-2xl border border-violet-100 bg-violet-50 p-4"
              >
                <p className="text-sm font-semibold text-violet-700">Mentor Match</p>
                <p className="mt-2 text-xs text-slate-600">98% compatibility • 4.9 rating • Available today</p>
              </motion.div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {trustSignals.map((item, index) => (
                <motion.div
                  key={item.label}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3 + index * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="rounded-xl border border-slate-100 bg-white p-3"
                >
                  <p className="text-lg font-bold text-slate-900">{item.value}</p>
                  <p className="text-xs text-slate-600">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <SectionBlock id="features" className="mx-auto w-full max-w-6xl px-6 py-16">
        <SectionTitle
          eyebrow="Skill Universe"
          title="One Platform, Every Kind of Skill"
          subtitle="Academic, technical, and extracurricular growth with a clean, goal-first experience."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {skillGroups.map((group) => (
            <motion.article
              key={group.title}
              whileHover={{ y: -5 }}
              className={`rounded-2xl border border-slate-100 bg-gradient-to-br ${group.color} p-5 shadow-[0_12px_35px_-28px_rgba(30,64,175,0.55)]`}
            >
              <h3 className="text-base font-semibold text-slate-900">{group.title}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <span key={item} className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700">
                    {item}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock className="mx-auto w-full max-w-6xl px-6 py-16">
        <SectionTitle
          eyebrow="Core Features"
          title="Structure, Intelligence, and Community in One Experience"
          subtitle="Everything needed to make student growth collaborative, accessible, and outcome-focused."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {coreFeatures.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </SectionBlock>

      <SectionBlock id="how-it-works" className="mx-auto w-full max-w-6xl px-6 py-16">
        <SectionTitle
          eyebrow="How It Works"
          title="From Goal Selection to Skill Mastery"
          subtitle="SkillSwap keeps every step simple so students can focus on real progress."
        />
        <div className="grid gap-4 md:grid-cols-5">
          {platformFlow.map((step, index) => (
            <motion.div
              key={step}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-[0_8px_25px_-20px_rgba(30,64,175,0.45)]"
            >
              <p className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-violet-100 text-sm font-bold text-violet-700">
                {index + 1}
              </p>
              <p className="text-sm font-medium text-slate-700">{step}</p>
            </motion.div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock className="mx-auto w-full max-w-6xl px-6 py-16">
        <SectionTitle
          eyebrow="Roadmap Highlight"
          title="Goal Example: Become a Frontend Developer"
          subtitle="Milestone-aware mentor matching and progress tracking keep learners accountable."
        />
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_16px_45px_-30px_rgba(99,102,241,0.55)]">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-900">Roadmap Completion</h3>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">72% Complete</span>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: '72%' }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-sky-400 via-violet-500 to-indigo-500"
            />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">✅ HTML, CSS, and Layout Systems</p>
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">✅ JavaScript + DOM Mastery</p>
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">⏳ React + API Project Build</p>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock className="mx-auto w-full max-w-6xl px-6 py-16">
        <SectionTitle
          eyebrow="Earn and Learn"
          title="A Fair Credit Economy for Students"
          subtitle="Contribution gets rewarded, and learning becomes more accessible for everyone."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {['Teach to Earn Credits', 'Learn Using Credits', 'Community-Driven Growth'].map((item) => (
            <motion.div
              key={item}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-[0_10px_30px_-24px_rgba(15,23,42,0.5)]"
            >
              <p className="text-sm font-semibold text-slate-800">{item}</p>
            </motion.div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock className="mx-auto w-full max-w-6xl px-6 py-16">
        <SectionTitle
          eyebrow="Credit Economy"
          title="Teach → Earn Credits → Learn Other Skills"
          subtitle="A hybrid money + credits model that keeps growth fair, collaborative, and sustainable."
        />
        <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-[0_8px_25px_-20px_rgba(30,64,175,0.45)]">
            <p className="text-sm font-semibold text-slate-900">Teach Skills</p>
            <p className="mt-1 text-xs text-slate-600">Host live sessions and help peers level up.</p>
          </div>
          <p className="hidden text-center text-2xl text-violet-500 md:block">→</p>
          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5 text-center shadow-[0_8px_25px_-20px_rgba(139,92,246,0.45)]">
            <p className="text-sm font-semibold text-slate-900">Earn Credits</p>
            <p className="mt-1 text-xs text-slate-600">Get rewarded for contribution and consistency.</p>
          </div>
          <p className="hidden text-center text-2xl text-violet-500 md:block">→</p>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-[0_8px_25px_-20px_rgba(30,64,175,0.45)]">
            <p className="text-sm font-semibold text-slate-900">Learn New Skills</p>
            <p className="mt-1 text-xs text-slate-600">Use credits to book sessions and keep growing.</p>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock id="community" className="mx-auto w-full max-w-6xl px-6 py-16">
        <SectionTitle
          eyebrow="Community"
          title="Competitive, Collaborative, and Recognized"
          subtitle="Students stay consistent with rankings, streaks, and contribution badges."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {['Top Mentors', 'Campus Rankings', 'Skill Contribution Streaks'].map((item) => (
            <motion.div
              key={item}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-6 text-center shadow-[0_10px_35px_-28px_rgba(30,41,59,0.6)]"
            >
              <p className="text-sm font-semibold text-slate-800">{item}</p>
            </motion.div>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock className="mx-auto w-full max-w-6xl px-6 pb-24 pt-10">
        <div className="rounded-3xl border border-violet-100 bg-gradient-to-r from-sky-50 via-white to-violet-50 px-6 py-12 text-center shadow-[0_20px_50px_-35px_rgba(99,102,241,0.6)] md:px-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Start Your Skill Journey Today.</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
            Build skills faster, teach what you already know, and grow with a student-powered community designed for
            meaningful outcomes.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="animated-gradient-btn rounded-xl px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5"
            >
              Join SkillSwap
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:text-violet-700"
            >
              Explore Skills
            </a>
          </div>
        </div>
      </SectionBlock>
    </main>
  )
}

export default LandingPage
