const mongoose = require('mongoose')

const STEP_STATUS = ['pending', 'in_progress', 'completed', 'blocked']

const roadmapResourceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    url: { type: String, trim: true },
    type: { type: String, trim: true },
  },
  { _id: false },
)

const roadmapOfferMatchSchema = new mongoose.Schema(
  {
    offerId: { type: String, trim: true, required: true },
    skillId: { type: String, trim: true, default: '' },
    skillName: { type: String, trim: true, default: '' },
    title: { type: String, trim: true, default: '' },
    mentorUserId: { type: String, trim: true, default: '' },
    mentorName: { type: String, trim: true, default: '' },
    durationMinutes: { type: Number, min: 0 },
    acceptsCredits: { type: Boolean, default: false },
    creditPrice: { type: Number, min: 0 },
    acceptsMoney: { type: Boolean, default: false },
    moneyPrice: { type: Number, min: 0 },
    currency: { type: String, trim: true, default: '' },
    averageRating: { type: Number, min: 0, default: 0 },
    ratingsCount: { type: Number, min: 0, default: 0 },
    matchScore: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
)

const roadmapNodeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: STEP_STATUS,
      default: 'pending',
    },
    order: { type: Number, default: 0 },
    estimatedHours: { type: Number, min: 0 },
    skills: [{ type: String, trim: true }],
    resources: [roadmapResourceSchema],
    recommendedOffers: [roadmapOfferMatchSchema],
  },
  {
    _id: true,
    id: false,
  },
)

roadmapNodeSchema.add({
  children: [roadmapNodeSchema],
})

const roadmapSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: { type: String, required: true, trim: true },
    goal: { type: String, required: true, trim: true },
    currentStage: { type: String, trim: true, default: '' },
    knownSkills: [{ type: String, trim: true }],
    nodes: [roadmapNodeSchema],
    progress: {
      totalNodes: { type: Number, default: 0 },
      completedNodes: { type: Number, default: 0 },
      percent: { type: Number, default: 0 },
    },
    source: {
      type: String,
      enum: ['manual', 'gemini'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
  },
)

const countNodeStats = (nodes = []) => {
  return nodes.reduce(
    (acc, node) => {
      const childStats = countNodeStats(node.children || [])
      acc.total += 1 + childStats.total
      acc.completed += (node.status === 'completed' ? 1 : 0) + childStats.completed
      return acc
    },
    { total: 0, completed: 0 },
  )
}

roadmapSchema.pre('save', function setProgress(next) {
  const stats = countNodeStats(this.nodes || [])
  this.progress.totalNodes = stats.total
  this.progress.completedNodes = stats.completed
  this.progress.percent = stats.total === 0 ? 0 : Math.round((stats.completed / stats.total) * 100)
  next()
})

const Roadmap = mongoose.model('Roadmap', roadmapSchema)

module.exports = {
  Roadmap,
  STEP_STATUS,
}
