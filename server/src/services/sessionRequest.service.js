const mongoose = require('mongoose')
const SessionOffer = require('../models/SessionOffer')
const SessionRequest = require('../models/SessionRequest')
const LearningSession = require('../models/LearningSession')
const { lockCredits } = require('./wallet.service')

const assertValidObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${fieldName}`)
  }
}

const buildEndDate = (startAt, durationMinutes) => {
  return new Date(new Date(startAt).getTime() + durationMinutes * 60 * 1000)
}

const createSessionRequest = async (learnerUserId, payload) => {
  const { sessionOfferId, proposedStartAt, message } = payload

  assertValidObjectId(sessionOfferId, 'sessionOfferId')

  const offer = await SessionOffer.findById(sessionOfferId)

  if (!offer || !offer.isActive) {
    throw new Error('Session offer is not available')
  }

  if (offer.mentorUserId.toString() === learnerUserId.toString()) {
    throw new Error('Mentor cannot request their own offer')
  }

  if (!proposedStartAt) {
    throw new Error('proposedStartAt is required')
  }

  const request = await SessionRequest.create({
    sessionOfferId,
    mentorUserId: offer.mentorUserId,
    learnerUserId,
    proposedStartAt,
    message,
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
  const paymentMode = payload.paymentMode || (offer.acceptsCredits ? 'credits' : 'money')

  if (paymentMode === 'credits' && !offer.acceptsCredits) {
    throw new Error('This offer does not accept credits')
  }

  if (paymentMode === 'money' && !offer.acceptsMoney) {
    throw new Error('This offer does not accept money')
  }

  if (paymentMode === 'credits') {
    await lockCredits(request.learnerUserId, offer.creditPrice)
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
    creditAmount: paymentMode === 'credits' ? offer.creditPrice : 0,
    moneyAmount: paymentMode === 'money' ? offer.moneyPrice : 0,
    currency: offer.currency,
    paymentStatus: paymentMode === 'credits' ? 'authorized' : 'pending',
    paymentGateway: paymentMode === 'money' ? 'razorpay' : 'internal',
    videoProvider: 'none',
  })

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
  createSessionRequest,
  listIncomingRequests,
  listOutgoingRequests,
  acceptSessionRequest,
  rejectSessionRequest,
  rescheduleSessionRequest,
}
