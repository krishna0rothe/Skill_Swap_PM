const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { parseMultipartIfNeeded, logMultipartPayload } = require('./middleware/multerLogging.middleware')

const healthRoutes = require('./routes/health.routes')
const roadmapRoutes = require('./routes/roadmap.routes')

const app = express()

app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(morgan('dev'))
app.use('/api/roadmaps', parseMultipartIfNeeded, logMultipartPayload)

app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to SkillSwap Roadmap Service' })
})

app.use('/api/health', healthRoutes)
app.use('/api/roadmaps', roadmapRoutes)

module.exports = app
