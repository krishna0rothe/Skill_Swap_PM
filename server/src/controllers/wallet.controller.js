const { ensureWalletForUser } = require('../services/wallet.service')

const me = async (req, res) => {
  try {
    const wallet = await ensureWalletForUser(req.user.userId)
    return res.status(200).json({ wallet })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

module.exports = {
  me,
}
