const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

const connectDB = require('../config/db')
const mongoose = require('mongoose')
const SessionOffer = require('../models/SessionOffer')
const SessionRequest = require('../models/SessionRequest')
const LearningSession = require('../models/LearningSession')

const { FIXED_CREDIT_PRICE, MIN_COMPLETION_RATIO } = require('../config/payment')

const migrateSessionOffers = async () => {
  const creditsEnabledResult = await SessionOffer.updateMany(
    { acceptsCredits: true, creditPrice: { $ne: FIXED_CREDIT_PRICE } },
    { $set: { creditPrice: FIXED_CREDIT_PRICE } }
  )

  const creditsDisabledResult = await SessionOffer.updateMany(
    { acceptsCredits: false, creditPrice: { $ne: 0 } },
    { $set: { creditPrice: 0 } }
  )

  return {
    creditsEnabledModified: creditsEnabledResult.modifiedCount || 0,
    creditsDisabledModified: creditsDisabledResult.modifiedCount || 0,
  }
}

const migrateLearningSessions = async () => {
  const moneyCapturedToPaidResult = await LearningSession.updateMany(
    { paymentMode: 'money', paymentStatus: 'captured' },
    { $set: { paymentStatus: 'paid' } }
  )

  const completionRatioResult = await LearningSession.updateMany(
    { completionRatioRequired: { $exists: false } },
    { $set: { completionRatioRequired: MIN_COMPLETION_RATIO } }
  )

  return {
    moneyCapturedToPaidModified: moneyCapturedToPaidResult.modifiedCount || 0,
    completionRatioBackfilled: completionRatioResult.modifiedCount || 0,
  }
}

const migrateSessionRequests = async () => {
  const missingPaymentModeRequests = await SessionRequest.find({
    $or: [{ paymentMode: { $exists: false } }, { paymentMode: null }, { paymentMode: '' }],
  }).populate('sessionOfferId', 'acceptsCredits acceptsMoney')

  let updatedCount = 0

  for (const request of missingPaymentModeRequests) {
    const offer = request.sessionOfferId

    let mode = 'credits'
    if (offer?.acceptsCredits && !offer?.acceptsMoney) {
      mode = 'credits'
    } else if (!offer?.acceptsCredits && offer?.acceptsMoney) {
      mode = 'money'
    } else if (offer?.acceptsCredits && offer?.acceptsMoney) {
      mode = 'credits'
    }

    request.paymentMode = mode

    if (mode === 'money' && !request.moneyPaymentStatus) {
      request.moneyPaymentStatus = 'pending'
    }

    await request.save()
    updatedCount += 1
  }

  return {
    sessionRequestsPaymentModeBackfilled: updatedCount,
  }
}

const run = async () => {
  try {
    await connectDB()

    const [offerStats, sessionStats, requestStats] = await Promise.all([
      migrateSessionOffers(),
      migrateLearningSessions(),
      migrateSessionRequests(),
    ])

    console.log('Migration completed successfully')
    console.log({
      ...offerStats,
      ...sessionStats,
      ...requestStats,
    })
  } catch (error) {
    console.error('Migration failed:', error.message)
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
}

run()
