const express = require('express')
const { protect } = require('../middleware/auth.middleware')
const { createRateLimiter } = require('../middleware/rateLimit.middleware')
const {
  listRoadmaps,
  generateRoadmap,
  getRoadmapById,
  updateRoadmapNodeStatus,
  matchRoadmapOffers,
  chatRoadmapAssistant,
} = require('../controllers/roadmap.controller')

const router = express.Router()
const generalLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 120, keyPrefix: 'roadmaps-general' })
const aiLimiter = createRateLimiter({ windowMs: 60 * 1000, maxRequests: 20, keyPrefix: 'roadmaps-ai' })

router.use(protect)
router.use(generalLimiter)

router.get('/', listRoadmaps)
router.post('/generate', aiLimiter, generateRoadmap)
router.post('/chat', aiLimiter, chatRoadmapAssistant)
router.post('/:roadmapId/match-offers', matchRoadmapOffers)
router.get('/:roadmapId', getRoadmapById)
router.patch('/:roadmapId/nodes/:nodeId/status', updateRoadmapNodeStatus)

module.exports = router
