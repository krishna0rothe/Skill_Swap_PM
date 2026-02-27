const {
  createMoneyRequestRazorpayOrder,
  createSessionRequest,
  listIncomingRequests,
  listOutgoingRequests,
  acceptSessionRequest,
  rejectSessionRequest,
  rescheduleSessionRequest,
} = require('../services/sessionRequest.service')

const getErrorMessage = (error, fallback) => {
  return (
    error?.message ||
    error?.error?.description ||
    error?.description ||
    error?.reason ||
    fallback
  )
}

const createRazorpayOrder = async (req, res) => {
  try {
    const result = await createMoneyRequestRazorpayOrder(req.user.userId, req.body)
    return res.status(200).json(result)
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to create Razorpay order')
    return res.status(400).json({ message })
  }
}

const create = async (req, res) => {
  try {
    const request = await createSessionRequest(req.user.userId, req.body)
    return res.status(201).json({ request })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const incoming = async (req, res) => {
  try {
    const requests = await listIncomingRequests(req.user.userId)
    return res.status(200).json({ requests })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const outgoing = async (req, res) => {
  try {
    const requests = await listOutgoingRequests(req.user.userId)
    return res.status(200).json({ requests })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const accept = async (req, res) => {
  try {
    const result = await acceptSessionRequest(req.user.userId, req.params.requestId, req.body)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const reject = async (req, res) => {
  try {
    const request = await rejectSessionRequest(req.user.userId, req.params.requestId, req.body)
    return res.status(200).json({ request })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const askReschedule = async (req, res) => {
  try {
    const request = await rescheduleSessionRequest(req.user.userId, req.params.requestId, req.body)
    return res.status(200).json({ request })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

module.exports = {
  createRazorpayOrder,
  create,
  incoming,
  outgoing,
  accept,
  reject,
  askReschedule,
}
