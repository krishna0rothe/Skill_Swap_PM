const express = require('express')
const {
  create,
  list,
  mine,
  getById,
  updateMine,
  deactivateMine,
} = require('../controllers/sessionOffer.controller')
const { protect } = require('../middleware/auth.middleware')

const router = express.Router()

router.use(protect)
router.get('/', list)
router.get('/mine', mine)
router.get('/:offerId', getById)
router.post('/', create)
router.patch('/:offerId', updateMine)
router.patch('/:offerId/deactivate', deactivateMine)

module.exports = router
