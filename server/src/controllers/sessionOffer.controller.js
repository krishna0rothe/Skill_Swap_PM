const {
  createSessionOffer,
  listSessionOffers,
  listSessionOffersBySkills,
  getSessionOfferById,
  updateMySessionOffer,
  deactivateMySessionOffer,
} = require('../services/sessionOffer.service')

const create = async (req, res) => {
  try {
    const offer = await createSessionOffer(req.user.userId, req.body)
    return res.status(201).json({ offer })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const list = async (req, res) => {
  try {
    const { skillId, search, includeInactive } = req.query
    const offers = await listSessionOffers({
      skillId,
      excludeMentorUserId: req.user.userId,
      search,
      includeInactive: includeInactive === 'true',
    })
    return res.status(200).json({ offers })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const mine = async (req, res) => {
  try {
    const { includeInactive } = req.query
    const offers = await listSessionOffers({
      mentorUserId: req.user.userId,
      includeInactive: includeInactive !== 'false',
    })

    return res.status(200).json({ offers })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const bySkills = async (req, res) => {
  try {
    const { skillIds = [], includeInactive } = req.body || {}

    const offers = await listSessionOffersBySkills({
      skillIds,
      excludeMentorUserId: req.user.userId,
      includeInactive: includeInactive === true,
    })

    return res.status(200).json({ offers })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const getById = async (req, res) => {
  try {
    const offer = await getSessionOfferById(req.params.offerId)
    return res.status(200).json({ offer })
  } catch (error) {
    return res.status(404).json({ message: error.message })
  }
}

const updateMine = async (req, res) => {
  try {
    const offer = await updateMySessionOffer(req.user.userId, req.params.offerId, req.body)
    return res.status(200).json({ offer })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const deactivateMine = async (req, res) => {
  try {
    const offer = await deactivateMySessionOffer(req.user.userId, req.params.offerId)
    return res.status(200).json({ offer })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

module.exports = {
  create,
  list,
  mine,
  bySkills,
  getById,
  updateMine,
  deactivateMine,
}
