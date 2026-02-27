const mongoose = require('mongoose')

const paymentTransactionSchema = new mongoose.Schema(
  {
    learningSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LearningSession',
      required: true,
      index: true,
    },
    learnerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['credits', 'money'],
      required: true,
    },
    provider: {
      type: String,
      enum: ['internal', 'razorpay'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'refunded', 'failed'],
      default: 'pending',
      index: true,
    },
    providerOrderId: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    providerPaymentId: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    providerSignature: {
      type: String,
      trim: true,
      maxlength: 240,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 800,
      default: '',
    },
  },
  { timestamps: true }
)

paymentTransactionSchema.index({ learningSessionId: 1, createdAt: -1 })

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema)

module.exports = PaymentTransaction
