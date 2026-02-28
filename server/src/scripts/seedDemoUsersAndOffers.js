require('dotenv').config()

const mongoose = require('mongoose')
const connectDB = require('../config/db')
const User = require('../models/User')
const Profile = require('../models/Profile')
const Skill = require('../models/Skill')
const SessionOffer = require('../models/SessionOffer')
const { ensureWalletForUser } = require('../services/wallet.service')
const {
  academicSkills,
  technicalSkills,
  extracurricularSkills,
} = require('../constants/seedSkillCatalog')

const TOTAL_USERS = 50
const OFFERS_PER_USER = 3

const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Krishna', 'Ishaan', 'Rohan', 'Arjun', 'Ayaan', 'Kabir', 'Neel',
  'Ananya', 'Diya', 'Ira', 'Meera', 'Sara', 'Aditi', 'Riya', 'Naina', 'Kavya', 'Myra',
  'Rahul', 'Siddharth', 'Harsh', 'Pranav', 'Varun', 'Sanjana', 'Sneha', 'Pooja', 'Tanvi', 'Ritika',
]

const lastNames = [
  'Sharma', 'Patel', 'Verma', 'Nair', 'Iyer', 'Gupta', 'Joshi', 'Kulkarni', 'Mishra', 'Singh',
  'Reddy', 'Khan', 'Das', 'Chopra', 'Malhotra', 'Bose', 'Jain', 'Kapoor', 'Mehta', 'Roy',
]

const studentBioTemplates = [
  'Computer Science student focused on practical project-based learning.',
  'Engineering student interested in improving technical and communication skills.',
  'Undergraduate student preparing for internships and real-world collaboration.',
  'B.Tech student exploring full-stack development and peer mentoring.',
  'University student passionate about structured learning and consistent growth.',
]

const professionalBioTemplates = [
  'Junior software engineer mentoring students through practical coding sessions.',
  'Freelance designer helping learners build portfolio-ready projects.',
  'Data analyst sharing hands-on skills for beginner to intermediate learners.',
  'Digital marketing associate guiding students on execution-focused learning.',
]

const professionPool = [
  'Computer Science Student',
  'Electronics Engineering Student',
  'Information Technology Student',
  'Mechanical Engineering Student',
  'Business Analytics Student',
  'Economics Student',
  'Design Student',
  'Junior Software Engineer',
  'Freelance UI Designer',
  'Data Analyst',
  'Digital Marketing Associate',
  'QA Engineer',
]

const specialtyStatements = [
  'I focus on weekly measurable milestones and project checkpoints.',
  'I prefer concept-to-project learning with practical deliverables.',
  'I enjoy peer learning and iterative feedback-based progress.',
  'I break topics into small sprints with reflection after each sprint.',
  'I combine theory revision with hands-on implementation every week.',
  'I prioritize consistency over intensity and follow realistic schedules.',
  'I track progress with task boards and milestone retrospectives.',
  'I apply each concept through mini-projects and portfolio artifacts.',
]

const goalStatements = [
  'My current goal is to become internship-ready within this semester.',
  'I am preparing for campus placements and collaborative projects.',
  'I want to improve confidence for interviews and technical discussions.',
  'I am building a practical portfolio for entry-level opportunities.',
  'I am targeting stronger fundamentals before moving to advanced topics.',
  'I want to master core workflows used in real industry projects.',
]

const mentorshipStyles = [
  'with live demos and progressive exercises',
  'with concept simplification and guided practice',
  'through practical examples and assignment feedback',
  'using structured milestones and review check-ins',
  'through hands-on mini projects and implementation support',
]

const sessionFocusAreas = [
  'fundamentals',
  'interview readiness',
  'project architecture',
  'debugging techniques',
  'problem-solving approach',
  'portfolio improvements',
  'best practices and code quality',
]

const availabilityNotes = [
  'Weekdays after 7 PM IST and weekends.',
  'Available on weekends and early mornings.',
  'Flexible in evenings, prefers scheduled sessions.',
  'Open slots on Tue/Thu/Sat.',
]

const timezones = ['Asia/Kolkata', 'Asia/Kolkata', 'Asia/Kolkata', 'Asia/Kolkata', 'Asia/Kolkata']
const languagesPool = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Bengali']

const toEmail = (fullName) => `${fullName.toLowerCase().replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '')}@gmail.com`

const pickOne = (array, seed) => array[seed % array.length]

const pickMany = (array, count, seed) => {
  if (count >= array.length) return [...array]
  const start = seed % array.length
  const rotated = [...array.slice(start), ...array.slice(0, start)]
  return rotated.slice(0, count)
}

const generateFullName = (index) => {
  const firstName = firstNames[index % firstNames.length]
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length]
  return `${firstName} ${lastName}`
}

const skillCategoryForBio = (skill) => {
  if (!skill) return 'general'
  return skill.category || 'general'
}

const createOfferDescription = ({ fullName, skillName, bioRole }) => {
  return `${bioRole} ${fullName} offers practical guidance in ${skillName} with structured examples, task-based learning, and progress checkpoints.`
}

const assertOrThrow = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
}

const validateProfilePayload = (profilePayload, userEmail) => {
  assertOrThrow(typeof profilePayload.bio === 'string' && profilePayload.bio.trim().length > 20, `Invalid bio for ${userEmail}`)
  assertOrThrow(typeof profilePayload.timezone === 'string' && profilePayload.timezone.trim(), `Invalid timezone for ${userEmail}`)
  assertOrThrow(Array.isArray(profilePayload.skillsOffered) && profilePayload.skillsOffered.length >= 1, `Missing skillsOffered for ${userEmail}`)
  assertOrThrow(Array.isArray(profilePayload.skillsToLearn) && profilePayload.skillsToLearn.length >= 1, `Missing skillsToLearn for ${userEmail}`)
  assertOrThrow(Boolean(profilePayload.isOnboardingComplete), `Onboarding must be completed for ${userEmail}`)
}

const validateOfferPayload = (offerPayload, userEmail) => {
  assertOrThrow(typeof offerPayload.title === 'string' && offerPayload.title.trim().length >= 8, `Invalid offer title for ${userEmail}`)
  assertOrThrow(typeof offerPayload.description === 'string' && offerPayload.description.trim().length >= 30, `Invalid offer description for ${userEmail}`)
  assertOrThrow(Boolean(offerPayload.acceptsCredits), `Offer must accept credits for ${userEmail}`)
  assertOrThrow(Number(offerPayload.creditPrice) === 10, `Credit price must be default 10 for ${userEmail}`)
  assertOrThrow(Boolean(offerPayload.acceptsMoney), `Offer must accept money for ${userEmail}`)
  assertOrThrow(Number(offerPayload.moneyPrice) > 0, `Money price must be > 0 for ${userEmail}`)
  assertOrThrow(offerPayload.currency === 'INR', `Currency must be INR for ${userEmail}`)
}

const seed = async () => {
  await connectDB()

  const canonicalSkillNames = [...academicSkills, ...technicalSkills, ...extracurricularSkills]
  const skills = await Skill.find({ isActive: true, name: { $in: canonicalSkillNames } }).sort({ name: 1 }).lean()
  if (skills.length < 8) {
    throw new Error('Please seed skills first (npm run seed:skills). Demo seeding only uses skills from seedSkills.js')
  }

  const examples = []
  let createdUsers = 0
  let updatedUsers = 0
  let createdProfiles = 0
  let updatedProfiles = 0
  let createdOffers = 0

  for (let index = 0; index < TOTAL_USERS; index += 1) {
    const fullName = generateFullName(index)
    const email = toEmail(fullName)
    const username = `${fullName.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}${index + 1}`
    const mobile = `9${String(100000000 + index).slice(0, 9)}`

    let user = await User.findOne({ email }).select('+password')
    if (!user) {
      user = await User.create({
        username,
        email,
        password: 'Pass@123',
        mobile,
        isVerified: true,
      })
      createdUsers += 1
    } else {
      user.username = username
      user.mobile = mobile
      await user.save()
      updatedUsers += 1
    }

    await ensureWalletForUser(user._id)

    const offeredSkills = pickMany(skills, 3, index * 3)
    const learningPool = skills.filter((skill) => !offeredSkills.some((offered) => String(offered._id) === String(skill._id)))
    const learningSkills = pickMany(learningPool, 3, index * 5)

    const profession = professionPool[Math.floor(index / 3) % professionPool.length]
    const isStudent = profession.toLowerCase().includes('student')
    const bioTemplate = isStudent ? pickOne(studentBioTemplates, index) : pickOne(professionalBioTemplates, index)
    const primarySkill = offeredSkills[0]
    const roleLabel = profession
    const specialty = pickOne(specialtyStatements, index * 2)
    const goalStatement = pickOne(goalStatements, index * 3)
    const bio = `${roleLabel}. ${bioTemplate} Skilled in ${offeredSkills.map((skill) => skill.name).join(', ')}. Currently learning ${learningSkills.map((skill) => skill.name).join(', ')}. ${specialty} ${goalStatement} Profile marker ${index + 1}.`

    const profilePayload = {
      bio,
      timezone: pickOne(timezones, index),
      profilePicture: '/profile.png',
      languagesSpoken: pickMany(languagesPool, 2, index * 7),
      skillsOffered: offeredSkills.map((skill, skillIndex) => ({
        skillId: skill._id,
        level: skillIndex === 0 ? 'intermediate' : 'beginner',
        experienceYears: isStudent ? skillIndex : skillIndex + 1,
        hourlyRate: 0,
        isActive: true,
      })),
      skillsToLearn: learningSkills.map((skill, skillIndex) => ({
        skillId: skill._id,
        currentLevel: 'beginner',
        targetLevel: skillIndex === 0 ? 'advanced' : 'intermediate',
      })),
      isOnboardingComplete: true,
      onboardingCompletedAt: new Date(),
    }

    validateProfilePayload(profilePayload, email)

    const existingProfile = await Profile.findOne({ userId: user._id })
    if (!existingProfile) {
      await Profile.create({ userId: user._id, ...profilePayload })
      createdProfiles += 1
    } else {
      await Profile.updateOne({ userId: user._id }, { $set: profilePayload })
      updatedProfiles += 1
    }

    await SessionOffer.deleteMany({ mentorUserId: user._id })

    const offerDocs = offeredSkills.map((skill, offerIndex) => {
      const basePrice = 199 + ((index + 1) * (offerIndex + 2) * 17) % 600
      const categoryTag = skillCategoryForBio(skill)
      const firstName = fullName.split(' ')[0]
      const focusArea = pickOne(sessionFocusAreas, index + offerIndex)
      const style = pickOne(mentorshipStyles, index * 5 + offerIndex)

      return {
        mentorUserId: user._id,
        skillId: skill._id,
        title: `${skill.name} ${focusArea} session with ${firstName} (${index + 1}-${offerIndex + 1})`,
        description: `${createOfferDescription({
          fullName,
          skillName: skill.name,
          bioRole: `${roleLabel.toLowerCase()} ${categoryTag}`,
        })} This session emphasizes ${focusArea} ${style}. Mentor approach code: U${index + 1}O${offerIndex + 1}.`,
        durationMinutes: 60,
        acceptsCredits: true,
        creditPrice: 10,
        acceptsMoney: true,
        moneyPrice: basePrice,
        currency: 'INR',
        availabilityNote: pickOne(availabilityNotes, index + offerIndex),
        isActive: true,
      }
    })

    offerDocs.forEach((offerPayload) => validateOfferPayload(offerPayload, email))

    const uniqueOfferTitles = new Set(offerDocs.map((offer) => offer.title))
    assertOrThrow(uniqueOfferTitles.size === OFFERS_PER_USER, `Offer titles must be unique per user (${email})`)

    const insertedOffers = await SessionOffer.insertMany(offerDocs)
    createdOffers += insertedOffers.length

    const persistedOfferCount = await SessionOffer.countDocuments({ mentorUserId: user._id, isActive: true })
    assertOrThrow(persistedOfferCount === OFFERS_PER_USER, `Expected ${OFFERS_PER_USER} offers for ${email}, found ${persistedOfferCount}`)

    const persistedProfile = await Profile.findOne({ userId: user._id }).lean()
    assertOrThrow(Boolean(persistedProfile), `Profile not found after upsert for ${email}`)
    assertOrThrow(Boolean(persistedProfile.isOnboardingComplete), `Onboarding flag missing for ${email}`)

    if (examples.length < 4) {
      examples.push({
        name: fullName,
        email,
        bio,
        skillsKnown: offeredSkills.map((skill) => skill.name),
        skillsToLearn: learningSkills.map((skill) => skill.name),
        offers: insertedOffers.map((offer) => ({
          title: offer.title,
          skill: offeredSkills.find((skill) => String(skill._id) === String(offer.skillId))?.name || '',
          creditPrice: offer.creditPrice,
          moneyPrice: offer.moneyPrice,
          description: offer.description,
        })),
      })
    }

    if (primarySkill && primarySkill.name && !bio.includes(primarySkill.name)) {
      console.warn(`Bio validation warning for ${email}: primary skill missing in bio`) // sanity only
    }
  }

  console.log('Seed complete: demo users + profiles + offers')
  console.log(`Users created: ${createdUsers}, updated: ${updatedUsers}`)
  console.log(`Profiles created: ${createdProfiles}, updated: ${updatedProfiles}`)
  console.log(`Offers created: ${createdOffers}`)
  console.log('Examples (4):')
  console.log(JSON.stringify(examples, null, 2))
}

seed()
  .catch((error) => {
    console.error('Seed error:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await mongoose.connection.close()
  })
