import { useMemo, useState } from 'react'

function DiscoverSection({ offers, onRequestSubmit, requestLoadingByOffer }) {
  const [requestDrafts, setRequestDrafts] = useState({})
  const [searchText, setSearchText] = useState('')
  const [skillFilter, setSkillFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [minRatingFilter, setMinRatingFilter] = useState('all')

  const getDefaultPaymentMode = (offer) => {
    if (offer.acceptsCredits && !offer.acceptsMoney) return 'credits'
    if (!offer.acceptsCredits && offer.acceptsMoney) return 'money'
    return 'credits'
  }

  const updateDraft = (offerId, field, value) => {
    setRequestDrafts((prev) => ({
      ...prev,
      [offerId]: {
        ...(prev[offerId] || { proposedStartAt: '', message: '' }),
        [field]: value,
      },
    }))
  }

  const handleSubmit = (offer) => {
    const draft = {
      proposedStartAt: '',
      message: '',
      paymentMode: getDefaultPaymentMode(offer),
      ...(requestDrafts[offer._id] || {}),
    }
    onRequestSubmit(offer._id, draft)
  }

  const skillOptions = useMemo(() => {
    const names = new Set()

    offers.forEach((offer) => {
      const skillName = typeof offer?.skillId?.name === 'string' ? offer.skillId.name.trim() : ''
      if (skillName) {
        names.add(skillName)
      }
    })

    return Array.from(names).sort((a, b) => a.localeCompare(b))
  }, [offers])

  const filteredOffers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase()

    return offers.filter((offer) => {
      const skillName = typeof offer?.skillId?.name === 'string' ? offer.skillId.name.trim() : ''
      const title = typeof offer?.title === 'string' ? offer.title : ''
      const description = typeof offer?.description === 'string' ? offer.description : ''
      const mentorName = typeof offer?.mentorUserId?.username === 'string' ? offer.mentorUserId.username : ''
      const offerRating = Number(offer?.averageRating || 0)

      const searchMatch =
        normalizedSearch.length === 0 ||
        `${title} ${description} ${mentorName} ${skillName}`.toLowerCase().includes(normalizedSearch)

      const skillMatch = skillFilter === 'all' || skillName === skillFilter

      const paymentMatch =
        paymentFilter === 'all' ||
        (paymentFilter === 'credits' && offer.acceptsCredits) ||
        (paymentFilter === 'money' && offer.acceptsMoney) ||
        (paymentFilter === 'both' && offer.acceptsCredits && offer.acceptsMoney)

      const ratingMatch =
        minRatingFilter === 'all' ||
        (minRatingFilter === '4' && offerRating >= 4) ||
        (minRatingFilter === '3' && offerRating >= 3)

      return searchMatch && skillMatch && paymentMatch && ratingMatch
    })
  }, [offers, searchText, skillFilter, paymentFilter, minRatingFilter])

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
      <h2 className="text-xl font-bold text-slate-900">Discover Session Offers</h2>
      <p className="mt-1 text-sm text-slate-600">Find mentors and request a time slot.</p>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        <input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search title, mentor, description"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
        />

        <select
          value={skillFilter}
          onChange={(event) => setSkillFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
        >
          <option value="all">All skills</option>
          {skillOptions.map((skillName) => (
            <option key={skillName} value={skillName}>
              {skillName}
            </option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(event) => setPaymentFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
        >
          <option value="all">All payment modes</option>
          <option value="credits">Credits</option>
          <option value="money">Money</option>
          <option value="both">Credits + Money</option>
        </select>

        <select
          value={minRatingFilter}
          onChange={(event) => setMinRatingFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
        >
          <option value="all">Any rating</option>
          <option value="4">Rating 4.0+</option>
          <option value="3">Rating 3.0+</option>
        </select>

        <button
          onClick={() => {
            setSearchText('')
            setSkillFilter('all')
            setPaymentFilter('all')
            setMinRatingFilter('all')
          }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
        >
          Reset filters
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Showing {filteredOffers.length} of {offers.length} offers
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredOffers.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No offers available right now.</p>
        ) : (
          filteredOffers.map((offer) => {
            const defaultPaymentMode = getDefaultPaymentMode(offer)
            const draft = requestDrafts[offer._id] || { proposedStartAt: '', message: '', paymentMode: defaultPaymentMode }
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
                {offer.ratingsCount > 0 ? (
                  <p className="mt-1 text-xs font-medium text-amber-600">
                    ★ {Number(offer.averageRating || 0).toFixed(1)} ({offer.ratingsCount})
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">No ratings yet</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {offer.acceptsCredits && (
                    <span className="rounded-full bg-violet-50 px-2 py-1 font-medium text-violet-700">
                      10 credits
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

                {offer.acceptsCredits && offer.acceptsMoney ? (
                  <select
                    value={draft.paymentMode || defaultPaymentMode}
                    onChange={(event) => updateDraft(offer._id, 'paymentMode', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  >
                    <option value="credits">Pay with 10 credits</option>
                    <option value="money">
                      Pay with {offer.currency} {offer.moneyPrice}
                    </option>
                  </select>
                ) : null}

                <button
                  onClick={() => handleSubmit(offer)}
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
