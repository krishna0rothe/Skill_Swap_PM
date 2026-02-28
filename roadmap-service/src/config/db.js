const mongoose = require('mongoose')

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    console.warn('MONGODB_URI is not set. Roadmap service will run without DB connection.')
    return
  }

  try {
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || undefined,
    })
    console.log('Roadmap service connected to MongoDB')
  } catch (error) {
    console.error(`Roadmap service DB connection error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
