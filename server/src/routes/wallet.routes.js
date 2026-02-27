const express = require('express')
const { me } = require('../controllers/wallet.controller')
const { protect } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(protect)
router.get('/me', me)

module.exports = router
