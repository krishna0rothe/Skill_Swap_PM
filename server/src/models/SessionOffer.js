const mongoose = require('mongoose')

const sessionOfferSchema = new mongoose.Schema(
  {
    mentorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 800,
      default: '',
    },
    durationMinutes: {
      type: Number,
      default: 60,
      min: 15,
      max: 240,
    },
    acceptsCredits: {
      type: Boolean,
      default: true,
    },
    creditPrice: {
      type: Number,
      default: 10,
      min: 0,
    },
    acceptsMoney: {
      type: Boolean,
      default: false,
    },
    moneyPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'INR',
    },
    availabilityNote: {
      type: String,
      trim: true,
      maxlength: 400,
      default: '',
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
)

sessionOfferSchema.index({ mentorUserId: 1, isActive: 1, createdAt: -1 })
sessionOfferSchema.index({ skillId: 1, isActive: 1, createdAt: -1 })

const SessionOffer = mongoose.model('SessionOffer', sessionOfferSchema)

module.exports = SessionOffer
