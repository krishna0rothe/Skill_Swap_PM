const LearningSession = require('../models/LearningSession')

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

  return {
    sessionId: session._id,
    role: isMentor ? 'mentor' : 'learner',
    joinMode: 'pending-video-provider',
    message: 'Video room provider will be attached in the next step.',
  }
}

module.exports = {
  listMyLearningSessions,
  getSessionJoinInfo,
}
