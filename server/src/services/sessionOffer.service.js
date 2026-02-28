const mongoose = require('mongoose')
const SessionOffer = require('../models/SessionOffer')
const { validateSkillExists } = require('./skill.service')
const { FIXED_CREDIT_PRICE } = require('../config/payment')

const assertValidObjectId = (value, fieldName) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${fieldName}`)
  }
}

const createSessionOffer = async (mentorUserId, payload) => {
  const {
    skillId,
    title,
    description,
    durationMinutes,
    acceptsCredits,
    creditPrice,
    acceptsMoney,
    moneyPrice,
    currency,
    availabilityNote,
  } = payload

  assertValidObjectId(skillId, 'skillId')

  const skillExists = await validateSkillExists(skillId)
  if (!skillExists) {
    throw new Error('Skill does not exist or is inactive')
  }

  if (acceptsCredits === false && acceptsMoney === false) {
    throw new Error('Offer must accept at least one payment method')
  }

  return SessionOffer.create({
    mentorUserId,
    skillId,
    title,
    description,
    durationMinutes,
    acceptsCredits,
    creditPrice: acceptsCredits ? FIXED_CREDIT_PRICE : 0,
    acceptsMoney,
    moneyPrice,
    currency,
    availabilityNote,
  })
}

const listSessionOffers = async ({ skillId, mentorUserId, excludeMentorUserId, search, includeInactive }) => {
  const query = {}

  if (!includeInactive) {
    query.isActive = true
  }

  if (skillId) {
    assertValidObjectId(skillId, 'skillId')
    query.skillId = skillId
  }

  if (mentorUserId) {
    assertValidObjectId(mentorUserId, 'mentorUserId')
    query.mentorUserId = mentorUserId
  }

  if (excludeMentorUserId) {
    assertValidObjectId(excludeMentorUserId, 'excludeMentorUserId')
    query.mentorUserId = { $ne: excludeMentorUserId }
  }

  if (search) {
    query.title = { $regex: search, $options: 'i' }
  }

  return SessionOffer.find(query)
    .populate('mentorUserId', 'username email')
    .populate('skillId', 'name slug category')
    .sort({ createdAt: 1 })
}

const listSessionOffersBySkills = async ({ skillIds = [], excludeMentorUserId, includeInactive = false }) => {
  if (!Array.isArray(skillIds) || skillIds.length === 0) {
    throw new Error('skillIds is required and must be a non-empty array')
  }

  const uniqueSkillIds = [...new Set(skillIds.map((id) => String(id).trim()).filter(Boolean))]

  uniqueSkillIds.forEach((skillId) => assertValidObjectId(skillId, 'skillId'))

  const query = {
    skillId: { $in: uniqueSkillIds },
  }

  if (!includeInactive) {
    query.isActive = true
  }

  if (excludeMentorUserId) {
    assertValidObjectId(excludeMentorUserId, 'excludeMentorUserId')
    query.mentorUserId = { $ne: excludeMentorUserId }
  }

  return SessionOffer.find(query)
    .populate('mentorUserId', 'username email')
    .populate('skillId', 'name slug category')
    .sort({ averageRating: -1, ratingsCount: -1, createdAt: -1 })
}

const getSessionOfferById = async (offerId) => {
  assertValidObjectId(offerId, 'offerId')

  const offer = await SessionOffer.findById(offerId)
    .populate('mentorUserId', 'username email')
    .populate('skillId', 'name slug category')

  if (!offer) {
    throw new Error('Session offer not found')
  }

  return offer
}

const updateMySessionOffer = async (mentorUserId, offerId, payload) => {
  assertValidObjectId(offerId, 'offerId')

  const offer = await SessionOffer.findOne({ _id: offerId, mentorUserId })

  if (!offer) {
    throw new Error('Session offer not found')
  }

  const allowedFields = [
    'title',
    'description',
    'durationMinutes',
    'acceptsCredits',
    'creditPrice',
    'acceptsMoney',
    'moneyPrice',
    'currency',
    'availabilityNote',
    'isActive',
  ]

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      offer[field] = payload[field]
    }
  })

  if (!offer.acceptsCredits && !offer.acceptsMoney) {
    throw new Error('Offer must accept at least one payment method')
  }

  offer.creditPrice = offer.acceptsCredits ? FIXED_CREDIT_PRICE : 0

  await offer.save()

  return getSessionOfferById(offerId)
}

const deactivateMySessionOffer = async (mentorUserId, offerId) => {
  return updateMySessionOffer(mentorUserId, offerId, { isActive: false })
}

module.exports = {
  createSessionOffer,
  listSessionOffers,
  listSessionOffersBySkills,
  getSessionOfferById,
  updateMySessionOffer,
  deactivateMySessionOffer,
}
