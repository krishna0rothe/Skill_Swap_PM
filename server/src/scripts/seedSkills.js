require('dotenv').config()

const mongoose = require('mongoose')
const Skill = require('../models/Skill')
const connectDB = require('../config/db')
const slugify = require('../utils/slugify')

const academicSkills = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science Fundamentals',
  'Statistics',
  'Economics',
  'Accounting Basics',
  'Business Studies',
  'History',
  'Geography',
  'Political Science',
  'English Grammar',
  'Essay Writing',
  'Public Exam Preparation',
  'Competitive Exam Aptitude',
  'Reasoning and Logical Thinking',
  'Quantitative Aptitude',
  'Verbal Ability',
  'Language Learning',
  'Spoken English',
  'Hindi Language',
  'French Language',
  'German Language',
  'Spanish Language',
]

const technicalSkills = [
  'Web Development',
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'App Development',
  'Android Development',
  'iOS Development',
  'UI/UX Design',
  'Figma Design',
  'Graphic Design',
  'Data Science',
  'Machine Learning',
  'AI Fundamentals',
  'Prompt Engineering',
  'Python Programming',
  'Java Programming',
  'C++ Programming',
  'JavaScript Programming',
  'TypeScript Programming',
  'React Development',
  'Node.js Development',
  'Express.js Development',
  'MongoDB',
  'SQL Databases',
  'System Design Basics',
  'Data Structures and Algorithms',
  'DevOps Basics',
  'Git and GitHub',
  'Cloud Fundamentals',
  'Cybersecurity Basics',
]

const extracurricularSkills = [
  'Guitar',
  'Piano',
  'Singing',
  'Music Production Basics',
  'Public Speaking',
  'Debate',
  'Storytelling',
  'Chess',
  'Art and Sketching',
  'Digital Illustration',
  'Photography',
  'Photo Editing',
  'Video Editing',
  'Content Creation',
  'Fitness and Workout Basics',
  'Yoga',
  'Meditation and Mindfulness',
  'Dance Basics',
  'Theatre and Acting',
  'Creative Writing',
  'Resume Building',
  'Interview Preparation',
  'Leadership Skills',
  'Teamwork and Collaboration',
  'Time Management',
]

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

seedSkills()
  .catch((error) => {
    console.error('Seed error:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await mongoose.connection.close()
  })
