import { useMemo, useState } from 'react'

function SessionsSection({
  mode,
  skills,
  offerForm,
  onOfferInputChange,
  onCreateOffer,
  savingOffer,
  sessionError,
  sessionMessage,
  myOffers,
  incomingRequests,
  outgoingRequests,
  responseDrafts,
  onResponseDraftChange,
  onAcceptRequest,
  onRejectRequest,
  onRescheduleRequest,
  actionLoading,
  learningSessions,
  completedSessions,
  onJoinSession,
  onCompleteSession,
  onCancelSession,
  onSubmitReview,
  sessionActionLoading,
}) {
  const [reviewDrafts, setReviewDrafts] = useState({})
  const [reviewLoadingBySession, setReviewLoadingBySession] = useState({})

  const listToRender = useMemo(() => {
    if (mode === 'teach') {
      return incomingRequests.filter((request) => ['pending', 'reschedule_requested'].includes(request.status))
    }

    return outgoingRequests
  }, [incomingRequests, mode, outgoingRequests])

  const activeLearningSessions = useMemo(
    () => learningSessions.filter((session) => ['scheduled', 'rescheduled'].includes(session.status)),
    [learningSessions]
  )

  const resolveExistingReview = (session) => {
    if (mode === 'teach') {
      return {
        rating: session.learnerRating || '',
        review: session.learnerReview || '',
      }
    }

    return {
      rating: session.mentorRating || '',
      review: session.mentorReview || '',
    }
  }

  const updateReviewDraft = (session, field, value) => {
    const existing = resolveExistingReview(session)
    setReviewDrafts((prev) => ({
      ...prev,
      [session._id]: {
        rating: prev[session._id]?.rating ?? existing.rating,
        review: prev[session._id]?.review ?? existing.review,
        [field]: value,
      },
    }))
  }

  const handleReviewSubmit = async (session) => {
    const existing = resolveExistingReview(session)
    const draft = reviewDrafts[session._id] || existing
    const normalizedRating = Number(draft.rating)

    if (!normalizedRating || normalizedRating < 1 || normalizedRating > 5) {
      window.alert('Please select a rating between 1 and 5')
      return
    }

    try {
      setReviewLoadingBySession((prev) => ({ ...prev, [session._id]: true }))
      await onSubmitReview(session, {
        rating: normalizedRating,
        review: String(draft.review || ''),
      })
    } finally {
      setReviewLoadingBySession((prev) => ({ ...prev, [session._id]: false }))
    }
  }

  const getPaymentStatusLabel = (session) => {
    if (session.paymentMode === 'money' && session.paymentStatus === 'paid') {
      return 'paid'
    }

    return session.paymentStatus
  }

  return (
    <div className="space-y-6">
      {mode === 'teach' && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
            <h2 className="text-xl font-bold text-slate-900">Create Session Offer</h2>
            <p className="mt-1 text-sm text-slate-600">Create an offer so learners can discover it.</p>

            <form onSubmit={onCreateOffer} className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Skill</label>
                  <select
                    name="skillId"
                    value={offerForm.skillId}
                    onChange={onOfferInputChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                    required
                  >
                    <option value="">Select skill</option>
                    {skills.map((skill) => (
                      <option key={skill._id} value={skill._id}>
                        {skill.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
                  <input
                    name="title"
                    value={offerForm.title}
                    onChange={onOfferInputChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                    required
                  />
                </div>
              </div>

              <textarea
                name="description"
                value={offerForm.description}
                onChange={onOfferInputChange}
                rows={3}
                placeholder="Describe what you will teach"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />

              <div className="grid gap-4 md:grid-cols-3">
                <input
                  name="durationMinutes"
                  type="number"
                  min={15}
                  max={240}
                  value={offerForm.durationMinutes}
                  onChange={onOfferInputChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
                <input
                  value="10"
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm"
                />
                <input
                  name="moneyPrice"
                  type="number"
                  min={0}
                  value={offerForm.moneyPrice}
                  onChange={onOfferInputChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    name="acceptsCredits"
                    checked={offerForm.acceptsCredits}
                    onChange={onOfferInputChange}
                  />
                  Accept credits
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    name="acceptsMoney"
                    checked={offerForm.acceptsMoney}
                    onChange={onOfferInputChange}
                  />
                  Accept money
                </label>
              </div>

              <textarea
                name="availabilityNote"
                value={offerForm.availabilityNote}
                onChange={onOfferInputChange}
                rows={2}
                placeholder="Availability note"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
              />

              {sessionError && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{sessionError}</p>}
              {sessionMessage && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{sessionMessage}</p>}

              <button
                type="submit"
                disabled={savingOffer}
                className="animated-gradient-btn w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
              >
                {savingOffer ? 'Creating...' : 'Create Offer'}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
            <h3 className="text-lg font-bold text-slate-900">My Offers</h3>
            <div className="mt-4 space-y-3">
              {myOffers.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No offers yet.</p>
              ) : (
                myOffers.map((offer) => (
                  <div key={offer._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">{offer.title}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {offer.skillId?.name || 'Skill'} • {offer.durationMinutes} mins
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
        <h3 className="text-lg font-bold text-slate-900">{mode === 'teach' ? 'Incoming Requests' : 'My Requested Sessions'}</h3>
        <div className="mt-4 space-y-3">
          {listToRender.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No requests found.</p>
          ) : (
            listToRender.map((request) => {
              const draft = responseDrafts[request._id] || { message: '', scheduledStartAt: '', proposedRescheduleAt: '' }
              const loadingState = actionLoading[request._id] || ''

              return (
                <div key={request._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">{request.sessionOfferId?.title || 'Session Request'}</p>
                  <p className="mt-1 text-xs text-slate-600">Status: {request.status}</p>
                  <p className="mt-1 text-xs text-slate-600">Requested: {new Date(request.proposedStartAt).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-slate-600">Payment selected: {request.paymentMode || 'credits'}</p>

                  <textarea
                    value={draft.message}
                    onChange={(event) => onResponseDraftChange(request._id, 'message', event.target.value)}
                    rows={2}
                    placeholder="Message"
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />

                  {mode === 'teach' && (
                    <>
                      <input
                        type="datetime-local"
                        value={draft.scheduledStartAt}
                        onChange={(event) => onResponseDraftChange(request._id, 'scheduledStartAt', event.target.value)}
                        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />

                      <input
                        type="datetime-local"
                        value={draft.proposedRescheduleAt}
                        onChange={(event) => onResponseDraftChange(request._id, 'proposedRescheduleAt', event.target.value)}
                        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => onAcceptRequest(request)}
                          disabled={loadingState === 'accept'}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-70"
                        >
                          {loadingState === 'accept' ? 'Accepting...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => onRejectRequest(request)}
                          disabled={loadingState === 'reject'}
                          className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-70"
                        >
                          {loadingState === 'reject' ? 'Rejecting...' : 'Reject'}
                        </button>
                        <button
                          onClick={() => onRescheduleRequest(request)}
                          disabled={loadingState === 'reschedule'}
                          className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-70"
                        >
                          {loadingState === 'reschedule' ? 'Sending...' : 'Ask Reschedule'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
        <h3 className="text-lg font-bold text-slate-900">Active Learning Sessions</h3>
        <div className="mt-4 space-y-3">
          {activeLearningSessions.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No active sessions right now.</p>
          ) : (
            activeLearningSessions.map((session) => {
              const loadingState = sessionActionLoading[session._id] || ''
              const canUpdate = ['scheduled', 'rescheduled'].includes(session.status)

              return (
                <div key={session._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">{session.title}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {new Date(session.scheduledStartAt).toLocaleString()} • {session.durationMinutes} mins
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {session.skillId?.name || 'Skill'} • {session.paymentMode} • payment: {getPaymentStatusLabel(session)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">status: {session.status}</p>

                  {canUpdate && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => onJoinSession(session)}
                        className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Join Call
                      </button>
                      {mode === 'teach' && (
                        <button
                          onClick={() => onCompleteSession(session)}
                          disabled={loadingState === 'complete'}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-70"
                        >
                          {loadingState === 'complete' ? 'Completing...' : 'Mark Complete'}
                        </button>
                      )}
                      <button
                        onClick={() => onCancelSession(session)}
                        disabled={loadingState === 'cancel'}
                        className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-70"
                      >
                        {loadingState === 'cancel' ? 'Cancelling...' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
        <h3 className="text-lg font-bold text-slate-900">Completed Session History</h3>
        <div className="mt-4 space-y-3">
          {completedSessions.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No completed sessions yet.</p>
          ) : (
            completedSessions.map((session) => {
              const existing = resolveExistingReview(session)
              const draft = reviewDrafts[session._id] || existing
              const isSaving = Boolean(reviewLoadingBySession[session._id])

              return (
                <div key={session._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">{session.title}</p>
                  <p className="mt-1 text-xs text-slate-600">
                    {new Date(session.scheduledStartAt).toLocaleString()} • {session.durationMinutes} mins
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {mode === 'teach'
                      ? `Learner: ${session.learnerUserId?.username || 'Learner'}`
                      : `Mentor: ${session.mentorUserId?.username || 'Mentor'}`}
                  </p>

                  <div className="mt-3 grid gap-2 md:grid-cols-[160px_1fr]">
                    <select
                      value={draft.rating}
                      onChange={(event) => updateReviewDraft(session, 'rating', event.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Rate session</option>
                      <option value="1">1 - Poor</option>
                      <option value="2">2 - Fair</option>
                      <option value="3">3 - Good</option>
                      <option value="4">4 - Very good</option>
                      <option value="5">5 - Excellent</option>
                    </select>

                    <textarea
                      value={draft.review}
                      onChange={(event) => updateReviewDraft(session, 'review', event.target.value)}
                      rows={2}
                      placeholder="Write your review"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>

                  <button
                    onClick={() => handleReviewSubmit(session)}
                    disabled={isSaving}
                    className="mt-3 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-70"
                  >
                    {isSaving ? 'Saving...' : 'Save Review'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default SessionsSection
