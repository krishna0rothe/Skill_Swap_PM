import { useMemo, useState } from 'react'

const formatDateTime = (value) => new Date(value).toLocaleString()

function HomeSection({ upcomingSessions, pendingRequests, mode }) {
  const [showCalendarDetail, setShowCalendarDetail] = useState(false)
  const [detailPanel, setDetailPanel] = useState('')

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

  const now = new Date()
  const next24HoursCount = useMemo(
    () =>
      upcomingSessions.filter((session) => {
        const scheduledAt = new Date(session.scheduledStartAt).getTime()
        const diffMs = scheduledAt - now.getTime()
        return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000
      }).length,
    [upcomingSessions, now]
  )

  const nextSession = upcomingSessions[0]

  const stats = [
    {
      label: mode === 'teach' ? 'Pending Learners' : 'Pending Requests',
      value: pendingRequests.length,
      tone: 'text-violet-700',
      bg: 'bg-violet-50',
    },
    {
      label: 'Upcoming Sessions',
      value: upcomingSessions.length,
      tone: 'text-indigo-700',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Next 24 Hours',
      value: next24HoursCount,
      tone: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Active Days',
      value: upcomingBuckets.length,
      tone: 'text-amber-700',
      bg: 'bg-amber-50',
    },
  ]

  const quickActions =
    mode === 'teach'
      ? ['Respond to pending requests', 'Create a new session offer', 'Prepare your next class notes']
      : ['Browse offers and request slots', 'Check request responses', 'Prepare goals for next call']

  const recentActivity = useMemo(() => {
    const requestItems = pendingRequests.slice(0, 3).map((request) => ({
      id: `request-${request._id}`,
      title: `${request.displayName || 'User'} requested ${request.sessionOfferId?.title || 'a session'}`,
      subtitle: request.proposedStartAt ? formatDateTime(request.proposedStartAt) : 'Awaiting schedule',
      badge: 'Request',
      badgeClass: 'bg-violet-100 text-violet-700',
    }))

    const sessionItems = upcomingSessions.slice(0, 3).map((session) => ({
      id: `session-${session._id}`,
      title: session.title,
      subtitle: formatDateTime(session.scheduledStartAt),
      badge: 'Session',
      badgeClass: 'bg-indigo-100 text-indigo-700',
    }))

    return [...requestItems, ...sessionItems].slice(0, 5)
  }, [pendingRequests, upcomingSessions])

  const detailPanelTitle =
    detailPanel === 'stats'
      ? 'Analytics Details'
      : detailPanel === 'focus'
        ? 'Next Session Details'
        : detailPanel === 'pending'
          ? 'Pending Requests Details'
          : detailPanel === 'recent'
            ? 'Recent Activity Details'
            : ''

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <button
            key={item.label}
            onClick={() => setDetailPanel('stats')}
            className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_15px_36px_-30px_rgba(15,23,42,0.55)]"
          >
            <p className="text-left text-xs font-medium text-slate-500">{item.label}</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
              <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.bg} ${item.tone}`}>Live</span>
            </div>
            <p className="mt-2 text-left text-[10px] font-medium text-slate-500">Click for more details</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Next Session Focus</h2>
              <p className="mt-1 text-sm text-slate-600">Mode-aware quick summary for what to do next.</p>
            </div>
            <button
              onClick={() => setDetailPanel('focus')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              View details
            </button>
          </div>

          {nextSession ? (
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">{nextSession.title}</p>
              <p className="mt-1 text-xs text-slate-600">{formatDateTime(nextSession.scheduledStartAt)}</p>
              <p className="mt-1 text-xs text-slate-600">
                {mode === 'teach'
                  ? `Learner: ${nextSession.learnerUserId?.username || '-'}`
                  : `Mentor: ${nextSession.mentorUserId?.username || '-'}`}
              </p>
              {nextSession.mentorMessage ? (
                <p className="mt-2 rounded-lg bg-violet-50 px-2 py-1 text-xs text-violet-700">
                  Mentor message: {nextSession.mentorMessage}
                </p>
              ) : null}
              <button
                onClick={() => nextSession.onJoin?.(nextSession)}
                className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white"
              >
                Join Call
              </button>
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No upcoming session in queue.</p>
          )}

          <div className="mt-5 grid gap-2">
            {quickActions.map((item) => (
              <div key={item} className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs font-medium text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => setDetailPanel('recent')}
          className="rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]"
        >
          <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
          <p className="mt-1 text-sm text-slate-600">Frontend summary from your current requests and upcoming sessions.</p>

          <div className="mt-5 space-y-3">
            {recentActivity.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No recent activity to show yet.</p>
            ) : (
              recentActivity.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{activity.title}</p>
                    <p className="mt-1 text-xs text-slate-600">{activity.subtitle}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${activity.badgeClass}`}>
                    {activity.badge}
                  </span>
                </div>
              ))
            )}
          </div>
          <p className="mt-3 text-[10px] font-medium text-slate-500">Click card for full list</p>
        </button>
      </div>

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

        <div className="rounded-3xl border border-slate-100 bg-white p-6 text-left shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pending Requests</h2>
              <p className="mt-1 text-sm text-slate-600">
                {mode === 'teach' ? 'Learners waiting for your response.' : 'Your requests waiting for mentor response.'}
              </p>
            </div>
            <button
              onClick={() => setDetailPanel('pending')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
            >
              View details
            </button>
          </div>

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

      {detailPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{detailPanelTitle}</h3>
              <button
                onClick={() => setDetailPanel('')}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {detailPanel === 'stats' && (
                stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-600">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
                    <p className="mt-1 text-xs text-slate-500">Live snapshot based on current dashboard data.</p>
                  </div>
                ))
              )}

              {detailPanel === 'focus' && (
                <>
                  {nextSession ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-800">{nextSession.title}</p>
                      <p className="mt-1 text-xs text-slate-600">{formatDateTime(nextSession.scheduledStartAt)}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {mode === 'teach'
                          ? `Learner: ${nextSession.learnerUserId?.username || '-'}`
                          : `Mentor: ${nextSession.mentorUserId?.username || '-'}`}
                      </p>
                      {nextSession.mentorMessage ? (
                        <p className="mt-2 rounded-lg bg-violet-50 px-2 py-1 text-xs text-violet-700">
                          Mentor message: {nextSession.mentorMessage}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">No mentor message available for this session.</p>
                      )}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No upcoming session in queue.</p>
                  )}

                  {quickActions.map((item) => (
                    <div key={item} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                      {item}
                    </div>
                  ))}
                </>
              )}

              {detailPanel === 'pending' && (
                pendingRequests.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No pending requests.</p>
                ) : (
                  pendingRequests.map((request) => (
                    <div key={request._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-800">{request.displayName}</p>
                      <p className="mt-1 text-xs text-slate-600">{request.sessionOfferId?.title || 'Session request'}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {request.proposedStartAt ? formatDateTime(request.proposedStartAt) : 'Awaiting schedule'}
                      </p>
                    </div>
                  ))
                )
              )}

              {detailPanel === 'recent' && (
                recentActivity.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No recent activity to show yet.</p>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{activity.title}</p>
                        <p className="mt-1 text-xs text-slate-600">{activity.subtitle}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${activity.badgeClass}`}>
                        {activity.badge}
                      </span>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomeSection
