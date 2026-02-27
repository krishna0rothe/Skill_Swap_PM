const mongoose = require('mongoose')

const sessionParticipationSchema = new mongoose.Schema(
  {
    learningSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningSession',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['mentor', 'learner'],
      required: true,
    },
    firstJoinedAt: {
      type: Date,
    },
    lastLeftAt: {
      type: Date,
    },
    lastJoinAt: {
      type: Date,
    },
    isInCall: {
      type: Boolean,
      default: false,
    },
    totalPresenceSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
)

sessionParticipationSchema.index({ learningSessionId: 1, userId: 1 }, { unique: true })

const SessionParticipation = mongoose.model('SessionParticipation', sessionParticipationSchema)

module.exports = SessionParticipation
