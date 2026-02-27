const { listMyLearningSessions, getSessionJoinInfo } = require('../services/learningSession.service')

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

module.exports = {
  mySessions,
  joinInfo,
}
