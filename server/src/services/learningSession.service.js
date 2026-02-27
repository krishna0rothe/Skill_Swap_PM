const LearningSession = require('../models/LearningSession')
const User = require('../models/User')
const SessionParticipation = require('../models/SessionParticipation')
const PaymentTransaction = require('../models/PaymentTransaction')
const {
  settleLockedCreditsToMentor,
  refundLockedCredits,
  creditRealMoneyToMentor,
} = require('./wallet.service')
const { createVideoSdkRoom, getVideoSdkAuthToken } = require('./videoSdk.service')
const {
  createRazorpayOrder,
  verifyRazorpaySignature,
  getRazorpayPublicKey,
} = require('./razorpay.service')
const { MIN_COMPLETION_RATIO } = require('../config/payment')

const toDate = (value) => {
  const parsed = value ? new Date(value) : new Date()
  if (Number.isNaN(parsed.getTime())) {
    return new Date()
  }
  return parsed
}

const buildRazorpayReceipt = (prefix, id) => {
  const now = Date.now().toString().slice(-8)
  const cleanId = String(id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-20)
  const base = `${prefix}${cleanId}${now}`
  return base.slice(0, 40)
}

const getTotalPresenceSeconds = (participant, nowDate = new Date()) => {
  if (!participant) {
    return 0
  }

  let total = participant.totalPresenceSeconds || 0
  if (participant.isInCall && participant.lastJoinAt) {
    total += Math.max(0, Math.floor((nowDate.getTime() - new Date(participant.lastJoinAt).getTime()) / 1000))
  }

  return total
}

const getCompletionStats = async (session) => {
  const [mentorParticipation, learnerParticipation] = await Promise.all([
    SessionParticipation.findOne({ learningSessionId: session._id, userId: session.mentorUserId }),
    SessionParticipation.findOne({ learningSessionId: session._id, userId: session.learnerUserId }),
  ])

  const requiredRatio = session.completionRatioRequired || MIN_COMPLETION_RATIO
  const requiredSeconds = Math.ceil(session.durationMinutes * 60 * requiredRatio)
  const nowDate = new Date()

  const mentorSeconds = getTotalPresenceSeconds(mentorParticipation, nowDate)
  const learnerSeconds = getTotalPresenceSeconds(learnerParticipation, nowDate)

  return {
    requiredSeconds,
    mentorSeconds,
    learnerSeconds,
    isQualified: mentorSeconds >= requiredSeconds && learnerSeconds >= requiredSeconds,
  }
}

const listMyLearningSessions = async (userId, { role, status }) => {
  const query = {}

  if (role === 'mentor') {
    query.mentorUserId = userId
  } else if (role === 'learner') {
    query.learnerUserId = userId
  } else {
    query.$or = [{ mentorUserId: userId }, { learnerUserId: userId }]
  }

  if (status) {
    query.status = status
  }

  return LearningSession.find(query)
    .populate('mentorUserId', 'username email')
    .populate('learnerUserId', 'username email')
    .populate('skillId', 'name slug category')
    .sort({ scheduledStartAt: -1 })
}

const getSessionJoinInfo = async (sessionId, userId) => {
  const session = await LearningSession.findById(sessionId)

  if (!session) {
    throw new Error('Learning session not found')
  }

  const isMentor = session.mentorUserId.toString() === userId.toString()
  const isLearner = session.learnerUserId.toString() === userId.toString()

  if (!isMentor && !isLearner) {
    throw new Error('You are not allowed to join this session')
  }

  if (!['scheduled', 'rescheduled'].includes(session.status)) {
    throw new Error('This session is not available for joining')
  }

  if (session.paymentMode === 'money' && ['failed', 'refunded'].includes(session.paymentStatus)) {
    throw new Error('Complete payment before joining this session')
  }

  if (!session.videoMeetingId) {
    const roomId = await createVideoSdkRoom()
    session.videoProvider = 'videosdk'
    session.videoMeetingId = roomId
    session.videoJoinUrl = `https://app.videosdk.live/meeting/${roomId}`
    await session.save()
  }

  const user = await User.findById(userId).select('username')

  return {
    meetingId: session.videoMeetingId,
    token: getVideoSdkAuthToken(),
    sessionId: session._id,
    displayName: user?.username || 'SkillSwap User',
    role: isMentor ? 'mentor' : 'learner',
  }
}

const getSessionIfMember = async (sessionId, userId) => {
  const session = await LearningSession.findById(sessionId)

  if (!session) {
    throw new Error('Learning session not found')
  }

  const isMentor = session.mentorUserId.toString() === userId.toString()
  const isLearner = session.learnerUserId.toString() === userId.toString()

  if (!isMentor && !isLearner) {
    throw new Error('You are not allowed to update this session')
  }

  return { session, isMentor, isLearner }
}

const trackSessionLifecycleEvent = async (sessionId, userId, eventName, eventAt) => {
  const { session, isMentor, isLearner } = await getSessionIfMember(sessionId, userId)
  const normalizedEventName = String(eventName || '').trim().toLowerCase()

  if (!['start', 'join', 'leave', 'end'].includes(normalizedEventName)) {
    throw new Error('Invalid lifecycle event')
  }

  if (!['scheduled', 'rescheduled'].includes(session.status)) {
    throw new Error('Lifecycle updates are allowed only for active sessions')
  }

  const role = isMentor ? 'mentor' : isLearner ? 'learner' : null
  const eventDate = toDate(eventAt)

  const participant = await SessionParticipation.findOneAndUpdate(
    { learningSessionId: session._id, userId },
    {
      $setOnInsert: {
        learningSessionId: session._id,
        userId,
        role,
        totalPresenceSeconds: 0,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  )

  if (normalizedEventName === 'join') {
    if (!participant.isInCall) {
      participant.isInCall = true
      participant.lastJoinAt = eventDate
      if (!participant.firstJoinedAt) {
        participant.firstJoinedAt = eventDate
      }
    }

    if (!session.actualStartedAt) {
      session.actualStartedAt = eventDate
    }
  } else if (normalizedEventName === 'leave' || normalizedEventName === 'end') {
    if (participant.isInCall && participant.lastJoinAt) {
      const elapsedSeconds = Math.max(
        0,
        Math.floor((eventDate.getTime() - new Date(participant.lastJoinAt).getTime()) / 1000)
      )
      participant.totalPresenceSeconds += elapsedSeconds
    }

    participant.isInCall = false
    participant.lastLeftAt = eventDate
    participant.lastJoinAt = undefined
    session.actualEndedAt = eventDate
  } else if (normalizedEventName === 'start') {
    if (!session.actualStartedAt) {
      session.actualStartedAt = eventDate
    }
  }

  await participant.save()
  await session.save()

  return {
    success: true,
    eventName: normalizedEventName,
  }
}

const completeLearningSession = async (sessionId, userId, payload = {}) => {
  const { session, isMentor, isLearner } = await getSessionIfMember(sessionId, userId)

  if (!isMentor) {
    throw new Error('Only mentor can mark the session as completed')
  }

  if (!['scheduled', 'rescheduled'].includes(session.status)) {
    throw new Error('Only scheduled sessions can be completed')
  }

  if (session.paymentMode === 'money' && ['failed', 'refunded'].includes(session.paymentStatus)) {
    throw new Error('Money payment is not in a valid state for completion')
  }

  const completionStats = await getCompletionStats(session)

  session.completionEvaluatedAt = new Date()
  session.actualEndedAt = new Date()

  if (!completionStats.isQualified) {
    session.isDurationQualified = false
    session.status = 'no_show'

    if (session.paymentMode === 'credits' && session.paymentStatus === 'authorized') {
      await refundLockedCredits({
        learnerUserId: session.learnerUserId,
        amount: session.creditAmount,
      })
      session.paymentStatus = 'refunded'
    }

    if (session.paymentMode === 'money' && ['authorized', 'pending', 'captured'].includes(session.paymentStatus)) {
      session.paymentStatus = 'refunded'

      if (session.paymentReferenceId) {
        await PaymentTransaction.findByIdAndUpdate(session.paymentReferenceId, {
          status: 'refunded',
          notes: 'Auto-refunded because session duration qualification was not met',
        })
      }
    }

    await session.save()
    return {
      session,
      message: 'Session marked incomplete and payment has been refunded',
    }
  }

  session.isDurationQualified = true

  if (session.paymentMode === 'credits' && ['authorized', 'pending'].includes(session.paymentStatus)) {
    await settleLockedCreditsToMentor({
      learnerUserId: session.learnerUserId,
      mentorUserId: session.mentorUserId,
      amount: session.creditAmount,
    })

    session.paymentStatus = 'captured'
  }

  if (session.paymentMode === 'money' && ['authorized', 'pending', 'captured'].includes(session.paymentStatus)) {
    await creditRealMoneyToMentor({
      mentorUserId: session.mentorUserId,
      amount: session.moneyAmount,
    })

    session.paymentStatus = 'paid'

    if (session.paymentReferenceId) {
      await PaymentTransaction.findByIdAndUpdate(session.paymentReferenceId, {
        status: 'captured',
        notes: 'Captured on successful completion (session marked paid)',
      })
    }
  }

  session.status = 'completed'

  if (isMentor && payload.learnerRating !== undefined) {
    session.learnerRating = Number(payload.learnerRating)
  }
  if (isLearner && payload.mentorRating !== undefined) {
    session.mentorRating = Number(payload.mentorRating)
  }
  if (payload.mentorReview !== undefined) {
    session.mentorReview = payload.mentorReview
  }
  if (payload.learnerReview !== undefined) {
    session.learnerReview = payload.learnerReview
  }

  await session.save()

  return {
    session,
    message: 'Session completed successfully',
  }
}

const cancelLearningSession = async (sessionId, userId, payload = {}) => {
  const { session } = await getSessionIfMember(sessionId, userId)

  if (session.status === 'completed') {
    throw new Error('Completed session cannot be cancelled')
  }

  if (session.paymentMode === 'credits' && session.paymentStatus === 'authorized') {
    await refundLockedCredits({
      learnerUserId: session.learnerUserId,
      amount: session.creditAmount,
    })

    session.paymentStatus = 'refunded'
  }

  if (session.paymentMode === 'money' && ['authorized', 'pending'].includes(session.paymentStatus)) {
    session.paymentStatus = 'refunded'

    if (session.paymentReferenceId) {
      await PaymentTransaction.findByIdAndUpdate(session.paymentReferenceId, {
        status: 'refunded',
        notes: payload.reason || 'Session cancelled',
      })
    }
  }

  session.status = 'cancelled'
  if (payload.reason) {
    session.mentorReview = payload.reason
  }

  await session.save()

  return session
}

const createSessionRazorpayOrder = async (sessionId, userId) => {
  const { session, isLearner } = await getSessionIfMember(sessionId, userId)

  if (!isLearner) {
    throw new Error('Only learner can initiate payment')
  }

  if (!['scheduled', 'rescheduled'].includes(session.status)) {
    throw new Error('Payment allowed only for active sessions')
  }

  if (session.paymentMode !== 'money') {
    throw new Error('This session does not require money payment')
  }

  if (session.paymentStatus === 'authorized' || session.paymentStatus === 'captured' || session.paymentStatus === 'paid') {
    throw new Error('Payment is already authorized for this session')
  }

  const amountInPaise = Math.round(Number(session.moneyAmount) * 100)

  if (!amountInPaise || amountInPaise < 100) {
    throw new Error('Invalid money amount configured for session')
  }

  let transaction = null
  if (session.paymentReferenceId) {
    transaction = await PaymentTransaction.findById(session.paymentReferenceId)
  }

  if (!transaction) {
    transaction = await PaymentTransaction.create({
      learningSessionId: session._id,
      learnerUserId: session.learnerUserId,
      mentorUserId: session.mentorUserId,
      mode: 'money',
      provider: 'razorpay',
      amount: session.moneyAmount,
      currency: session.currency || 'INR',
      status: 'pending',
      notes: 'Awaiting Razorpay payment authorization',
    })

    session.paymentReferenceId = String(transaction._id)
    await session.save()
  }

  const order = await createRazorpayOrder({
    amount: amountInPaise,
    currency: session.currency || 'INR',
    receipt: buildRazorpayReceipt('ses', session._id),
    notes: {
      sessionId: String(session._id),
      transactionId: String(transaction._id),
    },
  })

  transaction.providerOrderId = order.id
  transaction.status = 'pending'
  await transaction.save()

  return {
    keyId: getRazorpayPublicKey(),
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    name: 'SkillSwap',
    description: session.title,
    prefill: {},
    notes: {
      sessionId: String(session._id),
      transactionId: String(transaction._id),
    },
  }
}

const verifySessionRazorpayPayment = async (sessionId, userId, payload = {}) => {
  const { session, isLearner } = await getSessionIfMember(sessionId, userId)

  if (!isLearner) {
    throw new Error('Only learner can verify payment')
  }

  if (session.paymentMode !== 'money') {
    throw new Error('This session does not require money payment')
  }

  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = payload

  if (!orderId || !paymentId || !signature) {
    throw new Error('Missing Razorpay verification fields')
  }

  let transaction = null
  if (session.paymentReferenceId) {
    transaction = await PaymentTransaction.findById(session.paymentReferenceId)
  }

  if (!transaction) {
    throw new Error('Payment transaction not found for this session')
  }

  if (transaction.providerOrderId && transaction.providerOrderId !== orderId) {
    throw new Error('Razorpay order mismatch')
  }

  const isValid = verifyRazorpaySignature({
    orderId,
    paymentId,
    signature,
  })

  if (!isValid) {
    transaction.status = 'failed'
    transaction.notes = 'Signature verification failed'
    await transaction.save()
    throw new Error('Invalid Razorpay signature')
  }

  transaction.providerOrderId = orderId
  transaction.providerPaymentId = paymentId
  transaction.providerSignature = signature
  transaction.status = 'authorized'
  transaction.notes = 'Payment authorized successfully'
  await transaction.save()

  session.paymentStatus = 'authorized'
  session.paymentGateway = 'razorpay'
  session.paymentReferenceId = String(transaction._id)
  await session.save()

  return {
    success: true,
    session,
  }
}

module.exports = {
  listMyLearningSessions,
  getSessionJoinInfo,
  createSessionRazorpayOrder,
  verifySessionRazorpayPayment,
  trackSessionLifecycleEvent,
  completeLearningSession,
  cancelLearningSession,
}
