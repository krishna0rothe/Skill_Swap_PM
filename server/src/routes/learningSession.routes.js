const express = require('express')
const { mySessions, joinInfo, complete, cancel } = require('../controllers/learningSession.controller')
const { protect } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(protect)
router.get('/me', mySessions)
router.get('/:sessionId/join-info', joinInfo)
router.patch('/:sessionId/complete', complete)
router.patch('/:sessionId/cancel', cancel)

module.exports = router
