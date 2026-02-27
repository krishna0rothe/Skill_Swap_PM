const express = require('express')
const cors = require('cors')
const morgan = require('morgan')

const healthRoutes = require('./routes/health.routes')
const authRoutes = require('./routes/auth.routes')
const skillRoutes = require('./routes/skill.routes')
const profileRoutes = require('./routes/profile.routes')

const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(morgan('dev'))

app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to SkillSwap API' })
})

app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/profile', profileRoutes)

module.exports = app
