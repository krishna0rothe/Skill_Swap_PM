const mongoose = require('mongoose')
const Profile = require('../models/Profile')
const Skill = require('../models/Skill')

const DEFAULT_PROFILE_PICTURE = '/profile.png'

const trimStringOrEmpty = (value) => (typeof value === 'string' ? value.trim() : '')

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value)

const toSkillIdString = (value) => {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && value.toString) {
    return value.toString()
  }

  return ''
}

const ensureNoDuplicateSkillIds = (items = []) => {
  const ids = items.map((item) => toSkillIdString(item.skillId))
  return ids.length === new Set(ids).size
}

const ensureSkillsExist = async (items = []) => {
  const skillIds = [...new Set(items.map((item) => toSkillIdString(item.skillId)))]

  if (skillIds.length === 0) {
    return true
  }

  const found = await Skill.find({ _id: { $in: skillIds }, isActive: true }).select('_id')
  return found.length === skillIds.length
}

const validateSkillEntries = async (entries = []) => {
  const hasInvalidSkillId = entries.some((item) => !isValidObjectId(item.skillId))
  if (hasInvalidSkillId) {
    throw new Error('One or more skillId values are invalid')
  }

  if (!ensureNoDuplicateSkillIds(entries)) {
    throw new Error('Duplicate skill entries are not allowed')
  }

  const allSkillsExist = await ensureSkillsExist(entries)
  if (!allSkillsExist) {
    throw new Error('One or more skills do not exist or are inactive')
  }
}

const normalizeOfferedSkills = (skillsOffered = []) =>
  skillsOffered.map((item) => ({
    skillId: item.skillId,
    level: item.level,
    experienceYears: item.experienceYears,
    hourlyRate: item.hourlyRate,
    isActive: item.isActive,
  }))

const normalizeLearningSkills = (skillsToLearn = []) =>
  skillsToLearn.map((item) => ({
    skillId: item.skillId,
    currentLevel: item.currentLevel,
    targetLevel: item.targetLevel,
  }))

const validateOnboardingPayload = async (payload) => {
  const bio = trimStringOrEmpty(payload.bio)
  const timezone = trimStringOrEmpty(payload.timezone)
  const skillsOffered = Array.isArray(payload.skillsOffered) ? payload.skillsOffered : []
  const skillsToLearn = Array.isArray(payload.skillsToLearn) ? payload.skillsToLearn : []

  if (!bio) {
    throw new Error('Bio is required')
  }

  if (!timezone) {
    throw new Error('Timezone is required')
  }

  if (skillsOffered.length === 0) {
    throw new Error('At least one offered skill is required')
  }

  if (skillsToLearn.length === 0) {
    throw new Error('At least one skill to learn is required')
  }

  await validateSkillEntries(skillsOffered)
  await validateSkillEntries(skillsToLearn)

  return {
    bio,
    timezone,
    profilePicture: trimStringOrEmpty(payload.profilePicture) || DEFAULT_PROFILE_PICTURE,
    languagesSpoken: Array.isArray(payload.languagesSpoken) ? payload.languagesSpoken : [],
    skillsOffered: normalizeOfferedSkills(skillsOffered),
    skillsToLearn: normalizeLearningSkills(skillsToLearn),
  }
}

const createProfile = async (userId, payload) => {
  const existingProfile = await Profile.findOne({ userId })

  if (existingProfile) {
    throw new Error('Profile already exists for this user')
  }

  const skillsOffered = payload.skillsOffered || []
  const skillsToLearn = payload.skillsToLearn || []

  await validateSkillEntries(skillsOffered)
  await validateSkillEntries(skillsToLearn)

  return Profile.create({ userId, ...payload })
}

const getProfileByUserId = async (userId) => {
  return Profile.findOne({ userId })
    .populate('skillsOffered.skillId', 'name slug category')
    .populate('skillsToLearn.skillId', 'name slug category')
}

const getOnboardingStatus = async (userId) => {
  const profile = await getProfileByUserId(userId)

  if (!profile) {
    return {
      isOnboardingComplete: false,
      profile: null,
    }
  }

  return {
    isOnboardingComplete: Boolean(profile.isOnboardingComplete),
    profile,
  }
}

const upsertOnboardingProfile = async (userId, payload) => {
  const onboardingData = await validateOnboardingPayload(payload)

  const profile = await Profile.findOneAndUpdate(
    { userId },
    {
      $set: {
        ...onboardingData,
        isOnboardingComplete: true,
        onboardingCompletedAt: new Date(),
      },
      $setOnInsert: {
        userId,
      },
    },
    {
      new: true,
      runValidators: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  )
    .populate('skillsOffered.skillId', 'name slug category')
    .populate('skillsToLearn.skillId', 'name slug category')

  return profile
}

const updateProfile = async (userId, payload) => {
  const allowedUpdates = {
    bio: payload.bio,
    profilePicture: payload.profilePicture,
    languagesSpoken: payload.languagesSpoken,
    timezone: payload.timezone,
  }

  const profile = await Profile.findOneAndUpdate(
    { userId },
    { $set: allowedUpdates },
    { new: true, runValidators: true }
  )
    .populate('skillsOffered.skillId', 'name slug category')
    .populate('skillsToLearn.skillId', 'name slug category')

  if (!profile) {
    throw new Error('Profile not found. Create profile first.')
  }

  return profile
}

module.exports = {
  createProfile,
  getProfileByUserId,
  getOnboardingStatus,
  upsertOnboardingProfile,
  updateProfile,
}
