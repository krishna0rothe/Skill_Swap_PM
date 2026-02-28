const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

const app = require('./app')
const connectDB = require('./config/db')

const PORT = process.env.PORT || 5002

connectDB()

app.listen(PORT, () => {
  console.log(`Roadmap service running on port ${PORT}`)
})
