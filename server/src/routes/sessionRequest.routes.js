const express = require('express')
const {
  createRazorpayOrder,
  create,
  incoming,
  outgoing,
  accept,
  reject,
  askReschedule,
} = require('../controllers/sessionRequest.controller')
const { protect } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(protect)

router.post('/razorpay-order', createRazorpayOrder)
router.post('/', create)
router.get('/incoming', incoming)
router.get('/outgoing', outgoing)
router.patch('/:requestId/accept', accept)
router.patch('/:requestId/reject', reject)
router.patch('/:requestId/reschedule', askReschedule)

module.exports = router
