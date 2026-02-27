const mongoose = require('mongoose')

const learningSessionSchema = new mongoose.Schema(
  {
    sessionOfferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SessionOffer',
      required: true,
      index: true,
    },
    sessionRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SessionRequest',
      index: true,
    },
    mentorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    learnerUserId: {
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
    scheduledStartAt: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledEndAt: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 15,
      max: 240,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'],
      default: 'scheduled',
      index: true,
    },
    paymentMode: {
      type: String,
      enum: ['credits', 'money'],
      required: true,
    },
    creditAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    moneyAmount: {
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
    paymentStatus: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'refunded', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentGateway: {
      type: String,
      enum: ['internal', 'none'],
      default: 'internal',
    },
    videoProvider: {
      type: String,
      enum: ['none'],
      default: 'none',
    },
  },
  { timestamps: true }
)

learningSessionSchema.index({ mentorUserId: 1, status: 1, scheduledStartAt: -1 })
learningSessionSchema.index({ learnerUserId: 1, status: 1, scheduledStartAt: -1 })

const LearningSession = mongoose.model('LearningSession', learningSessionSchema)

module.exports = LearningSession
