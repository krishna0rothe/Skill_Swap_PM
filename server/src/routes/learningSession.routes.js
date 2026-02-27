const express = require('express')
const {
	mySessions,
	sessionHistory,
	joinInfo,
	createRazorpayOrder,
	verifyRazorpayPayment,
	lifecycleEvent,
	complete,
	cancel,
	review,
} = require('../controllers/learningSession.controller')
const { protect } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(protect)
router.get('/me', mySessions)
router.get('/history', sessionHistory)
router.get('/:sessionId/join-info', joinInfo)
router.post('/:sessionId/razorpay-order', createRazorpayOrder)
router.post('/:sessionId/razorpay-verify', verifyRazorpayPayment)
router.post('/:sessionId/lifecycle/:eventName', lifecycleEvent)
router.patch('/:sessionId/complete', complete)
router.patch('/:sessionId/cancel', cancel)
router.patch('/:sessionId/review', review)

module.exports = router
