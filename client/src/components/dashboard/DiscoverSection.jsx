import { useState } from 'react'

function DiscoverSection({ offers, onRequestSubmit, requestLoadingByOffer }) {
  const [requestDrafts, setRequestDrafts] = useState({})

  const updateDraft = (offerId, field, value) => {
    setRequestDrafts((prev) => ({
      ...prev,
      [offerId]: {
        ...(prev[offerId] || { proposedStartAt: '', message: '' }),
        [field]: value,
      },
    }))
  }

  const handleSubmit = (offerId) => {
    const draft = requestDrafts[offerId] || { proposedStartAt: '', message: '' }
    onRequestSubmit(offerId, draft)
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
      <h2 className="text-xl font-bold text-slate-900">Discover Session Offers</h2>
      <p className="mt-1 text-sm text-slate-600">Find mentors and request a time slot.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {offers.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No offers available right now.</p>
        ) : (
          offers.map((offer) => {
            const draft = requestDrafts[offer._id] || { proposedStartAt: '', message: '' }
            const isLoading = Boolean(requestLoadingByOffer[offer._id])

            return (
              <article
                key={offer._id}
                className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 p-4 shadow-[0_12px_30px_-26px_rgba(30,41,59,0.6)]"
              >
                <p className="text-sm font-bold text-slate-900">{offer.title}</p>
                <p className="mt-1 text-xs text-slate-600">by {offer.mentorUserId?.username || 'Mentor'}</p>
                <p className="mt-2 text-xs text-slate-600">
                  {offer.skillId?.name || 'Skill'} • {offer.durationMinutes} mins
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {offer.acceptsCredits && (
                    <span className="rounded-full bg-violet-50 px-2 py-1 font-medium text-violet-700">
                      {offer.creditPrice} credits
                    </span>
                  )}
                  {offer.acceptsMoney && (
                    <span className="rounded-full bg-sky-50 px-2 py-1 font-medium text-sky-700">
                      {offer.currency} {offer.moneyPrice}
                    </span>
                  )}
                </div>

                <input
                  type="datetime-local"
                  value={draft.proposedStartAt}
                  onChange={(event) => updateDraft(offer._id, 'proposedStartAt', event.target.value)}
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                />

                <textarea
                  value={draft.message}
                  onChange={(event) => updateDraft(offer._id, 'message', event.target.value)}
                  rows={2}
                  placeholder="Message for mentor"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                />

                <button
                  onClick={() => handleSubmit(offer._id)}
                  disabled={isLoading}
                  className="mt-3 w-full rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-70"
                >
                  {isLoading ? 'Requesting...' : 'Request Session'}
                </button>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}

export default DiscoverSection
