require('dotenv').config()

const mongoose = require('mongoose')
const Skill = require('../models/Skill')
const connectDB = require('../config/db')
const slugify = require('../utils/slugify')
const {
  academicSkills,
  technicalSkills,
  extracurricularSkills,
} = require('../constants/seedSkillCatalog')

const toSkillDocs = (skills, category) =>
  skills.map((name) => ({
    name,
    slug: slugify(name),
    category,
    description: `${name} learning and mentorship`,
    isActive: true,
  }))

const seedSkills = async () => {
  await connectDB()

  const docs = [
    ...toSkillDocs(academicSkills, 'academic'),
    ...toSkillDocs(technicalSkills, 'technical'),
    ...toSkillDocs(extracurricularSkills, 'extracurricular'),
  ]

  const operations = docs.map((skill) => ({
    updateOne: {
      filter: { name: skill.name },
      update: {
        $set: {
          slug: skill.slug,
          category: skill.category,
          description: skill.description,
          isActive: skill.isActive,
        },
        $setOnInsert: {
          name: skill.name,
        },
      },
      upsert: true,
    },
  }))

  const result = await Skill.bulkWrite(operations)
  const total = await Skill.countDocuments()

  console.log('Skills seed complete')
  console.log(`Inserted: ${result.upsertedCount}`)
  console.log(`Updated: ${result.modifiedCount}`)
  console.log(`Total skills in DB: ${total}`)
}

if (require.main === module) {
  seedSkills()
    .catch((error) => {
      console.error('Seed error:', error.message)
      process.exit(1)
    })
    .finally(async () => {
      await mongoose.connection.close()
    })
}

module.exports = {
  academicSkills,
  technicalSkills,
  extracurricularSkills,
  seedSkills,
}
