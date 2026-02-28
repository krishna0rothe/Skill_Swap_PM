const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET?.trim() || 'dev_jwt_secret_change_me'

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: token missing' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = { userId: decoded.userId }
    return next()
  } catch (_error) {
    return res.status(401).json({ message: 'Unauthorized: invalid token' })
  }
}

module.exports = { protect }
