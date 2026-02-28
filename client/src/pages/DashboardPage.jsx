import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'
import { clearToken, getToken } from '../utils/authStorage'
import { fetchOnboardingStatus } from '../utils/onboardingStatus'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import DiscoverSection from '../components/dashboard/DiscoverSection'
import HomeSection from '../components/dashboard/HomeSection'
import PlaceholderSection from '../components/dashboard/PlaceholderSection'
import SessionsSection from '../components/dashboard/SessionsSection'
import WalletSection from '../components/dashboard/WalletSection'

const FRONTEND_RAZORPAY_KEY_ID = (import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim()

const ensureRazorpayCheckoutLoaded = () => {
  if (window.Razorpay) {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('home')
  const [mode, setMode] = useState('learn')

  const [skills, setSkills] = useState([])
  const [discoverOffers, setDiscoverOffers] = useState([])
  const [myOffers, setMyOffers] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [learningSessions, setLearningSessions] = useState([])
  const [completedSessions, setCompletedSessions] = useState([])
  const [wallet, setWallet] = useState(null)

  const [savingOffer, setSavingOffer] = useState(false)
  const [sessionMessage, setSessionMessage] = useState('')
  const [sessionError, setSessionError] = useState('')
  const [requestLoadingByOffer, setRequestLoadingByOffer] = useState({})
  const [responseDrafts, setResponseDrafts] = useState({})
  const [actionLoading, setActionLoading] = useState({})
  const [sessionActionLoading, setSessionActionLoading] = useState({})

  const [offerForm, setOfferForm] = useState({
    skillId: '',
    title: '',
    description: '',
    durationMinutes: 60,
    acceptsCredits: true,
    creditPrice: 10,
    acceptsMoney: false,
    moneyPrice: 0,
    currency: 'INR',
    availabilityNote: '',
  })

  const authFetch = async (url, options = {}) => {
    const token = getToken()

    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    })
  }

  const fetchSkills = async () => {
    const apiResponse = await fetch(`${API_BASE_URL}/skills`)
    const response = await apiResponse.json()

    if (!apiResponse.ok) {
      throw new Error(response.message || 'Failed to load skills')
    }

    setSkills(response.skills || [])
  }

  const fetchDiscoverOffers = async () => {
    const apiResponse = await authFetch(`${API_BASE_URL}/session-offers`)
    const response = await apiResponse.json()

    if (!apiResponse.ok) {
      throw new Error(response.message || 'Failed to load session offers')
    }

    setDiscoverOffers(response.offers || [])
  }

  const fetchMyOffers = async () => {
    const apiResponse = await authFetch(`${API_BASE_URL}/session-offers/mine?includeInactive=true`)
    const response = await apiResponse.json()

    if (!apiResponse.ok) {
      throw new Error(response.message || 'Failed to load your offers')
    }

    setMyOffers(response.offers || [])
  }

  const fetchIncomingRequests = async () => {
    const apiResponse = await authFetch(`${API_BASE_URL}/session-requests/incoming`)
    const response = await apiResponse.json()

    if (!apiResponse.ok) {
      throw new Error(response.message || 'Failed to load incoming requests')
    }

    setIncomingRequests(response.requests || [])
  }

  const fetchOutgoingRequests = async () => {
    const apiResponse = await authFetch(`${API_BASE_URL}/session-requests/outgoing`)
    const response = await apiResponse.json()

    if (!apiResponse.ok) {
      throw new Error(response.message || 'Failed to load outgoing requests')
    }

    setOutgoingRequests(response.requests || [])
  }

  const fetchLearningSessions = async () => {
    const apiResponse = await authFetch(`${API_BASE_URL}/learning-sessions/me`)
    const response = await apiResponse.json()

    if (!apiResponse.ok) {
      throw new Error(response.message || 'Failed to load sessions')
    }

    setLearningSessions(response.sessions || [])
  }

  const fetchCompletedSessions = async () => {
    const apiResponse = await authFetch(`${API_BASE_URL}/learning-sessions/history`)
    const response = await apiResponse.json()

    if (!apiResponse.ok) {
      throw new Error(response.message || 'Failed to load completed session history')
    }

    setCompletedSessions(response.sessions || [])
  }

  const fetchWallet = async () => {
    const apiResponse = await authFetch(`${API_BASE_URL}/wallet/me`)
    const response = await apiResponse.json()

    if (!apiResponse.ok) {
      throw new Error(response.message || 'Failed to load wallet')
    }

    setWallet(response.wallet || null)
  }

  const refreshSessionData = async () => {
    await Promise.all([
      fetchSkills(),
      fetchDiscoverOffers(),
      fetchMyOffers(),
      fetchIncomingRequests(),
      fetchOutgoingRequests(),
      fetchLearningSessions(),
      fetchCompletedSessions(),
      fetchWallet(),
    ])
  }

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = getToken()

        if (!token) {
          navigate('/login', { replace: true })
          return
        }

        const onboardingStatus = await fetchOnboardingStatus(token)

        if (!onboardingStatus.isOnboardingComplete) {
          navigate('/onboarding', { replace: true })
          return
        }

        const apiResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const response = await apiResponse.json()

        if (!apiResponse.ok) {
          throw new Error(response.message || 'Failed to fetch user')
        }

        setUser(response.user)
        await refreshSessionData()
      } catch (_error) {
        clearToken()
        navigate('/login', { replace: true })
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [navigate])

  const handleLogout = () => {
    clearToken()
    navigate('/', { replace: true })
  }

  const handleOfferInputChange = (event) => {
    const { name, value, type, checked } = event.target
    setOfferForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleResponseDraftChange = (requestId, field, value) => {
    setResponseDrafts((prev) => ({
      ...prev,
      [requestId]: {
        ...(prev[requestId] || { message: '', scheduledStartAt: '', proposedRescheduleAt: '' }),
        [field]: value,
      },
    }))
  }

  const handleCreateOffer = async (event) => {
    event.preventDefault()
    setSessionMessage('')
    setSessionError('')

    if (!offerForm.skillId || !offerForm.title.trim()) {
      setSessionError('Skill and title are required')
      return
    }

    if (!offerForm.acceptsCredits && !offerForm.acceptsMoney) {
      setSessionError('Select at least one payment option (credits or money)')
      return
    }

    try {
      setSavingOffer(true)
      const token = getToken()

      const payload = {
        ...offerForm,
        title: offerForm.title.trim(),
        description: offerForm.description.trim(),
        availabilityNote: offerForm.availabilityNote.trim(),
        durationMinutes: Number(offerForm.durationMinutes),
        creditPrice: 10,
        moneyPrice: Number(offerForm.moneyPrice),
      }

      const apiResponse = await fetch(`${API_BASE_URL}/session-offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const response = await apiResponse.json()

      if (!apiResponse.ok) {
        throw new Error(response.message || 'Failed to create offer')
      }

      setSessionMessage('Session offer created successfully')
      setOfferForm({
        skillId: '',
        title: '',
        description: '',
        durationMinutes: 60,
        acceptsCredits: true,
        creditPrice: 10,
        acceptsMoney: false,
        moneyPrice: 0,
        currency: 'INR',
        availabilityNote: '',
      })

      await refreshSessionData()
    } catch (error) {
      setSessionError(error.message)
    } finally {
      setSavingOffer(false)
    }
  }

  const handleDiscoverRequest = async (offerId, draft) => {
    if (!draft.proposedStartAt) {
      window.alert('Please select date and time before requesting')
      return
    }

    try {
      setRequestLoadingByOffer((prev) => ({ ...prev, [offerId]: true }))

      let moneyPaymentPayload = {}

      if (draft.paymentMode === 'money') {
        const scriptLoaded = await ensureRazorpayCheckoutLoaded()
        if (!scriptLoaded) {
          throw new Error('Unable to load Razorpay checkout')
        }

        const orderResponse = await authFetch(`${API_BASE_URL}/session-requests/razorpay-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionOfferId: offerId }),
        })

        const orderData = await orderResponse.json()

        if (!orderResponse.ok) {
          throw new Error(orderData.message || 'Failed to initialize payment')
        }

        const checkoutKey = String(orderData?.keyId || FRONTEND_RAZORPAY_KEY_ID || '').trim()

        if (!checkoutKey || checkoutKey === 'undefined' || !/^rzp_(test|live)_/.test(checkoutKey)) {
          throw new Error('Razorpay key is not configured on server')
        }

        if (!orderData?.orderId) {
          throw new Error('Razorpay order could not be created')
        }

        const paymentResult = await new Promise((resolve, reject) => {
          const paymentWindow = new window.Razorpay({
            key: checkoutKey,
            amount: orderData.amount,
            currency: orderData.currency,
            name: orderData.name,
            description: orderData.description,
            order_id: orderData.orderId,
            redirect: false,
            prefill: {
              name: user?.username || '',
              email: user?.email || '',
              contact: user?.mobile || '',
            },
            notes: orderData.notes || {},
            handler: (result) => resolve(result),
            modal: {
              ondismiss: () => reject(new Error('Payment cancelled by user')),
            },
            theme: {
              color: '#4f46e5',
            },
          })

          paymentWindow.open()
        })

        moneyPaymentPayload = paymentResult
      }

      const apiResponse = await authFetch(`${API_BASE_URL}/session-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionOfferId: offerId,
          proposedStartAt: draft.proposedStartAt,
          message: draft.message,
          paymentMode: draft.paymentMode,
          ...moneyPaymentPayload,
        }),
      })

      const response = await apiResponse.json()

      if (!apiResponse.ok) {
        throw new Error(response.message || 'Failed to request session')
      }

      window.alert('Session request sent')
      await refreshSessionData()
    } catch (error) {
      window.alert(error.message)
    } finally {
      setRequestLoadingByOffer((prev) => ({ ...prev, [offerId]: false }))
    }
  }

  const runRequestAction = async (requestId, action, buildPayload) => {
    try {
      setActionLoading((prev) => ({ ...prev, [requestId]: action }))

      const apiResponse = await authFetch(`${API_BASE_URL}/session-requests/${requestId}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })

      const response = await apiResponse.json()

      if (!apiResponse.ok) {
        throw new Error(response.message || `Failed to ${action} request`)
      }

      window.alert(`Request ${action}ed successfully`)
      await refreshSessionData()
    } catch (error) {
      window.alert(error.message)
    } finally {
      setActionLoading((prev) => ({ ...prev, [requestId]: '' }))
    }
  }

  const handleAcceptRequest = async (request) => {
    const draft = responseDrafts[request._id] || {}

    await runRequestAction(request._id, 'accept', () => ({
      message: draft.message || '',
      scheduledStartAt: draft.scheduledStartAt || undefined,
    }))
  }

  const handleRejectRequest = async (request) => {
    const draft = responseDrafts[request._id] || {}

    await runRequestAction(request._id, 'reject', () => ({
      message: draft.message || '',
    }))
  }

  const handleRescheduleRequest = async (request) => {
    const draft = responseDrafts[request._id] || {}

    if (!draft.proposedRescheduleAt) {
      window.alert('Select reschedule date/time first')
      return
    }

    await runRequestAction(request._id, 'reschedule', () => ({
      message: draft.message || '',
      proposedRescheduleAt: draft.proposedRescheduleAt,
    }))
  }

  const pendingRequests = (mode === 'teach' ? incomingRequests : outgoingRequests)
    .filter((request) => ['pending', 'reschedule_requested'].includes(request.status))
    .map((request) => ({
      ...request,
      displayName: mode === 'teach' ? request.learnerUserId?.username || 'Learner' : request.mentorUserId?.username || 'Mentor',
      onAccept: mode === 'teach' ? handleAcceptRequest : null,
      onReject: mode === 'teach' ? handleRejectRequest : null,
    }))

  const requestById = new Map(
    [...incomingRequests, ...outgoingRequests].map((request) => [String(request._id), request])
  )

  const sessionsWithMentorMessage = learningSessions.map((session) => {
    const linkedRequest = requestById.get(String(session.sessionRequestId || ''))

    return {
      ...session,
      mentorMessage: linkedRequest?.mentorResponseMessage || '',
    }
  })

  const completedSessionsWithMentorMessage = completedSessions.map((session) => {
    const linkedRequest = requestById.get(String(session.sessionRequestId || ''))

    return {
      ...session,
      mentorMessage: linkedRequest?.mentorResponseMessage || '',
    }
  })

  const upcomingSessions = sessionsWithMentorMessage
    .filter((session) => ['scheduled', 'rescheduled'].includes(session.status))
    .sort((a, b) => new Date(a.scheduledStartAt) - new Date(b.scheduledStartAt))
    .map((session) => ({
      ...session,
      onJoin: (selectedSession) => navigate(`/call/${selectedSession._id}`),
    }))

  const runSessionAction = async (sessionId, action, payload = {}) => {
    try {
      setSessionActionLoading((prev) => ({ ...prev, [sessionId]: action }))

      const apiResponse = await authFetch(`${API_BASE_URL}/learning-sessions/${sessionId}/${action}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const response = await apiResponse.json()

      if (!apiResponse.ok) {
        throw new Error(response.message || `Failed to ${action} session`)
      }

      window.alert(response.message || `Session ${action}d successfully`)
      await refreshSessionData()
    } catch (error) {
      window.alert(error.message)
    } finally {
      setSessionActionLoading((prev) => ({ ...prev, [sessionId]: '' }))
    }
  }

  const handleCompleteSession = async (session) => {
    await runSessionAction(session._id, 'complete')
  }

  const handleCancelSession = async (session) => {
    const reason = window.prompt('Reason for cancellation (optional)') || ''
    await runSessionAction(session._id, 'cancel', { reason })
  }

  const handleSubmitReview = async (session, payload) => {
    try {
      const apiResponse = await authFetch(`${API_BASE_URL}/learning-sessions/${session._id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const response = await apiResponse.json()

      if (!apiResponse.ok) {
        throw new Error(response.message || 'Failed to submit review')
      }

      window.alert('Review saved successfully')
      await refreshSessionData()
    } catch (error) {
      window.alert(error.message)
      throw error
    }
  }

  const renderSection = () => {
    if (activeSection === 'home') {
      return <HomeSection upcomingSessions={upcomingSessions} pendingRequests={pendingRequests} mode={mode} />
    }

    if (activeSection === 'sessions') {
      return (
        <SessionsSection
          mode={mode}
          skills={skills}
          offerForm={offerForm}
          onOfferInputChange={handleOfferInputChange}
          onCreateOffer={handleCreateOffer}
          savingOffer={savingOffer}
          sessionError={sessionError}
          sessionMessage={sessionMessage}
          myOffers={myOffers}
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          responseDrafts={responseDrafts}
          onResponseDraftChange={handleResponseDraftChange}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
          onRescheduleRequest={handleRescheduleRequest}
          actionLoading={actionLoading}
          learningSessions={sessionsWithMentorMessage}
          completedSessions={completedSessionsWithMentorMessage}
          onJoinSession={(session) => navigate(`/call/${session._id}`)}
          onCompleteSession={handleCompleteSession}
          onCancelSession={handleCancelSession}
          onSubmitReview={handleSubmitReview}
          sessionActionLoading={sessionActionLoading}
        />
      )
    }

    if (activeSection === 'discover') {
      return (
        <DiscoverSection
          offers={discoverOffers}
          onRequestSubmit={handleDiscoverRequest}
          requestLoadingByOffer={requestLoadingByOffer}
        />
      )
    }

    if (activeSection === 'wallet') {
      return <WalletSection wallet={wallet} />
    }

    return <PlaceholderSection title={activeSection} />
  }

  return (
    <main className="min-h-screen bg-[#fbfcff] text-slate-800">
      {loading ? (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-slate-600">Loading dashboard...</p>
        </div>
      ) : (
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-[240px_1fr]">
          <DashboardSidebar activeSection={activeSection} onChangeSection={setActiveSection} user={user} onLogout={handleLogout} />

          <div className="p-4 md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white p-4">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">{activeSection === 'home' ? 'Dashboard' : activeSection}</h1>
                <p className="text-xs text-slate-600">Mode: {mode}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode((prev) => (prev === 'teach' ? 'learn' : 'teach'))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  Switch to {mode === 'teach' ? 'learn' : 'teach'}
                </button>
                <button
                  onClick={refreshSessionData}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                >
                  Refresh Data
                </button>
              </div>
            </div>

            {renderSection()}
          </div>
        </div>
      )}
    </main>
  )
}

export default DashboardPage
