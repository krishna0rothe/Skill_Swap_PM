const {
  createProfile,
  getProfileByUserId,
  getOnboardingStatus,
  upsertOnboardingProfile,
  updateProfile,
} = require('../services/profile.service')

const create = async (req, res) => {
  try {
    const profile = await createProfile(req.user.userId, req.body)
    return res.status(201).json({ profile })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const me = async (req, res) => {
  try {
    const profile = await getProfileByUserId(req.user.userId)

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' })
    }

    return res.status(200).json({ profile })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const onboardingStatus = async (req, res) => {
  try {
    const status = await getOnboardingStatus(req.user.userId)
    return res.status(200).json(status)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const submitOnboarding = async (req, res) => {
  try {
    const profile = await upsertOnboardingProfile(req.user.userId, req.body)
    return res.status(200).json({ profile })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const updateMe = async (req, res) => {
  try {
    const profile = await updateProfile(req.user.userId, req.body)
    return res.status(200).json({ profile })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

module.exports = {
  create,
  me,
  onboardingStatus,
  submitOnboarding,
  updateMe,
}
