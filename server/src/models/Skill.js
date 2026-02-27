const mongoose = require('mongoose')
const slugify = require('../utils/slugify')

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['academic', 'technical', 'extracurricular'],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

skillSchema.pre('validate', function skillPreValidate(next) {
  if ((this.isModified('name') || !this.slug) && this.name) {
    this.slug = slugify(this.name)
  }
  next()
})

skillSchema.index({ category: 1, slug: 1 })

const Skill = mongoose.model('Skill', skillSchema)

module.exports = Skill
