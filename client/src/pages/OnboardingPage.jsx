import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { API_BASE_URL } from '../config/api'
import SkillSwapLogo from '../components/common/SkillSwapLogo'
import { clearToken, getToken } from '../utils/authStorage'
import { fetchOnboardingStatus } from '../utils/onboardingStatus'

const levelOptions = ['beginner', 'intermediate', 'advanced']
const timezoneOptions = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
]

function OnboardingPage() {
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [bio, setBio] = useState('')
  const [timezone, setTimezone] = useState('')
  const [fileName, setFileName] = useState('')
  const [photoPreview, setPhotoPreview] = useState('/profile.png')

  const [offeredDraft, setOfferedDraft] = useState({ skillId: '', level: 'beginner' })
  const [learningDraft, setLearningDraft] = useState({
    skillId: '',
    currentLevel: 'beginner',
    targetLevel: 'intermediate',
  })

  const [skillsOffered, setSkillsOffered] = useState([])
  const [skillsToLearn, setSkillsToLearn] = useState([])

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const token = getToken()

        if (!token) {
          navigate('/login', { replace: true })
          return
        }

        const [onboardingStatusResponse, skillsResponse] = await Promise.all([
          fetchOnboardingStatus(token),
          fetch(`${API_BASE_URL}/skills`),
        ])

        const skillsJson = await skillsResponse.json()

        if (!skillsResponse.ok) {
          throw new Error(skillsJson.message || 'Failed to load skills')
        }

        if (onboardingStatusResponse.isOnboardingComplete) {
          navigate('/dashboard', { replace: true })
          return
        }

        setSkills(skillsJson.skills || [])
      } catch (_loadError) {
        clearToken()
        navigate('/login', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [navigate])

  const skillNameById = useMemo(() => {
    const byId = new Map()
    skills.forEach((skill) => byId.set(skill._id, skill.name))
    return byId
  }, [skills])

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      setFileName('')
      setPhotoPreview('/profile.png')
      return
    }

    setFileName(file.name)
    const previewUrl = URL.createObjectURL(file)
    setPhotoPreview(previewUrl)
  }

  const addOfferedSkill = () => {
    setError('')

    if (!offeredDraft.skillId) {
      setError('Select a skill you know first')
      return
    }

    if (skillsOffered.some((entry) => entry.skillId === offeredDraft.skillId)) {
      setError('This offered skill is already added')
      return
    }

    setSkillsOffered((prev) => [...prev, offeredDraft])
    setOfferedDraft({ skillId: '', level: 'beginner' })
  }

  const addLearningSkill = () => {
    setError('')

    if (!learningDraft.skillId) {
      setError('Select a skill you want to learn first')
      return
    }

    if (skillsToLearn.some((entry) => entry.skillId === learningDraft.skillId)) {
      setError('This learning skill is already added')
      return
    }

    setSkillsToLearn((prev) => [...prev, learningDraft])
    setLearningDraft({ skillId: '', currentLevel: 'beginner', targetLevel: 'intermediate' })
  }

  const removeOfferedSkill = (skillId) => {
    setSkillsOffered((prev) => prev.filter((entry) => entry.skillId !== skillId))
  }

  const removeLearningSkill = (skillId) => {
    setSkillsToLearn((prev) => prev.filter((entry) => entry.skillId !== skillId))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!bio.trim()) {
      setError('Bio is required')
      return
    }

    if (!timezone.trim()) {
      setError('Timezone is required')
      return
    }

    if (skillsOffered.length === 0) {
      setError('Add at least one skill you know')
      return
    }

    if (skillsToLearn.length === 0) {
      setError('Add at least one skill you want to learn')
      return
    }

    try {
      setSaving(true)
      const token = getToken()

      const payload = {
        bio: bio.trim(),
        timezone: timezone.trim(),
        skillsOffered: skillsOffered.map((entry) => ({
          skillId: entry.skillId,
          level: entry.level,
          experienceYears: 0,
          hourlyRate: 0,
          isActive: true,
        })),
        skillsToLearn: skillsToLearn.map((entry) => ({
          skillId: entry.skillId,
          currentLevel: entry.currentLevel,
          targetLevel: entry.targetLevel,
        })),
      }

      const apiResponse = await fetch(`${API_BASE_URL}/profile/onboarding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const response = await apiResponse.json()

      if (!apiResponse.ok) {
        throw new Error(response.message || 'Failed to save onboarding')
      }

      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfcff] px-4 text-slate-800">
        <p className="text-sm text-slate-600">Loading onboarding...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fbfcff] px-4 py-10 text-slate-800">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 inline-flex">
          <SkillSwapLogo />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]"
        >
          <h1 className="text-2xl font-bold text-slate-900">Complete your onboarding</h1>
          <p className="mt-1 text-sm text-slate-600">Keep it simple: basic profile + skills.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={3}
                placeholder="Tell us about yourself"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="timezone">
                Timezone
              </label>
              <select
                id="timezone"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                required
              >
                <option value="">Select timezone</option>
                {timezoneOptions.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="photo">
                Profile Photo (dummy for now)
              </label>
              <input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <img src={photoPreview} alt="Profile preview" className="h-12 w-12 rounded-full object-cover" />
                <div>
                  <p className="text-xs font-medium text-slate-700">{fileName || 'Using default profile image'}</p>
                  <p className="text-xs text-slate-500">Upload UI is ready. Backend currently saves default image.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Skills you know</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <select
                  value={offeredDraft.skillId}
                  onChange={(event) => setOfferedDraft((prev) => ({ ...prev, skillId: event.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select skill</option>
                  {skills.map((skill) => (
                    <option key={skill._id} value={skill._id}>
                      {skill.name}
                    </option>
                  ))}
                </select>

                <select
                  value={offeredDraft.level}
                  onChange={(event) => setOfferedDraft((prev) => ({ ...prev, level: event.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={addOfferedSkill}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Add skill
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {skillsOffered.map((entry) => (
                  <div key={entry.skillId} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                    <p>
                      {skillNameById.get(entry.skillId)} • {entry.level}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeOfferedSkill(entry.skillId)}
                      className="font-medium text-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Skills you want to learn</p>
              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <select
                  value={learningDraft.skillId}
                  onChange={(event) => setLearningDraft((prev) => ({ ...prev, skillId: event.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select skill</option>
                  {skills.map((skill) => (
                    <option key={skill._id} value={skill._id}>
                      {skill.name}
                    </option>
                  ))}
                </select>

                <select
                  value={learningDraft.currentLevel}
                  onChange={(event) => setLearningDraft((prev) => ({ ...prev, currentLevel: event.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>
                      current: {level}
                    </option>
                  ))}
                </select>

                <select
                  value={learningDraft.targetLevel}
                  onChange={(event) => setLearningDraft((prev) => ({ ...prev, targetLevel: event.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>
                      target: {level}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={addLearningSkill}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Add skill
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {skillsToLearn.map((entry) => (
                  <div key={entry.skillId} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                    <p>
                      {skillNameById.get(entry.skillId)} • {entry.currentLevel} → {entry.targetLevel}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeLearningSkill(entry.skillId)}
                      className="font-medium text-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="animated-gradient-btn w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Complete onboarding'}
            </button>
          </form>
        </motion.div>
      </div>
    </main>
  )
}

export default OnboardingPage
