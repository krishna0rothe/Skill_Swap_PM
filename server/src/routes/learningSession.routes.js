const express = require('express')
const { mySessions, joinInfo } = require('../controllers/learningSession.controller')
const { protect } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(protect)
router.get('/me', mySessions)
router.get('/:sessionId/join-info', joinInfo)

module.exports = router
