const express = require('express')
const cors = require('cors')
const morgan = require('morgan')

const healthRoutes = require('./routes/health.routes')
const authRoutes = require('./routes/auth.routes')
const skillRoutes = require('./routes/skill.routes')
const profileRoutes = require('./routes/profile.routes')
const sessionOfferRoutes = require('./routes/sessionOffer.routes')
const sessionRequestRoutes = require('./routes/sessionRequest.routes')
const learningSessionRoutes = require('./routes/learningSession.routes')

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
app.use('/api/session-offers', sessionOfferRoutes)
app.use('/api/session-requests', sessionRequestRoutes)
app.use('/api/learning-sessions', learningSessionRoutes)

module.exports = app
