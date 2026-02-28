const Wallet = require('../models/Wallet')
const PaymentTransaction = require('../models/PaymentTransaction')

const STARTING_CREDIT_BALANCE = 60

const createWalletForUser = async (userId) => {
  return Wallet.create({
    userId,
    creditBalance: STARTING_CREDIT_BALANCE,
    lockedCreditBalance: 0,
    realMoneyBalance: 0,
    lockedMoneyBalance: 0,
    currency: 'INR',
  })
}

const ensureWalletForUser = async (userId) => {
  return Wallet.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: {
        userId,
        creditBalance: STARTING_CREDIT_BALANCE,
        lockedCreditBalance: 0,
        realMoneyBalance: 0,
        lockedMoneyBalance: 0,
        currency: 'INR',
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  )
}

const getWalletByUserId = async (userId) => {
  return Wallet.findOne({ userId })
}

const lockCredits = async (userId, amount) => {
  const wallet = await ensureWalletForUser(userId)

  if (wallet.creditBalance < amount) {
    throw new Error('Insufficient credits for this session')
  }

  wallet.creditBalance -= amount
  wallet.lockedCreditBalance += amount
  await wallet.save()

  return wallet
}

const settleLockedCreditsToMentor = async ({ learnerUserId, mentorUserId, amount }) => {
  const learnerWallet = await ensureWalletForUser(learnerUserId)
  const mentorWallet = await ensureWalletForUser(mentorUserId)

  if (learnerWallet.lockedCreditBalance < amount) {
    throw new Error('Locked credits are insufficient for settlement')
  }

  learnerWallet.lockedCreditBalance -= amount
  mentorWallet.creditBalance += amount

  await learnerWallet.save()
  await mentorWallet.save()

  return { learnerWallet, mentorWallet }
}

const refundLockedCredits = async ({ learnerUserId, amount }) => {
  const learnerWallet = await ensureWalletForUser(learnerUserId)

  if (learnerWallet.lockedCreditBalance < amount) {
    throw new Error('Locked credits are insufficient for refund')
  }

  learnerWallet.lockedCreditBalance -= amount
  learnerWallet.creditBalance += amount
  await learnerWallet.save()

  return learnerWallet
}

const creditRealMoneyToMentor = async ({ mentorUserId, amount }) => {
  const mentorWallet = await ensureWalletForUser(mentorUserId)
  mentorWallet.realMoneyBalance += amount
  await mentorWallet.save()
  return mentorWallet
}

const listWalletTransactionsForUser = async (userId, { limit = 20 } = {}) => {
  const normalizedLimit = Math.max(1, Math.min(Number(limit) || 20, 100))

  return PaymentTransaction.find({
    $or: [{ learnerUserId: userId }, { mentorUserId: userId }],
  })
    .populate('learningSessionId', 'title scheduledStartAt')
    .populate('learnerUserId', 'username')
    .populate('mentorUserId', 'username')
    .sort({ createdAt: -1 })
    .limit(normalizedLimit)
}

module.exports = {
  STARTING_CREDIT_BALANCE,
  createWalletForUser,
  ensureWalletForUser,
  getWalletByUserId,
  lockCredits,
  settleLockedCreditsToMentor,
  refundLockedCredits,
  creditRealMoneyToMentor,
  listWalletTransactionsForUser,
}
