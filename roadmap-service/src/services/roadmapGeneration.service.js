const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
const { fetchWithRetry } = require('./httpClient.service')

const stripCodeFences = (text = '') => {
  return text.replace(/```json/gi, '```').replace(/```/g, '').trim()
}

const extractFirstJsonObject = (text = '') => {
  const sanitized = stripCodeFences(text)
  const start = sanitized.indexOf('{')
  const end = sanitized.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Gemini response does not contain valid JSON object')
  }

  return sanitized.slice(start, end + 1)
}

const normalizeAiNode = (node, index = 0) => {
  if (!node || typeof node !== 'object' || typeof node.title !== 'string' || !node.title.trim()) {
    return null
  }

  return {
    title: node.title.trim(),
    description: typeof node.description === 'string' ? node.description.trim() : '',
    order: Number.isFinite(Number(node.order)) ? Number(node.order) : index,
    estimatedHours:
      Number.isFinite(Number(node.estimatedHours)) && Number(node.estimatedHours) >= 0
        ? Number(node.estimatedHours)
        : undefined,
    skills: Array.isArray(node.skills)
      ? node.skills.filter((skill) => typeof skill === 'string').map((skill) => skill.trim()).filter(Boolean)
      : [],
    resources: Array.isArray(node.resources)
      ? node.resources
          .filter((resource) => resource && typeof resource === 'object')
          .map((resource) => ({
            title: typeof resource.title === 'string' ? resource.title.trim() : '',
            url: typeof resource.url === 'string' ? resource.url.trim() : '',
            type: typeof resource.type === 'string' ? resource.type.trim() : '',
          }))
      : [],
    children: Array.isArray(node.children)
      ? node.children.map((child, childIndex) => normalizeAiNode(child, childIndex)).filter(Boolean)
      : [],
  }
}

const normalizePlatformSkillNames = (platformSkills = []) => {
  const rawNames = platformSkills
    .map((skill) => {
      if (typeof skill === 'string') return skill
      if (skill && typeof skill.name === 'string') return skill.name
      return ''
    })
    .map((name) => name.trim())
    .filter(Boolean)

  const unique = []
  const seen = new Set()

  for (const name of rawNames) {
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(name)
  }

  return unique
}

const filterToPlatformSkills = (skills = [], platformSkills = []) => {
  const allowed = normalizePlatformSkillNames(platformSkills)
  if (allowed.length === 0) {
    return Array.isArray(skills)
      ? skills.filter((skill) => typeof skill === 'string').map((skill) => skill.trim()).filter(Boolean)
      : []
  }

  const byLowerName = new Map(allowed.map((name) => [name.toLowerCase(), name]))
  const matched = []
  const seen = new Set()

  for (const skill of Array.isArray(skills) ? skills : []) {
    if (typeof skill !== 'string') continue
    const canonical = byLowerName.get(skill.trim().toLowerCase())
    if (!canonical) continue
    const key = canonical.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    matched.push(canonical)
  }

  return matched
}

const keywordSkillMap = [
  {
    pattern: /\bdsa\b|data\s*structures?|algorithms?|problem\s*solving/i,
    skills: ['Data Structures and Algorithms', 'C++ Programming', 'Python Programming'],
  },
  { pattern: /public\s*speaking|speaker|communication|speak/i, skills: ['Public Speaking', 'Debate', 'Storytelling'] },
  { pattern: /mern|full\s*stack|web\s*developer/i, skills: ['React Development', 'Node.js Development', 'MongoDB'] },
  { pattern: /data\s*science|ml|machine\s*learning|ai/i, skills: ['Data Science', 'Machine Learning', 'Python Programming'] },
  { pattern: /android|app\s*development|mobile/i, skills: ['App Development', 'Android Development', 'Java Programming'] },
  { pattern: /interview|placement/i, skills: ['Interview Preparation', 'Resume Building', 'Public Speaking'] },
]

const inferFocusSkills = (goal = '', platformSkills = []) => {
  const matches = keywordSkillMap
    .filter((item) => item.pattern.test(goal))
    .flatMap((item) => item.skills)

  if (matches.length > 0) {
    const constrained = filterToPlatformSkills([...new Set(matches)], platformSkills).slice(0, 3)
    if (constrained.length > 0) {
      return constrained
    }
  }

  return filterToPlatformSkills(
    ['Data Structures and Algorithms', 'Python Programming', 'Interview Preparation'],
    platformSkills,
  )
}

const createDetailedNode = ({ title, description, order, skill }) => ({
  title,
  description,
  order,
  estimatedHours: 6,
  skills: skill ? [skill] : [],
  children: [
    {
      title: `${title} - concept learning`,
      description: `Learn core concepts required for ${title.toLowerCase()}.`,
      order: 0,
      estimatedHours: 2,
      skills: skill ? [skill] : [],
      children: [],
    },
    {
      title: `${title} - guided practice`,
      description: `Practice with structured exercises and feedback for ${title.toLowerCase()}.`,
      order: 1,
      estimatedHours: 2,
      skills: skill ? [skill] : [],
      children: [],
    },
    {
      title: `${title} - mini milestone`,
      description: `Build one measurable outcome to validate ${title.toLowerCase()}.`,
      order: 2,
      estimatedHours: 2,
      skills: skill ? [skill] : [],
      children: [],
    },
  ],
})

const countNodes = (nodes = []) => {
  return nodes.reduce((acc, node) => acc + 1 + countNodes(node.children || []), 0)
}

const hasNestedChildren = (nodes = []) => {
  for (const node of nodes) {
    if (Array.isArray(node.children) && node.children.length > 0) {
      return true
    }

    if (hasNestedChildren(node.children || [])) {
      return true
    }
  }

  return false
}

const ensureDetailedRoadmapNodes = (nodes = [], goal = '', platformSkills = []) => {
  const normalized = Array.isArray(nodes) ? nodes : []
  const nodeCount = countNodes(normalized)
  const nested = hasNestedChildren(normalized)

  if (normalized.length >= 6 && nodeCount >= 12 && nested) {
    return normalized
  }

  const focusSkills = inferFocusSkills(goal, platformSkills)

  return [
    createDetailedNode({
      title: 'Set target outcome and baseline',
      description: `Define your exact ${goal || 'learning'} target, timeline, and current baseline.`,
      order: 0,
      skill: focusSkills[0],
    }),
    createDetailedNode({
      title: 'Build core foundations',
      description: 'Cover prerequisite concepts needed for confident progress.',
      order: 1,
      skill: focusSkills[0],
    }),
    createDetailedNode({
      title: 'Develop practical skills',
      description: 'Translate concepts into repeatable practical execution.',
      order: 2,
      skill: focusSkills[1] || focusSkills[0],
    }),
    createDetailedNode({
      title: 'Apply in realistic scenarios',
      description: 'Simulate real use cases and constraints with structured practice.',
      order: 3,
      skill: focusSkills[1] || focusSkills[0],
    }),
    createDetailedNode({
      title: 'Get feedback and improve',
      description: 'Collect mentor/peer feedback and iterate with measurable improvements.',
      order: 4,
      skill: focusSkills[2] || focusSkills[0],
    }),
    createDetailedNode({
      title: 'Final evaluation and next plan',
      description: 'Evaluate outcomes, close gaps, and define the next growth roadmap.',
      order: 5,
      skill: focusSkills[2] || focusSkills[0],
    }),
  ]
}

const applyPlatformSkillsToNodes = (nodes = [], platformSkills = [], fallbackSkills = []) => {
  const normalizeNode = (node) => {
    const nodeSkills = filterToPlatformSkills(node.skills || [], platformSkills)

    return {
      ...node,
      skills: nodeSkills.length > 0 ? nodeSkills : fallbackSkills,
      children: Array.isArray(node.children) ? node.children.map(normalizeNode) : [],
    }
  }

  return Array.isArray(nodes) ? nodes.map(normalizeNode) : []
}

const buildFallbackRoadmap = (naturalLanguageInput, platformSkills = []) => {
  const cleanInput = naturalLanguageInput.trim()
  const focusSkills = inferFocusSkills(cleanInput, platformSkills)
  return {
    title: cleanInput.slice(0, 80),
    goal: cleanInput,
    currentStage: '',
    knownSkills: focusSkills,
    nodes: ensureDetailedRoadmapNodes([], cleanInput, platformSkills),
    source: 'manual',
  }
}

const callGeminiApi = async (prompt, { expectJson = true } = {}) => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available in this Node runtime')
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: expectJson ? 'application/json' : 'text/plain',
    },
  }

  const response = await fetchWithRetry(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, {
    retries: 2,
    timeoutMs: 15000,
    retryDelayMs: 500,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${text}`)
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

const callGeminiForRoadmap = async (naturalLanguageInput, platformSkills = []) => {
  const allowedPlatformSkills = normalizePlatformSkillNames(platformSkills)
  const roadmapPrompt = [
    'You are an expert learning roadmap planner.',
    'Convert the user natural language request into strict JSON.',
    'Return ONLY JSON with this exact shape:',
    '{',
    '  "title": "string",',
    '  "goal": "string",',
    '  "currentStage": "string",',
    '  "knownSkills": ["string"],',
    '  "nodes": [',
    '    {',
    '      "title": "string",',
    '      "description": "string",',
    '      "order": 0,',
    '      "estimatedHours": 2,',
    '      "skills": ["string"],',
    '      "resources": [{"title":"string","url":"string","type":"string"}],',
    '      "children": []',
    '    }',
    '  ]',
    '}',
    'Important constraints:',
    '- Use ONLY skills from the allowed platform skills list.',
    '- The number of nodes and children is dynamic; do not assume fixed step/substep count.',
    '- Use nested children for substeps at any depth when useful.',
    '- Create at least 6 top-level stages with practical and detailed substeps.',
    '- Keep output concise and practical.',
    '',
    allowedPlatformSkills.length ? `Allowed platform skills:\n${allowedPlatformSkills.map((skill) => `- ${skill}`).join('\n')}` : '',
    '',
    `User request:\n${naturalLanguageInput}`,
  ].filter(Boolean).join('\n')

  const text = await callGeminiApi(roadmapPrompt, { expectJson: true })

  const jsonString = extractFirstJsonObject(text)
  const parsed = JSON.parse(jsonString)

  const normalizedNodes = Array.isArray(parsed.nodes)
    ? parsed.nodes.map((node, index) => normalizeAiNode(node, index)).filter(Boolean)
    : []
  const inferredSkills = inferFocusSkills(naturalLanguageInput, platformSkills)
  const detailedNodes = ensureDetailedRoadmapNodes(normalizedNodes, naturalLanguageInput, platformSkills)
  const knownSkillsRaw = Array.isArray(parsed.knownSkills)
    ? parsed.knownSkills.filter((skill) => typeof skill === 'string').map((skill) => skill.trim()).filter(Boolean)
    : inferredSkills
  const knownSkills = filterToPlatformSkills(knownSkillsRaw, platformSkills)
  const finalKnownSkills = knownSkills.length > 0 ? knownSkills : inferredSkills
  const finalizedNodes = applyPlatformSkillsToNodes(detailedNodes, platformSkills, finalKnownSkills)

  return {
    title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : naturalLanguageInput.trim().slice(0, 80),
    goal: typeof parsed.goal === 'string' && parsed.goal.trim() ? parsed.goal.trim() : naturalLanguageInput.trim(),
    currentStage: typeof parsed.currentStage === 'string' ? parsed.currentStage.trim() : '',
    knownSkills: finalKnownSkills,
    nodes: finalizedNodes,
    source: 'gemini',
  }
}

const generateRoadmapFromNaturalLanguage = async (naturalLanguageInput, { platformSkills = [] } = {}) => {
  try {
    return await callGeminiForRoadmap(naturalLanguageInput, platformSkills)
  } catch (_error) {
    return buildFallbackRoadmap(naturalLanguageInput, platformSkills)
  }
}

const generateRoadmapChatReply = async ({ message, roadmapContext = [] }) => {
  const userMessage = typeof message === 'string' ? message.trim() : ''
  if (!userMessage) {
    return {
      reply: 'Please share your learning goal or question and I can help shape it into a roadmap.',
      suggestedPrompt: '',
    }
  }

  const contextLines = Array.isArray(roadmapContext)
    ? roadmapContext.slice(0, 3).map((item) => `- ${item.title || 'Roadmap'}: ${item.goal || ''}`)
    : []

  const prompt = [
    'You are a learning roadmap assistant for SkillSwap.',
    'Respond in concise plain text with practical next steps.',
    'At the end, provide one single-line suggested roadmap prompt prefixed with "SUGGESTED_PROMPT:".',
    contextLines.length ? `Existing roadmaps:\n${contextLines.join('\n')}` : '',
    `User message:\n${userMessage}`,
  ]
    .filter(Boolean)
    .join('\n\n')

  try {
    const rawReply = await callGeminiApi(prompt, { expectJson: false })
    const lines = rawReply.split('\n')
    const suggestedLine = lines.find((line) => line.trim().startsWith('SUGGESTED_PROMPT:')) || ''
    const suggestedPrompt = suggestedLine.replace('SUGGESTED_PROMPT:', '').trim()
    const reply = lines.filter((line) => !line.trim().startsWith('SUGGESTED_PROMPT:')).join('\n').trim()

    return {
      reply: reply || 'I can help you generate a roadmap. Share your target role, current level, and timeline.',
      suggestedPrompt,
    }
  } catch (_error) {
    return {
      reply:
        'Start with: target role, current level, available weekly hours, and timeline. Then generate a roadmap from that summary.',
      suggestedPrompt: userMessage,
    }
  }
}

module.exports = {
  generateRoadmapFromNaturalLanguage,
  generateRoadmapChatReply,
}
