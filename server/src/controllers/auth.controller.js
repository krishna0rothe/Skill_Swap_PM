const { registerUser, loginUser, getCurrentUser } = require('../services/auth.service')

const register = async (req, res) => {
  try {
    const { username, email, password, mobile } = req.body
    const result = await registerUser({ username, email, password, mobile })
    return res.status(201).json(result)
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await loginUser({ email, password })
    return res.status(200).json(result)
  } catch (error) {
    return res.status(401).json({ message: error.message })
  }
}

const me = async (req, res) => {
  try {
    const user = await getCurrentUser(req.user.userId)
    return res.status(200).json({ user })
  } catch (error) {
    return res.status(404).json({ message: error.message })
  }
}

module.exports = {
  register,
  login,
  me,
}
