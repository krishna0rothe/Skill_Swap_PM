const mongoose = require('mongoose')

const levelEnum = ['beginner', 'intermediate', 'advanced']

const offeredSkillSchema = new mongoose.Schema(
  {
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    level: {
      type: String,
      enum: levelEnum,
      required: true,
      default: 'beginner',
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    hourlyRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
)

const learningSkillSchema = new mongoose.Schema(
  {
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
    },
    currentLevel: {
      type: String,
      enum: levelEnum,
      default: 'beginner',
    },
    targetLevel: {
      type: String,
      enum: levelEnum,
      required: true,
      default: 'beginner',
    },
  },
  { _id: false }
)

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String,
      trim: true,
      default: '/profile.png',
    },
    languagesSpoken: [{ type: String, trim: true }],
    timezone: {
      type: String,
      trim: true,
    },
    skillsOffered: [offeredSkillSchema],
    skillsToLearn: [learningSkillSchema],
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalSessions: {
      type: Number,
      default: 0,
      min: 0,
    },
    isOnboardingComplete: {
      type: Boolean,
      default: false,
    },
    onboardingCompletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
)

profileSchema.index({ 'skillsOffered.skillId': 1, 'skillsOffered.level': 1, ratingAverage: -1 })
profileSchema.index({ 'skillsToLearn.skillId': 1 })

const Profile = mongoose.model('Profile', profileSchema)

module.exports = Profile
