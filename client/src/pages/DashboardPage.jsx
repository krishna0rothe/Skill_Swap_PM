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
        creditPrice: Number(offerForm.creditPrice),
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
      const apiResponse = await authFetch(`${API_BASE_URL}/session-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionOfferId: offerId,
          proposedStartAt: draft.proposedStartAt,
          message: draft.message,
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

  const upcomingSessions = learningSessions
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

      window.alert(`Session ${action}d successfully`)
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

  const renderSection = () => {
    if (activeSection === 'home') {
      return <HomeSection upcomingSessions={upcomingSessions} pendingRequests={pendingRequests} mode={mode} />
    }

    if (activeSection === 'sessions') {
      return (
        <SessionsSection
          mode={mode}
          onModeChange={setMode}
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
          learningSessions={learningSessions}
          onJoinSession={(session) => navigate(`/call/${session._id}`)}
          onCompleteSession={handleCompleteSession}
          onCancelSession={handleCancelSession}
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
