const mongoose = require('mongoose')

const connectDB = async () => {
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URL ||
    process.env.MONGO_URL

  if (!mongoUri || typeof mongoUri !== 'string') {
    console.error('MongoDB connection failed: set MONGO_URI (or MONGODB_URI) in server/.env')
    process.exit(1)
  }

  try {
    await mongoose.connect(mongoUri)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection failed:', error.message)
    process.exit(1)
  }
}

module.exports = connectDB
