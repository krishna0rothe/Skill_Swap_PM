import { useMemo, useState } from 'react'

const formatDateTime = (value) => new Date(value).toLocaleString()

function HomeSection({ upcomingSessions, pendingRequests, mode }) {
  const [showCalendarDetail, setShowCalendarDetail] = useState(false)

  const upcomingBuckets = useMemo(() => {
    const map = new Map()

    upcomingSessions.forEach((session) => {
      const dayLabel = new Date(session.scheduledStartAt).toLocaleDateString()
      const existing = map.get(dayLabel) || []
      existing.push(session)
      map.set(dayLabel, existing)
    })

    return Array.from(map.entries()).slice(0, 6)
  }, [upcomingSessions])

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Upcoming Calendar</h2>
            <p className="mt-1 text-sm text-slate-600">Small preview of accepted sessions.</p>
          </div>
          <button
            onClick={() => setShowCalendarDetail(true)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
          >
            Open Calendar
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {upcomingBuckets.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No upcoming accepted sessions.</p>
          ) : (
            upcomingBuckets.map(([day, sessions]) => (
              <button
                key={day}
                onClick={() => setShowCalendarDetail(true)}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-violet-200"
              >
                <p className="text-sm font-semibold text-slate-800">{day}</p>
                <p className="mt-1 text-xs text-slate-600">{sessions.length} session(s)</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
        <h2 className="text-xl font-bold text-slate-900">Pending Requests</h2>
        <p className="mt-1 text-sm text-slate-600">
          {mode === 'teach' ? 'Learners waiting for your response.' : 'Your requests waiting for mentor response.'}
        </p>

        <div className="mt-5 space-y-3">
          {pendingRequests.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No pending requests.</p>
          ) : (
            pendingRequests.map((request) => (
              <div key={request._id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                  {(request.displayName || 'U')[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{request.displayName}</p>
                  <p className="text-xs text-slate-600">{request.sessionOfferId?.title || 'Session request'}</p>
                </div>

                {mode === 'teach' && request.onAccept && request.onReject && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => request.onAccept(request)}
                      className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => request.onReject(request)}
                      className="rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showCalendarDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Accepted Sessions Calendar</h3>
              <button
                onClick={() => setShowCalendarDetail(false)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {upcomingSessions.length === 0 ? (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No accepted sessions yet.</p>
              ) : (
                upcomingSessions.map((session) => (
                  <div key={session._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">{session.title}</p>
                    <p className="mt-1 text-xs text-slate-600">{formatDateTime(session.scheduledStartAt)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {mode === 'teach'
                        ? `Learner: ${session.learnerUserId?.username || '-'}`
                        : `Mentor: ${session.mentorUserId?.username || '-'}`}
                    </p>
                    <button
                      onClick={() => session.onJoin?.(session)}
                      className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white"
                    >
                      Join Call
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomeSection
