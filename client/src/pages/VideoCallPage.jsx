import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL } from '../config/api'
import { getToken } from '../utils/authStorage'

function VideoCallPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joinData, setJoinData] = useState(null)

  useEffect(() => {
    const loadJoinInfo = async () => {
      try {
        const token = getToken()
        const apiResponse = await fetch(`${API_BASE_URL}/learning-sessions/${sessionId}/join-info`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const response = await apiResponse.json()

        if (!apiResponse.ok) {
          throw new Error(response.message || 'Failed to get join details')
        }

        setJoinData(response)
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadJoinInfo()
  }, [sessionId])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfcff] text-slate-700">
        <p className="text-sm">Loading call...</p>
      </main>
    )
  }

  if (error || !joinData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#fbfcff] text-slate-700">
        <p className="text-sm text-rose-600">{error || 'Unable to start call'}</p>
        <button
          onClick={() => navigate('/dashboard', { replace: true })}
          className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold"
        >
          Back to dashboard
        </button>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbfcff] px-4 py-8 text-slate-800">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
        <h1 className="text-xl font-bold text-slate-900">Session Join Info</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your session is valid. Video room wiring is intentionally kept minimal for now and can be connected next.
        </p>

        <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm">
          <p>
            <span className="font-semibold">Session ID:</span> {joinData.sessionId}
          </p>
          <p>
            <span className="font-semibold">Role:</span> {joinData.role}
          </p>
          <p>
            <span className="font-semibold">Join Mode:</span> {joinData.joinMode}
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard', { replace: true })}
          className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to dashboard
        </button>
      </div>
    </main>
  )
}

export default VideoCallPage
