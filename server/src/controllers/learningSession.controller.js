const {
  listMyLearningSessions,
  getSessionJoinInfo,
  createSessionRazorpayOrder,
  verifySessionRazorpayPayment,
  trackSessionLifecycleEvent,
  completeLearningSession,
  cancelLearningSession,
} = require('../services/learningSession.service')

const mySessions = async (req, res) => {
  try {
    const { role, status } = req.query
    const sessions = await listMyLearningSessions(req.user.userId, { role, status })
    return res.status(200).json({ sessions })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const joinInfo = async (req, res) => {
  try {
    const joinData = await getSessionJoinInfo(req.params.sessionId, req.user.userId)
    return res.status(200).json(joinData)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const createRazorpayOrder = async (req, res) => {
  try {
    const result = await createSessionRazorpayOrder(req.params.sessionId, req.user.userId)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const verifyRazorpayPayment = async (req, res) => {
  try {
    const result = await verifySessionRazorpayPayment(req.params.sessionId, req.user.userId, req.body)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const complete = async (req, res) => {
  try {
    const result = await completeLearningSession(req.params.sessionId, req.user.userId, req.body)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const lifecycleEvent = async (req, res) => {
  try {
    const { sessionId, eventName } = req.params
    const result = await trackSessionLifecycleEvent(sessionId, req.user.userId, eventName, req.body?.eventAt)
    return res.status(200).json(result)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const cancel = async (req, res) => {
  try {
    const session = await cancelLearningSession(req.params.sessionId, req.user.userId, req.body)
    return res.status(200).json({ session })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

module.exports = {
  mySessions,
  joinInfo,
  createRazorpayOrder,
  verifyRazorpayPayment,
  lifecycleEvent,
  complete,
  cancel,
}
