const health = async (_req, res) => {
  return res.status(200).json({
    service: 'roadmap-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}

module.exports = {
  health,
}
