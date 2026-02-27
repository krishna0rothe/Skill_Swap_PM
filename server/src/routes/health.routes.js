const express = require('express')

const router = express.Router()

router.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'skillswap-server' })
})

module.exports = router
