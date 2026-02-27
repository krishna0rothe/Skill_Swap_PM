const User = require('../models/User')
const generateToken = require('../utils/generateToken')

const sanitizeUser = (userDoc) => ({
  id: userDoc._id,
  username: userDoc.username,
  email: userDoc.email,
  mobile: userDoc.mobile,
  isVerified: userDoc.isVerified,
  createdAt: userDoc.createdAt,
  updatedAt: userDoc.updatedAt,
})

const registerUser = async ({ username, email, password, mobile }) => {
  const existingUser = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username }],
  })

  if (existingUser) {
    throw new Error('User already exists with email or username')
  }

  const user = await User.create({ username, email, password, mobile })
  const token = generateToken(user._id)

  return { user: sanitizeUser(user), token }
}

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

  if (!user) {
    throw new Error('Invalid email or password')
  }

  const isPasswordValid = await user.comparePassword(password)

  if (!isPasswordValid) {
    throw new Error('Invalid email or password')
  }

  const token = generateToken(user._id)
  return { user: sanitizeUser(user), token }
}

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId)

  if (!user) {
    throw new Error('User not found')
  }

  return sanitizeUser(user)
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
}
