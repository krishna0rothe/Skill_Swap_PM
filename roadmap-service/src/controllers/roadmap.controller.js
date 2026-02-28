const mongoose = require('mongoose')
const { Roadmap, STEP_STATUS } = require('../models/Roadmap')
const { generateRoadmapFromNaturalLanguage, generateRoadmapChatReply } = require('../services/roadmapGeneration.service')
const {
  enrichRoadmapNodesWithOffers,
  fetchPlatformSkills,
  fetchLearnerLevel,
} = require('../services/offerMatching.service')

const toSafeString = (value, fallback = '') => {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  return trimmed || fallback
}

const normalizeKnownSkills = (knownSkills) => {
  if (!Array.isArray(knownSkills)) return []
  return knownSkills
    .filter((skill) => typeof skill === 'string')
    .map((skill) => skill.trim())
    .filter(Boolean)
}

const normalizeResources = (resources) => {
  if (!Array.isArray(resources)) return []

  return resources
    .filter((resource) => resource && typeof resource === 'object')
    .map((resource) => ({
      title: toSafeString(resource.title),
      url: toSafeString(resource.url),
      type: toSafeString(resource.type),
    }))
}

const normalizeNodeTree = (nodes = []) => {
  if (!Array.isArray(nodes)) return []

  return nodes
    .filter((node) => node && typeof node === 'object')
    .map((node, index) => {
      const title = toSafeString(node.title)
      if (!title) {
        return null
      }

      const status = STEP_STATUS.includes(node.status) ? node.status : 'pending'
      const estimatedHours = Number(node.estimatedHours)
      const parsedSkills = Array.isArray(node.skills)
        ? node.skills
            .filter((skill) => typeof skill === 'string')
            .map((skill) => skill.trim())
            .filter(Boolean)
        : []

      return {
        title,
        description: toSafeString(node.description),
        status,
        order: Number.isFinite(Number(node.order)) ? Number(node.order) : index,
        estimatedHours: Number.isFinite(estimatedHours) && estimatedHours >= 0 ? estimatedHours : undefined,
        skills: parsedSkills,
        resources: normalizeResources(node.resources),
        children: normalizeNodeTree(node.children),
      }
    })
    .filter(Boolean)
}

const findNodeById = (nodes = [], nodeId) => {
  for (const node of nodes) {
    if (String(node._id) === nodeId) {
      return node
    }

    const nestedResult = findNodeById(node.children || [], nodeId)
    if (nestedResult) {
      return nestedResult
    }
  }

  return null
}

const assertUserId = (req) => {
  const userId = req.user?.userId

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return null
  }

  return userId
}

const findOwnedRoadmap = async (roadmapId, userId) => {
  return Roadmap.findOne({ _id: roadmapId, userId })
}

const listRoadmaps = async (req, res) => {
  try {
    const userId = assertUserId(req)
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized user context' })
    }

    const roadmaps = await Roadmap.find({ userId })
      .sort({ updatedAt: -1 })
      .select('_id title goal currentStage progress source updatedAt createdAt')
      .lean()

    return res.status(200).json({ roadmaps })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to list roadmaps' })
  }
}

const generateRoadmap = async (req, res) => {
  try {
    const userId = assertUserId(req)
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized user context' })
    }

    const { goal, currentStage, knownSkills = [], nodes = [], title, input, prompt, message, query, text } = req.body || {}
    const authorization = req.headers.authorization
    const platformSkills = await fetchPlatformSkills(authorization)
    const learnerLevel = await fetchLearnerLevel(authorization)

    const naturalLanguageInput = toSafeString(input || prompt || message || query || text)

    if (naturalLanguageInput) {
      const generated = await generateRoadmapFromNaturalLanguage(naturalLanguageInput, { platformSkills })
      const matchedNodes = await enrichRoadmapNodesWithOffers(normalizeNodeTree(generated.nodes), authorization, {
        platformSkills,
        learnerLevel,
        learningGoal: generated.goal || naturalLanguageInput,
      })

      const roadmap = await Roadmap.create({
        userId,
        title: toSafeString(generated.title, generated.goal || naturalLanguageInput),
        goal: toSafeString(generated.goal, naturalLanguageInput),
        currentStage: toSafeString(generated.currentStage),
        knownSkills: normalizeKnownSkills(generated.knownSkills),
        nodes: matchedNodes,
        source: generated.source === 'gemini' ? 'gemini' : 'manual',
      })

      return res.status(201).json({
        message: 'Roadmap generated from natural language input',
        roadmap,
      })
    }

    const normalizedGoal = toSafeString(goal)
    if (!normalizedGoal) {
      return res.status(400).json({
        message:
          'Provide either natural language input in one of: input, prompt, message, query, text OR structured goal payload',
      })
    }

    const matchedNodes = await enrichRoadmapNodesWithOffers(normalizeNodeTree(nodes), authorization, {
      platformSkills,
      learnerLevel,
      learningGoal: normalizedGoal,
    })

    const roadmap = await Roadmap.create({
      userId,
      title: toSafeString(title, normalizedGoal),
      goal: normalizedGoal,
      currentStage: toSafeString(currentStage),
      knownSkills: normalizeKnownSkills(knownSkills),
      nodes: matchedNodes,
      source: 'manual',
    })

    return res.status(201).json({
      message: 'Roadmap created',
      roadmap,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create roadmap' })
  }
}

const getRoadmapById = async (req, res) => {
  try {
    const userId = assertUserId(req)
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized user context' })
    }

    const { roadmapId } = req.params
    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ message: 'Invalid roadmap id' })
    }

    const roadmap = await findOwnedRoadmap(roadmapId, userId)
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' })
    }

    return res.status(200).json({ roadmap })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch roadmap' })
  }
}

const updateRoadmapNodeStatus = async (req, res) => {
  try {
    const userId = assertUserId(req)
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized user context' })
    }

    const { roadmapId, nodeId } = req.params
    const nextStatus = req.body?.status

    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ message: 'Invalid roadmap id' })
    }

    if (!mongoose.Types.ObjectId.isValid(nodeId)) {
      return res.status(400).json({ message: 'Invalid node id' })
    }

    if (!STEP_STATUS.includes(nextStatus)) {
      return res.status(400).json({ message: `status must be one of: ${STEP_STATUS.join(', ')}` })
    }

    const roadmap = await findOwnedRoadmap(roadmapId, userId)
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' })
    }

    const node = findNodeById(roadmap.nodes, nodeId)
    if (!node) {
      return res.status(404).json({ message: 'Node not found in roadmap' })
    }

    node.status = nextStatus
    await roadmap.save()

    return res.status(200).json({
      message: 'Node status updated',
      roadmap,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update node status' })
  }
}

const matchRoadmapOffers = async (req, res) => {
  try {
    const userId = assertUserId(req)
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized user context' })
    }

    const { roadmapId } = req.params
    const authorization = req.headers.authorization
    const platformSkills = await fetchPlatformSkills(authorization)
    const learnerLevel = await fetchLearnerLevel(authorization)

    if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
      return res.status(400).json({ message: 'Invalid roadmap id' })
    }

    const roadmap = await findOwnedRoadmap(roadmapId, userId)
    if (!roadmap) {
      return res.status(404).json({ message: 'Roadmap not found' })
    }

    roadmap.nodes = await enrichRoadmapNodesWithOffers(roadmap.nodes, authorization, {
      platformSkills,
      learnerLevel,
      learningGoal: roadmap.goal,
    })
    await roadmap.save()

    return res.status(200).json({
      message: 'Roadmap offers matched successfully',
      roadmap,
    })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to match roadmap offers' })
  }
}

const chatRoadmapAssistant = async (req, res) => {
  try {
    const userId = assertUserId(req)
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized user context' })
    }

    const message = toSafeString(req.body?.message)
    if (!message) {
      return res.status(400).json({ message: 'message is required' })
    }

    const recentRoadmaps = await Roadmap.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(3)
      .select('title goal')
      .lean()

    const result = await generateRoadmapChatReply({
      message,
      roadmapContext: recentRoadmaps,
    })

    return res.status(200).json({
      reply: result.reply,
      suggestedPrompt: result.suggestedPrompt || '',
    })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to get chatbot response' })
  }
}

module.exports = {
  listRoadmaps,
  generateRoadmap,
  getRoadmapById,
  updateRoadmapNodeStatus,
  matchRoadmapOffers,
  chatRoadmapAssistant,
}
