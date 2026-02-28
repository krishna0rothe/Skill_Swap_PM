const DEFAULT_MAIN_API_BASE_URL = 'http://localhost:5001/api'
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
const { fetchWithRetry } = require('./httpClient.service')

const normalizeBaseUrl = () => {
  const configured = process.env.MAIN_API_BASE_URL || DEFAULT_MAIN_API_BASE_URL
  return configured.endsWith('/') ? configured.slice(0, -1) : configured
}

const toTokenSet = (value) => {
  if (typeof value !== 'string') return new Set()

  const tokens = value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)

  return new Set(tokens)
}

const stripCodeFences = (text = '') => {
  return text.replace(/```json/gi, '```').replace(/```/g, '').trim()
}

const extractFirstJsonObject = (text = '') => {
  const sanitized = stripCodeFences(text)
  const start = sanitized.indexOf('{')
  const end = sanitized.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('AI response does not contain valid JSON object')
  }

  return sanitized.slice(start, end + 1)
}

const overlapScore = (aSet, bSet) => {
  if (!aSet.size || !bSet.size) return 0
  let overlap = 0

  for (const token of aSet) {
    if (bSet.has(token)) overlap += 1
  }

  return overlap / Math.max(1, Math.min(aSet.size, bSet.size))
}

const mapOffer = (offer, score) => ({
  offerId: String(offer._id || ''),
  skillId: String(offer?.skillId?._id || offer?.skillId || ''),
  skillName: typeof offer?.skillId?.name === 'string' ? offer.skillId.name : '',
  title: typeof offer?.title === 'string' ? offer.title : '',
  mentorUserId: String(offer?.mentorUserId?._id || offer?.mentorUserId || ''),
  mentorName:
    typeof offer?.mentorUserId?.username === 'string'
      ? offer.mentorUserId.username
      : typeof offer?.mentorUserId?.email === 'string'
        ? offer.mentorUserId.email
        : '',
  durationMinutes: Number.isFinite(Number(offer?.durationMinutes)) ? Number(offer.durationMinutes) : undefined,
  acceptsCredits: Boolean(offer?.acceptsCredits),
  creditPrice: Number.isFinite(Number(offer?.creditPrice)) ? Number(offer.creditPrice) : undefined,
  acceptsMoney: Boolean(offer?.acceptsMoney),
  moneyPrice: Number.isFinite(Number(offer?.moneyPrice)) ? Number(offer.moneyPrice) : undefined,
  currency: typeof offer?.currency === 'string' ? offer.currency : '',
  averageRating: Number.isFinite(Number(offer?.averageRating)) ? Number(offer.averageRating) : 0,
  ratingsCount: Number.isFinite(Number(offer?.ratingsCount)) ? Number(offer.ratingsCount) : 0,
  aiReason: typeof offer?.aiReason === 'string' ? offer.aiReason : '',
  matchScore: Number(score.toFixed(4)),
})

const fetchJson = async (url, authorization) => {
  const headers = { 'Content-Type': 'application/json' }
  if (authorization) {
    headers.authorization = authorization
  }

  const response = await fetchWithRetry(
    url,
    { method: 'GET', headers },
    {
      retries: 2,
      timeoutMs: 10000,
      retryDelayMs: 400,
    },
  )
  if (!response.ok) {
    throw new Error(`Main API request failed ${response.status} for ${url}`)
  }

  return response.json()
}

const postJson = async (url, body, authorization) => {
  const headers = { 'Content-Type': 'application/json' }
  if (authorization) {
    headers.authorization = authorization
  }

  const response = await fetchWithRetry(
    url,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body || {}),
    },
    {
      retries: 2,
      timeoutMs: 10000,
      retryDelayMs: 400,
    },
  )

  if (!response.ok) {
    throw new Error(`Main API request failed ${response.status} for ${url}`)
  }

  return response.json()
}

const fetchPlatformSkills = async (authorization) => {
  if (!authorization) return []

  const baseUrl = normalizeBaseUrl()
  const skillsResponse = await fetchJson(`${baseUrl}/skills`, authorization)
  const skills = Array.isArray(skillsResponse?.skills) ? skillsResponse.skills : []

  return skills
    .filter((skill) => skill && skill._id && typeof skill.name === 'string')
    .map((skill) => ({
      _id: String(skill._id),
      name: skill.name.trim(),
      category: typeof skill.category === 'string' ? skill.category : '',
    }))
}

const fetchLearnerLevel = async (authorization) => {
  if (!authorization) return 'beginner'

  const baseUrl = normalizeBaseUrl()

  try {
    const profileResponse = await fetchJson(`${baseUrl}/profiles/me`, authorization)
    const profile = profileResponse?.profile
    const firstLearningSkill = Array.isArray(profile?.skillsToLearn) ? profile.skillsToLearn[0] : null
    const level = typeof firstLearningSkill?.currentLevel === 'string' ? firstLearningSkill.currentLevel : ''

    if (['beginner', 'intermediate', 'advanced'].includes(level)) {
      return level
    }
  } catch (_error) {
    return 'beginner'
  }

  return 'beginner'
}

const scoreSkillForQuery = (skill, queryTokenSet) => {
  const skillTokens = toTokenSet(skill?.name || '')
  return overlapScore(queryTokenSet, skillTokens)
}

const resolveSkillIdsForNode = (node, platformSkills = []) => {
  const normalizedSkills = Array.isArray(platformSkills) ? platformSkills : []
  if (normalizedSkills.length === 0) {
    return []
  }

  const byName = new Map(normalizedSkills.map((skill) => [String(skill.name || '').toLowerCase(), String(skill._id)]))
  const directSkillIds = (Array.isArray(node.skills) ? node.skills : [])
    .filter((skill) => typeof skill === 'string')
    .map((skill) => byName.get(skill.trim().toLowerCase()))
    .filter(Boolean)

  if (directSkillIds.length > 0) {
    return [...new Set(directSkillIds)].slice(0, 4)
  }

  const fallbackQuery = `${node.title || ''} ${node.description || ''}`.trim()
  if (!fallbackQuery) {
    return []
  }

  const queryTokenSet = toTokenSet(fallbackQuery)
  return normalizedSkills
    .map((skill) => ({ skillId: String(skill._id), score: scoreSkillForQuery(skill, queryTokenSet) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((item) => item.skillId)
}

const scoreOfferForNode = (offer, nodeTokenSet, queryTokenSet) => {
  const offerTitleTokens = toTokenSet(offer.title || '')
  const skillNameTokens = toTokenSet(offer?.skillId?.name || '')
  const mentorTokens = toTokenSet(offer?.mentorUserId?.username || '')

  const textScore =
    overlapScore(nodeTokenSet, offerTitleTokens) * 0.45 +
    overlapScore(queryTokenSet, skillNameTokens) * 0.45 +
    overlapScore(nodeTokenSet, mentorTokens) * 0.1

  const ratingScore = Math.min(1, Number(offer?.averageRating || 0) / 5) * 0.2
  return textScore + ratingScore
}

const fetchOffersBySkillIds = async (skillIds = [], authorization) => {
  if (!Array.isArray(skillIds) || skillIds.length === 0) {
    return []
  }

  const baseUrl = normalizeBaseUrl()
  const response = await postJson(`${baseUrl}/session-offers/by-skills`, { skillIds }, authorization)
  return Array.isArray(response?.offers) ? response.offers : []
}

const callGeminiApi = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  }

  const response = await fetchWithRetry(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, {
    retries: 2,
    timeoutMs: 12000,
    retryDelayMs: 500,
  })

  if (!response.ok) {
    throw new Error(`Gemini API error ${response.status}`)
  }

  const payload = await response.json()
  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text)
      .filter(Boolean)
      .join('\n') || ''

  if (!text) {
    throw new Error('Gemini returned empty content')
  }

  return text
}

const aiRankOffersForNode = async ({ node, offers, learnerLevel, learningGoal }) => {
  if (!Array.isArray(offers) || offers.length === 0) {
    return new Map()
  }

  const compactOffers = offers.slice(0, 12).map((offer) => ({
    offerId: String(offer?._id || ''),
    title: String(offer?.title || ''),
    description: String(offer?.description || ''),
    skillName: String(offer?.skillId?.name || ''),
    averageRating: Number(offer?.averageRating || 0),
    ratingsCount: Number(offer?.ratingsCount || 0),
  }))

  const prompt = [
    'You are a session matching engine.',
    'Rank the best sessions for this roadmap node.',
    'Use node description relevance, learner level fit, and offer quality signals (averageRating and ratingsCount).',
    'Return ONLY JSON with shape: {"rankings":[{"offerId":"string","score":0.0,"reason":"string"}]}',
    `Learner level: ${learnerLevel || 'beginner'}`,
    `Overall goal: ${learningGoal || ''}`,
    `Node title: ${node?.title || ''}`,
    `Node description: ${node?.description || ''}`,
    `Candidate offers: ${JSON.stringify(compactOffers)}`,
  ].join('\n')

  const aiText = await callGeminiApi(prompt)
  const aiJson = JSON.parse(extractFirstJsonObject(aiText))
  const rankings = Array.isArray(aiJson?.rankings) ? aiJson.rankings : []
  const scoreMap = new Map()

  rankings.forEach((entry) => {
    const offerId = String(entry?.offerId || '')
    if (!offerId) return

    const parsedScore = Number(entry?.score)
    const score = Number.isFinite(parsedScore) ? Math.max(0, Math.min(1, parsedScore)) : 0
    scoreMap.set(offerId, {
      score,
      reason: typeof entry?.reason === 'string' ? entry.reason.trim() : '',
    })
  })

  return scoreMap
}

const enrichNodeWithOffers = async (node, authorization, context = {}) => {
  const { platformSkills = [], learnerLevel = 'beginner', learningGoal = '' } = context
  const skillIds = resolveSkillIdsForNode(node, platformSkills)
  const nodeText = `${node.title || ''} ${node.description || ''} ${(node.skills || []).join(' ')}`.trim()
  const nodeTokenSet = toTokenSet(nodeText)
  const skillNameText = (Array.isArray(node.skills) ? node.skills : []).join(' ')
  const queryTokenSet = toTokenSet(skillNameText || nodeText)

  const offers = await fetchOffersBySkillIds(skillIds, authorization)
  const baseCandidates = offers
    .map((offer) => {
      const heuristicScore = scoreOfferForNode(offer, nodeTokenSet, queryTokenSet)
      return {
        offer,
        heuristicScore,
      }
    })
    .filter((item) => item.heuristicScore > 0)
    .sort((a, b) => b.heuristicScore - a.heuristicScore)
    .slice(0, 12)

  let aiScoreMap = new Map()

  try {
    aiScoreMap = await aiRankOffersForNode({
      node,
      offers: baseCandidates.map((item) => item.offer),
      learnerLevel,
      learningGoal,
    })
  } catch (_error) {
    aiScoreMap = new Map()
  }

  const recommendedOffers = baseCandidates
    .map(({ offer, heuristicScore }) => {
      const offerId = String(offer?._id || '')
      const ai = aiScoreMap.get(offerId)
      const aiScore = Number(ai?.score || 0)
      const ratingNorm = Math.max(0, Math.min(1, Number(offer?.averageRating || 0) / 5))
      const finalScore = heuristicScore * 0.5 + aiScore * 0.35 + ratingNorm * 0.15

      return mapOffer(
        {
          ...offer,
          aiReason: ai?.reason || '',
        },
        finalScore,
      )
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3)

  const children = Array.isArray(node.children)
    ? await Promise.all(
        node.children.map((child) =>
          enrichNodeWithOffers(child, authorization, {
            platformSkills,
            learnerLevel,
            learningGoal,
          }),
        ),
      )
    : []

  return {
    ...node,
    recommendedOffers,
    children,
  }
}

const enrichRoadmapNodesWithOffers = async (nodes = [], authorization, context = {}) => {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return []
  }

  if (!authorization) {
    return nodes.map((node) => ({
      ...node,
      recommendedOffers: [],
      children: Array.isArray(node.children)
        ? node.children.map((child) => ({ ...child, recommendedOffers: child.recommendedOffers || [] }))
        : [],
    }))
  }

  let resolvedPlatformSkills = Array.isArray(context.platformSkills) ? context.platformSkills : []

  if (resolvedPlatformSkills.length === 0) {
    try {
      resolvedPlatformSkills = await fetchPlatformSkills(authorization)
    } catch (_error) {
      resolvedPlatformSkills = []
    }
  }

  const learnerLevel = context.learnerLevel || (await fetchLearnerLevel(authorization))
  const learningGoal = typeof context.learningGoal === 'string' ? context.learningGoal : ''

  return Promise.all(
    nodes.map((node) =>
      enrichNodeWithOffers(node, authorization, {
        platformSkills: resolvedPlatformSkills,
        learnerLevel,
        learningGoal,
      }),
    ),
  )
}

module.exports = {
  enrichRoadmapNodesWithOffers,
  fetchPlatformSkills,
  fetchLearnerLevel,
}
