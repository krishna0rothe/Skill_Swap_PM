import { useState } from 'react'

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function RoadmapNode({
  node,
  depth = 0,
  isLast = false,
  nodePath = '',
  onUpdateNodeStatus,
  onRequestSession,
  requestingOfferId,
  nodeActionLoading,
}) {
  const [expanded, setExpanded] = useState(depth < 1)
  const hasChildren = Array.isArray(node.children) && node.children.length > 0
  const hasOffers = Array.isArray(node.recommendedOffers) && node.recommendedOffers.length > 0
  const nodeId = String(node?._id || node?.id || '')
  const actionKey = nodeActionLoading?.roadmapId && nodeId ? `${nodeActionLoading.roadmapId}:${nodeId}` : ''
  const isUpdating = Boolean(actionKey && nodeActionLoading?.byKey?.[actionKey])

  const handleUpdateStatus = async (status) => {
    await onUpdateNodeStatus(nodeId, status)
  }

  const handleRequestSession = async (offer) => {
    await onRequestSession(offer)
  }

  return (
    <li className={`relative ${depth > 0 ? 'pl-6' : ''}`}>
      {depth > 0 ? (
        <>
          <div className={`pointer-events-none absolute left-2 top-0 w-px ${isLast ? 'h-6' : 'h-full'} bg-slate-300`} />
          <div className="pointer-events-none absolute left-2 top-6 h-px w-4 bg-slate-300" />
        </>
      ) : null}

      <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                Level {depth + 1}
              </span>
              {nodePath ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
                  Step {nodePath}
                </span>
              ) : null}
              <p className="text-sm font-semibold text-slate-900">{node.title}</p>
            </div>

            {node.description ? <p className="mt-1 text-xs text-slate-600">{node.description}</p> : null}

            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span className="rounded-full bg-slate-100 px-2 py-1">Status: {node.status || 'pending'}</span>
              {Number.isFinite(Number(node.estimatedHours)) ? (
                <span className="rounded-full bg-slate-100 px-2 py-1">{Number(node.estimatedHours)} hrs</span>
              ) : null}
              {Array.isArray(node.skills) && node.skills.length > 0 ? (
                <span className="rounded-full bg-slate-100 px-2 py-1">Skills: {node.skills.join(', ')}</span>
              ) : null}
              {hasChildren ? <span className="rounded-full bg-slate-100 px-2 py-1">Substeps: {node.children.length}</span> : null}
              {hasOffers ? <span className="rounded-full bg-slate-100 px-2 py-1">Offers: {node.recommendedOffers.length}</span> : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => handleUpdateStatus('in_progress')}
                disabled={isUpdating || (node.status || 'pending') === 'in_progress'}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700"
              >
                Mark in progress
              </button>
              <button
                onClick={() => handleUpdateStatus('completed')}
                disabled={isUpdating || (node.status || 'pending') === 'completed'}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700"
              >
                Mark completed
              </button>
              <button
                onClick={() => handleUpdateStatus('pending')}
                disabled={isUpdating || (node.status || 'pending') === 'pending'}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600"
              >
                Reset pending
              </button>
              {isUpdating ? <span className="text-[11px] font-semibold text-violet-600">Updating...</span> : null}
            </div>
          </div>

          {(hasChildren || hasOffers) && (
            <button
              onClick={() => setExpanded((prev) => !prev)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700"
            >
              {expanded ? 'Hide' : 'Show'}
            </button>
          )}
        </div>

        {expanded && hasOffers ? (
          <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50 p-2">
            <p className="text-xs font-semibold text-violet-700">Recommended offers</p>
            <div className="mt-2 space-y-2">
              {node.recommendedOffers.map((offer) => (
                <div key={`${node._id}-${offer.offerId}`} className="rounded-md border border-violet-100 bg-white p-2 text-xs">
                  <p className="font-semibold text-slate-800">{offer.title || 'Offer'}</p>
                  <p className="text-slate-600">Mentor: {offer.mentorName || 'Unknown'}</p>
                  <p className="text-slate-500">
                    Match: {Math.round((offer.matchScore || 0) * 100)}% · Rating: {offer.averageRating || 0}
                  </p>
                  <div className="mt-2">
                    <button
                      onClick={() => handleRequestSession(offer)}
                      disabled={requestingOfferId === offer.offerId}
                      className="rounded-lg bg-violet-600 px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
                    >
                      {requestingOfferId === offer.offerId ? 'Requesting...' : 'Start session'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {expanded && hasChildren ? (
          <ul className="mt-3 space-y-3">
            {node.children.map((child, childIndex) => (
              <RoadmapNode
                key={child._id || `${node._id}-${child.title}`}
                node={child}
                depth={depth + 1}
                isLast={childIndex === node.children.length - 1}
                nodePath={nodePath ? `${nodePath}.${childIndex + 1}` : `${childIndex + 1}`}
                onUpdateNodeStatus={onUpdateNodeStatus}
                onRequestSession={onRequestSession}
                requestingOfferId={requestingOfferId}
                nodeActionLoading={nodeActionLoading}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  )
}

function RoadmapSection({
  roadmaps,
  loading,
  generating,
  onGenerateRoadmap,
  onRefreshRoadmaps,
  onUpdateNodeStatus,
  onRequestSession,
  requestingOfferId,
  onChatMessage,
  chatLoading,
  nodeActionLoading,
}) {
  const [input, setInput] = useState('')
  const [expandedRoadmapIds, setExpandedRoadmapIds] = useState({})
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: 'Share your goal, current level, and timeline. I can help refine it before you generate a roadmap.',
      suggestedPrompt: '',
    },
  ])

  const toggleRoadmap = (roadmapId) => {
    setExpandedRoadmapIds((prev) => ({
      ...prev,
      [roadmapId]: !prev[roadmapId],
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) {
      window.alert('Please describe your learning goal')
      return
    }

    await onGenerateRoadmap(trimmed)
    setInput('')
  }

  const handleSendChat = async (event) => {
    event.preventDefault()
    const trimmed = chatInput.trim()
    if (!trimmed) {
      return
    }

    setChatMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setChatInput('')

    const result = await onChatMessage(trimmed)

    if (result) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.reply,
          suggestedPrompt: result.suggestedPrompt || '',
        },
      ])
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Roadmap assistant</h2>
        <p className="mt-1 text-xs text-slate-600">Chat to refine your plan before generating roadmap steps.</p>

        <div className="mt-3 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3">
          {chatMessages.map((chat, index) => (
            <div
              key={`${chat.role}-${index}`}
              className={`rounded-lg px-3 py-2 text-xs ${chat.role === 'user' ? 'bg-violet-600 text-white' : 'bg-white text-slate-700'}`}
            >
              <p>{chat.content}</p>
              {chat.suggestedPrompt ? (
                <button
                  onClick={() => setInput(chat.suggestedPrompt)}
                  className="mt-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700"
                >
                  Use suggested prompt
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <form onSubmit={handleSendChat} className="mt-3 flex gap-2">
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Ask: What should I focus on first for data science in 3 months?"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-violet-300"
          />
          <button
            type="submit"
            disabled={chatLoading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {chatLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Generate roadmap</h2>
        <p className="mt-1 text-xs text-slate-600">Type your goal in natural language. Example: I want to become a MERN developer in 4 months.</p>

        <form className="mt-3 space-y-3" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={4}
            placeholder="Describe your goal, current level, and timeline"
            className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:border-violet-300"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={generating}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {generating ? 'Generating...' : 'Generate roadmap'}
            </button>
            <button
              type="button"
              onClick={onRefreshRoadmaps}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              Refresh
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Your roadmaps</h3>
          <span className="text-xs text-slate-500">{roadmaps?.length || 0} total</span>
        </div>

        {loading ? <p className="text-sm text-slate-600">Loading roadmaps...</p> : null}

        {!loading && (!roadmaps || roadmaps.length === 0) ? (
          <p className="text-sm text-slate-600">No roadmap yet. Generate your first one above.</p>
        ) : null}

        {!loading && Array.isArray(roadmaps) && roadmaps.length > 0 ? (
          <div className="space-y-3">
            {roadmaps.map((roadmap) => {
              const isExpanded = Boolean(expandedRoadmapIds[roadmap._id])

              return (
                <div key={roadmap._id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{roadmap.title}</p>
                      <p className="mt-1 text-xs text-slate-600">Goal: {roadmap.goal}</p>
                      <p className="mt-1 text-xs text-slate-500">Last updated: {formatDateTime(roadmap.updatedAt)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Progress: {roadmap.progress?.completedNodes || 0}/{roadmap.progress?.totalNodes || 0} (
                        {roadmap.progress?.percent || 0}%)
                      </p>
                    </div>

                    <button
                      onClick={() => toggleRoadmap(roadmap._id)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                    >
                      {isExpanded ? 'Hide roadmap' : 'View roadmap'}
                    </button>
                  </div>

                  {isExpanded ? (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tree View</p>
                      <ul className="space-y-3">
                        {(roadmap.nodes || []).map((node, nodeIndex) => (
                          <RoadmapNode
                            key={node._id || node.title}
                            node={node}
                            isLast={nodeIndex === (roadmap.nodes || []).length - 1}
                            nodePath={`${nodeIndex + 1}`}
                            onUpdateNodeStatus={(nodeId, status) => onUpdateNodeStatus(roadmap._id, nodeId, status)}
                            onRequestSession={onRequestSession}
                            requestingOfferId={requestingOfferId}
                            nodeActionLoading={{ roadmapId: String(roadmap._id), byKey: nodeActionLoading || {} }}
                          />
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default RoadmapSection
