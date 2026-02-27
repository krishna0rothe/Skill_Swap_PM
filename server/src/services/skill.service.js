const Skill = require('../models/Skill')

const createSkill = async ({ name, category, description, isActive }) => {
  const duplicateByName = await Skill.findOne({ name: { $regex: `^${name}$`, $options: 'i' } })

  if (duplicateByName) {
    throw new Error('Skill already exists')
  }

  const skill = await Skill.create({ name, category, description, isActive })
  return skill
}

const listSkills = async ({ category, search }) => {
  const query = { isActive: true }

  if (category) {
    query.category = category
  }

  if (search) {
    query.name = { $regex: search, $options: 'i' }
  }

  return Skill.find(query).sort({ name: 1 })
}

const getSkillById = async (skillId) => {
  const skill = await Skill.findById(skillId)

  if (!skill) {
    throw new Error('Skill not found')
  }

  return skill
}

const getSkillsByCategory = async (category) => {
  return Skill.find({ category, isActive: true }).sort({ name: 1 })
}

module.exports = {
  createSkill,
  listSkills,
  getSkillById,
  getSkillsByCategory,
}
