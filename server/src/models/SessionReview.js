const mongoose = require('mongoose')

const sessionReviewSchema = new mongoose.Schema(
  {
    learningSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningSession',
      required: true,
      index: true,
    },
    sessionOfferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SessionOffer',
      required: true,
      index: true,
    },
    reviewerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    revieweeUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviewerRole: {
      type: String,
      enum: ['mentor', 'learner'],
      required: true,
    },
    revieweeRole: {
      type: String,
      enum: ['mentor', 'learner'],
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      trim: true,
      maxlength: 800,
      default: '',
    },
  },
  { timestamps: true }
)

sessionReviewSchema.index({ learningSessionId: 1, reviewerUserId: 1 }, { unique: true })

const SessionReview = mongoose.model('SessionReview', sessionReviewSchema)

module.exports = SessionReview
