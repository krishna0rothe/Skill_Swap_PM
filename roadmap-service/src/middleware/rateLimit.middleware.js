const createRateLimiter = ({ windowMs, maxRequests, keyPrefix = 'default' }) => {
  const buckets = new Map()

  return (req, res, next) => {
    const now = Date.now()
    const key = `${keyPrefix}:${req.ip || req.socket?.remoteAddress || 'unknown'}`
    const existing = buckets.get(key)

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }

    if (existing.count >= maxRequests) {
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
      })
    }

    existing.count += 1
    return next()
  }
}

module.exports = {
  createRateLimiter,
}
