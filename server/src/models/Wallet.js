const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    creditBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockedCreditBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    realMoneyBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockedMoneyBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      trim: true,
      default: 'INR',
      uppercase: true,
    },
  },
  { timestamps: true }
)

const Wallet = mongoose.model('Wallet', walletSchema)

module.exports = Wallet
