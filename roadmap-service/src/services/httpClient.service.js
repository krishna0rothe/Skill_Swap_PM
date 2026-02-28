const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const fetchWithRetry = async (url, options = {}, config = {}) => {
  const {
    retries = 2,
    timeoutMs = 10000,
    retryDelayMs = 400,
    retryOnStatuses = [429, 500, 502, 503, 504],
  } = config

  let attempt = 0
  let lastError

  while (attempt <= retries) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (retryOnStatuses.includes(response.status) && attempt < retries) {
        attempt += 1
        await sleep(retryDelayMs * attempt)
        continue
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error

      if (attempt >= retries) {
        throw error
      }

      attempt += 1
      await sleep(retryDelayMs * attempt)
    }
  }

  throw lastError || new Error('fetchWithRetry failed')
}

module.exports = {
  fetchWithRetry,
}
