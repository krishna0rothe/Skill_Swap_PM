const mongoose = require('mongoose')
const SessionOffer = require('../models/SessionOffer')
const SessionRequest = require('../models/SessionRequest')
const LearningSession = require('../models/LearningSession')
const PaymentTransaction = require('../models/PaymentTransaction')
const { lockCredits } = require('./wallet.service')
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
  getRazorpayPublicKey,
} = require('./razorpay.service')
const { FIXED_CREDIT_PRICE, MIN_COMPLETION_RATIO } = require('../config/payment')

const assertValidObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${fieldName}`)
  }
}

const buildEndDate = (startAt, durationMinutes) => {
  return new Date(new Date(startAt).getTime() + durationMinutes * 60 * 1000)
}

const buildRazorpayReceipt = (prefix, id) => {
  const now = Date.now().toString().slice(-8)
  const cleanId = String(id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-20)
  const base = `${prefix}${cleanId}${now}`
  return base.slice(0, 40)
}

const getRequestableOfferForLearner = async (learnerUserId, sessionOfferId) => {
  assertValidObjectId(sessionOfferId, 'sessionOfferId')

  const offer = await SessionOffer.findById(sessionOfferId)

  if (!offer || !offer.isActive) {
    throw new Error('Session offer is not available')
  }

  if (offer.mentorUserId.toString() === learnerUserId.toString()) {
    throw new Error('Mentor cannot request their own offer')
  }

  return offer
}

const createMoneyRequestRazorpayOrder = async (learnerUserId, { sessionOfferId }) => {
  const offer = await getRequestableOfferForLearner(learnerUserId, sessionOfferId)

  if (!offer.acceptsMoney) {
    throw new Error('This offer does not accept money')
  }

  const amountInPaise = Math.round(Number(offer.moneyPrice) * 100)

  if (!amountInPaise || amountInPaise < 100) {
    throw new Error('Invalid money amount configured for this offer')
  }

  let order
  const receipt = buildRazorpayReceipt('off', offer._id)

  try {
    order = await createRazorpayOrder({
      amount: amountInPaise,
      currency: offer.currency || 'INR',
      receipt,
      notes: {
        sessionOfferId: String(offer._id),
        mentorUserId: String(offer.mentorUserId),
        learnerUserId: String(learnerUserId),
      },
    })
  } catch (error) {
    const message =
      error?.error?.description ||
      error?.message ||
      'Unable to create Razorpay order'

    throw new Error(message)
  }

  return {
    keyId: getRazorpayPublicKey(),
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    name: 'SkillSwap',
    description: offer.title,
    notes: {
      sessionOfferId: String(offer._id),
    },
  }
}

const createSessionRequest = async (learnerUserId, payload) => {
  const { sessionOfferId, proposedStartAt, message, paymentMode: requestedPaymentMode } = payload

  const offer = await getRequestableOfferForLearner(learnerUserId, sessionOfferId)

  if (!proposedStartAt) {
    throw new Error('proposedStartAt is required')
  }

  let paymentMode = requestedPaymentMode

  if (!paymentMode) {
    if (offer.acceptsCredits && !offer.acceptsMoney) {
      paymentMode = 'credits'
    } else if (!offer.acceptsCredits && offer.acceptsMoney) {
      paymentMode = 'money'
    } else {
      throw new Error('paymentMode is required for this offer')
    }
  }

  if (!['credits', 'money'].includes(paymentMode)) {
    throw new Error('Invalid paymentMode')
  }

  if (paymentMode === 'credits' && !offer.acceptsCredits) {
    throw new Error('This offer does not accept credits')
  }

  if (paymentMode === 'money' && !offer.acceptsMoney) {
    throw new Error('This offer does not accept money')
  }

  let moneyPaymentData = {}

  if (paymentMode === 'money') {
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = payload

    if (!orderId || !paymentId || !signature) {
      throw new Error('Money payment confirmation is required before requesting session')
    }

    const isValid = verifyRazorpaySignature({ orderId, paymentId, signature })

    if (!isValid) {
      throw new Error('Invalid Razorpay signature')
    }

    moneyPaymentData = {
      moneyPaymentStatus: 'authorized',
      moneyPaymentOrderId: orderId,
      moneyPaymentId: paymentId,
      moneyPaymentSignature: signature,
    }
  }

  const request = await SessionRequest.create({
    sessionOfferId,
    mentorUserId: offer.mentorUserId,
    learnerUserId,
    proposedStartAt,
    message,
    paymentMode,
    ...moneyPaymentData,
    status: 'pending',
  })

  return SessionRequest.findById(request._id)
    .populate('sessionOfferId', 'title durationMinutes skillId acceptsCredits acceptsMoney creditPrice moneyPrice currency')
    .populate('mentorUserId', 'username email')
    .populate('learnerUserId', 'username email')
}

const listIncomingRequests = async (mentorUserId) => {
  return SessionRequest.find({ mentorUserId })
    .populate('sessionOfferId', 'title durationMinutes skillId acceptsCredits acceptsMoney creditPrice moneyPrice currency')
    .populate('learnerUserId', 'username email')
    .sort({ createdAt: -1 })
}

const listOutgoingRequests = async (learnerUserId) => {
  return SessionRequest.find({ learnerUserId })
    .populate('sessionOfferId', 'title durationMinutes skillId acceptsCredits acceptsMoney creditPrice moneyPrice currency')
    .populate('mentorUserId', 'username email')
    .sort({ createdAt: -1 })
}

const getRequestForMentor = async (mentorUserId, requestId) => {
  assertValidObjectId(requestId, 'requestId')

  const request = await SessionRequest.findOne({ _id: requestId, mentorUserId }).populate('sessionOfferId')

  if (!request) {
    throw new Error('Session request not found')
  }

  return request
}

const acceptSessionRequest = async (mentorUserId, requestId, payload) => {
  const request = await getRequestForMentor(mentorUserId, requestId)

  if (request.status !== 'pending' && request.status !== 'reschedule_requested') {
    throw new Error('Only pending/reschedule requests can be accepted')
  }

  const offer = request.sessionOfferId
  const scheduledStartAt = payload.scheduledStartAt || request.proposedStartAt
  const scheduledEndAt = buildEndDate(scheduledStartAt, offer.durationMinutes)
  const paymentMode = request.paymentMode

  if (paymentMode === 'credits' && !offer.acceptsCredits) {
    throw new Error('This offer does not accept credits')
  }

  if (paymentMode === 'money' && !offer.acceptsMoney) {
    throw new Error('This offer does not accept money')
  }

  if (paymentMode === 'money' && request.moneyPaymentStatus !== 'authorized') {
    throw new Error('Money payment is not authorized for this request')
  }

  if (paymentMode === 'credits') {
    await lockCredits(request.learnerUserId, FIXED_CREDIT_PRICE)
  }

  request.status = 'accepted'
  request.mentorResponseMessage = payload.message || request.mentorResponseMessage
  request.respondedAt = new Date()
  await request.save()

  const session = await LearningSession.create({
    sessionOfferId: offer._id,
    sessionRequestId: request._id,
    mentorUserId: offer.mentorUserId,
    learnerUserId: request.learnerUserId,
    skillId: offer.skillId,
    title: offer.title,
    scheduledStartAt,
    scheduledEndAt,
    durationMinutes: offer.durationMinutes,
    status: 'scheduled',
    paymentMode,
    creditAmount: paymentMode === 'credits' ? FIXED_CREDIT_PRICE : 0,
    moneyAmount: paymentMode === 'money' ? offer.moneyPrice : 0,
    currency: offer.currency,
    paymentStatus: paymentMode === 'credits' ? 'authorized' : 'pending',
    paymentGateway: paymentMode === 'money' ? 'razorpay' : 'internal',
    videoProvider: 'none',
    completionRatioRequired: MIN_COMPLETION_RATIO,
  })

  if (paymentMode === 'money') {
    const transaction = await PaymentTransaction.create({
      learningSessionId: session._id,
      learnerUserId: request.learnerUserId,
      mentorUserId: offer.mentorUserId,
      mode: 'money',
      provider: 'razorpay',
      amount: offer.moneyPrice,
      currency: offer.currency,
      status: 'pending',
      providerOrderId: request.moneyPaymentOrderId,
      providerPaymentId: request.moneyPaymentId,
      providerSignature: request.moneyPaymentSignature,
      notes: 'Payment received; pending session completion settlement',
    })

    session.paymentReferenceId = String(transaction._id)
    await session.save()
  }

  return {
    request,
    session,
  }
}

const rejectSessionRequest = async (mentorUserId, requestId, payload) => {
  const request = await getRequestForMentor(mentorUserId, requestId)

  if (request.status !== 'pending' && request.status !== 'reschedule_requested') {
    throw new Error('Only pending/reschedule requests can be rejected')
  }

  request.status = 'rejected'
  request.mentorResponseMessage = payload.message || ''
  request.respondedAt = new Date()
  await request.save()

  return request
}

const rescheduleSessionRequest = async (mentorUserId, requestId, payload) => {
  const request = await getRequestForMentor(mentorUserId, requestId)

  if (request.status !== 'pending') {
    throw new Error('Only pending requests can be rescheduled')
  }

  if (!payload.proposedRescheduleAt) {
    throw new Error('proposedRescheduleAt is required')
  }

  request.status = 'reschedule_requested'
  request.proposedRescheduleAt = payload.proposedRescheduleAt
  request.mentorResponseMessage = payload.message || ''
  request.respondedAt = new Date()
  await request.save()

  return request
}

module.exports = {
  createMoneyRequestRazorpayOrder,
  createSessionRequest,
  listIncomingRequests,
  listOutgoingRequests,
  acceptSessionRequest,
  rejectSessionRequest,
  rescheduleSessionRequest,
}
