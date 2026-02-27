import { API_BASE_URL } from '../config/api'

export const fetchOnboardingStatus = async (token) => {
  const apiResponse = await fetch(`${API_BASE_URL}/profile/onboarding-status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const response = await apiResponse.json()

  if (!apiResponse.ok) {
    throw new Error(response.message || 'Failed to fetch onboarding status')
  }

  return response
}
