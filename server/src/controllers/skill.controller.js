const {
  createSkill,
  listSkills,
  getSkillById,
  getSkillsByCategory,
} = require('../services/skill.service')

const create = async (req, res) => {
  try {
    const skill = await createSkill(req.body)
    return res.status(201).json({ skill })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const list = async (req, res) => {
  try {
    const { category, search } = req.query
    const skills = await listSkills({ category, search })
    return res.status(200).json({ skills })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const getById = async (req, res) => {
  try {
    const skill = await getSkillById(req.params.id)
    return res.status(200).json({ skill })
  } catch (error) {
    return res.status(404).json({ message: error.message })
  }
}

const getByCategory = async (req, res) => {
  try {
    const skills = await getSkillsByCategory(req.params.category)
    return res.status(200).json({ skills })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

module.exports = {
  create,
  list,
  getById,
  getByCategory,
}
