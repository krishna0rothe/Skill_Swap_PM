const LearningSession = require('../models/LearningSession')
const User = require('../models/User')
const {
  settleLockedCreditsToMentor,
  refundLockedCredits,
} = require('./wallet.service')
const { createVideoSdkRoom, getVideoSdkAuthToken } = require('./videoSdk.service')

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

const completeLearningSession = async (sessionId, userId, payload = {}) => {
  const { session, isMentor, isLearner } = await getSessionIfMember(sessionId, userId)

  if (!isMentor) {
    throw new Error('Only mentor can mark the session as completed')
  }

  if (!['scheduled', 'rescheduled'].includes(session.status)) {
    throw new Error('Only scheduled sessions can be completed')
  }

  if (session.paymentMode === 'credits' && ['authorized', 'pending'].includes(session.paymentStatus)) {
    await settleLockedCreditsToMentor({
      learnerUserId: session.learnerUserId,
      mentorUserId: session.mentorUserId,
      amount: session.creditAmount,
    })

    session.paymentStatus = 'captured'
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

  return session
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

  session.status = 'cancelled'
  if (payload.reason) {
    session.mentorReview = payload.reason
  }

  await session.save()

  return session
}

module.exports = {
  listMyLearningSessions,
  getSessionJoinInfo,
  completeLearningSession,
  cancelLearningSession,
}
