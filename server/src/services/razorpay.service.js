const crypto = require('crypto')
const Razorpay = require('razorpay')

let cachedClient = null

const normalizeEnvValue = (value) => {
  const normalized = String(value || '').trim()
  if (!normalized) return ''

  const lowered = normalized.toLowerCase()
  if (['undefined', 'null', 'your_razorpay_key_id', 'your_razorpay_key_secret'].includes(lowered)) {
    return ''
  }

  return normalized
}

const getRazorpayClient = () => {
  if (cachedClient) {
    return cachedClient
  }

  const keyId = normalizeEnvValue(process.env.RAZORPAY_KEY_ID)
  const keySecret = normalizeEnvValue(process.env.RAZORPAY_KEY_SECRET)

  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required')
  }

  cachedClient = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })

  return cachedClient
}

const createRazorpayOrder = async ({ amount, currency, receipt, notes }) => {
  const client = getRazorpayClient()

  return client.orders.create({
    amount,
    currency,
    receipt,
    notes,
  })
}

const fetchRazorpayPayment = async (paymentId) => {
  const client = getRazorpayClient()
  return client.payments.fetch(paymentId)
}

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const keySecret = normalizeEnvValue(process.env.RAZORPAY_KEY_SECRET)

  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is required')
  }

  const payload = `${orderId}|${paymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(payload)
    .digest('hex')

  return expectedSignature === signature
}

const getRazorpayPublicKey = () => {
  const keyId = normalizeEnvValue(process.env.RAZORPAY_KEY_ID)

  if (!keyId) {
    throw new Error('RAZORPAY_KEY_ID is required')
  }

  return keyId
}

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature,
  fetchRazorpayPayment,
  getRazorpayPublicKey,
}
