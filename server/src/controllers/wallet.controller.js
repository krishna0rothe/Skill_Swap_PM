const { ensureWalletForUser, listWalletTransactionsForUser } = require('../services/wallet.service')

const me = async (req, res) => {
  try {
    const userId = req.user.userId
    const wallet = await ensureWalletForUser(req.user.userId)
    const transactions = await listWalletTransactionsForUser(userId, { limit: req.query.limit })

    const normalizedTransactions = transactions.map((transaction) => {
      const isLearner = String(transaction.learnerUserId?._id || transaction.learnerUserId) === String(userId)
      const direction = isLearner ? 'debit' : 'credit'

      return {
        _id: transaction._id,
        learningSessionId: transaction.learningSessionId?._id || null,
        learningSessionTitle: transaction.learningSessionId?.title || 'Session',
        learningSessionScheduledAt: transaction.learningSessionId?.scheduledStartAt || null,
        mode: transaction.mode,
        provider: transaction.provider,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        notes: transaction.notes,
        direction,
        learnerName: transaction.learnerUserId?.username || 'Learner',
        mentorName: transaction.mentorUserId?.username || 'Mentor',
        createdAt: transaction.createdAt,
      }
    })

    return res.status(200).json({ wallet, transactions: normalizedTransactions })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}

module.exports = {
  me,
}
