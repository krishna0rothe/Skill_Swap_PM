const jwt = require('jsonwebtoken')

const VIDEOSDK_API_URL = 'https://api.videosdk.live/v2/rooms'

const getVideoSdkAuthToken = () => {
  const token = process.env.VIDEOSDK_AUTH_TOKEN?.trim()

  if (token) {
    return token
  }

  const apiKey = process.env.VIDEOSDK_API_KEY?.trim()
  const secret = process.env.VIDEOSDK_SECRET_KEY?.trim()

  if (apiKey && secret) {
    return jwt.sign(
      {
        apikey: apiKey,
        permissions: ['allow_join', 'allow_mod'],
      },
      secret,
      {
        algorithm: 'HS256',
        expiresIn: '24h',
      }
    )
  }

  throw new Error('Set either VIDEOSDK_AUTH_TOKEN or VIDEOSDK_API_KEY + VIDEOSDK_SECRET_KEY')
}

const createVideoSdkRoom = async () => {
  const token = getVideoSdkAuthToken()

  const response = await fetch(VIDEOSDK_API_URL, {
    method: 'POST',
    headers: {
      authorization: token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  const data = await response.json()

  if (!response.ok || !data.roomId) {
    throw new Error(data.error || data.message || 'Failed to create VideoSDK room')
  }

  return data.roomId
}

module.exports = {
  getVideoSdkAuthToken,
  createVideoSdkRoom,
}
