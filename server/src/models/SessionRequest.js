const mongoose = require('mongoose')

const sessionRequestSchema = new mongoose.Schema(
  {
    sessionOfferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SessionOffer',
      required: true,
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
    proposedStartAt: {
      type: Date,
      required: true,
      index: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 600,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'reschedule_requested', 'cancelled'],
      default: 'pending',
      index: true,
    },
    mentorResponseMessage: {
      type: String,
      trim: true,
      maxlength: 600,
      default: '',
    },
    proposedRescheduleAt: {
      type: Date,
    },
    respondedAt: {
      type: Date,
    },
  },
  { timestamps: true }
)

sessionRequestSchema.index({ mentorUserId: 1, status: 1, createdAt: -1 })
sessionRequestSchema.index({ learnerUserId: 1, status: 1, createdAt: -1 })

const SessionRequest = mongoose.model('SessionRequest', sessionRequestSchema)

module.exports = SessionRequest
