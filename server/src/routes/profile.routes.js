const express = require('express')
const {
  create,
  me,
  onboardingStatus,
  submitOnboarding,
  updateMe,
} = require('../controllers/profile.controller')
const { protect } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(protect)

router.post('/', create)
router.get('/me', me)
router.get('/onboarding-status', onboardingStatus)
router.put('/onboarding', submitOnboarding)
router.patch('/me', updateMe)

module.exports = router
