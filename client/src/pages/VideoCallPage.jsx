import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../shims/eventemitter3-patch'
import { AudioPlayer, MeetingProvider, useMeeting, useParticipant, VideoPlayer } from '@videosdk.live/react-sdk'
import { API_BASE_URL } from '../config/api'
import { getToken } from '../utils/authStorage'

function ParticipantAudio({ participantId }) {
  return (
    <>
      <AudioPlayer participantId={participantId} type="audio" />
      <AudioPlayer participantId={participantId} type="shareAudio" />
    </>
  )
}

function CameraFeed({ participantId, label, compact = false }) {
  const { displayName, webcamOn } = useParticipant(participantId)

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 ${compact ? 'h-28 w-44' : 'h-full w-full'}`}>
      {webcamOn ? (
        <VideoPlayer
          participantId={participantId}
          type="video"
          className="h-full w-full"
          classNameVideo="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-slate-300">Camera off</div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
        <p className="truncate text-xs font-semibold text-white">{label || displayName || 'Participant'}</p>
      </div>
    </div>
  )
}

function ScreenFeed({ presenterId }) {
  const { displayName } = useParticipant(presenterId)

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
      <VideoPlayer
        participantId={presenterId}
        type="share"
        className="h-full w-full"
        classNameVideo="h-full w-full object-contain"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/65 to-transparent px-3 py-2">
        <p className="truncate text-xs font-semibold text-white">{displayName || 'Presenter'} • Sharing screen</p>
      </div>
    </div>
  )
}

function PrimaryStage({ primaryId, localId }) {
  return (
    <div className="relative h-[66vh] rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_14px_32px_-24px_rgba(30,41,59,0.45)]">
      <CameraFeed participantId={primaryId} label={primaryId === localId ? 'You' : undefined} />

      {localId && primaryId !== localId ? (
        <div className="absolute bottom-5 right-5 z-20 rounded-2xl bg-white p-1.5 shadow-[0_14px_28px_-18px_rgba(30,41,59,0.7)]">
          <CameraFeed participantId={localId} label="You" compact />
        </div>
      ) : null}
    </div>
  )
}

function ScreenShareStage({ presenterId, localId, participantIds }) {
  const thumbnailIds = participantIds.filter((id) => id !== presenterId)

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_14px_32px_-24px_rgba(30,41,59,0.45)]">
      <div className="h-[56vh]">
        <ScreenFeed presenterId={presenterId} />
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {thumbnailIds.map((participantId) => (
          <CameraFeed
            key={participantId}
            participantId={participantId}
            label={participantId === localId ? 'You' : undefined}
            compact
          />
        ))}
      </div>
    </div>
  )
}

function MeetingControls({ onLeave }) {
  const { leave, toggleMic, toggleWebcam, toggleScreenShare, localParticipant } = useMeeting()
  const localParticipantId = localParticipant?.id

  const { micOn, webcamOn, screenShareOn } = useParticipant(localParticipantId || '')

  return (
    <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_16px_30px_-18px_rgba(30,41,59,0.45)] backdrop-blur">
      <button
        onClick={() => toggleMic()}
        className={`rounded-xl px-4 py-2 text-sm font-semibold ${micOn ? 'bg-slate-100 text-slate-800' : 'bg-amber-500 text-white'}`}
      >
        {micOn ? 'Mute' : 'Unmute'}
      </button>
      <button
        onClick={() => toggleWebcam()}
        className={`rounded-xl px-4 py-2 text-sm font-semibold ${webcamOn ? 'bg-slate-100 text-slate-800' : 'bg-amber-500 text-white'}`}
      >
        {webcamOn ? 'Stop video' : 'Start video'}
      </button>
      <button
        onClick={() => toggleScreenShare()}
        className={`rounded-xl px-4 py-2 text-sm font-semibold ${screenShareOn ? 'bg-indigo-600 text-white' : 'bg-violet-100 text-violet-700'}`}
      >
        {screenShareOn ? 'Stop presenting' : 'Present now'}
      </button>
      <button
        onClick={() => {
          leave()
          onLeave()
        }}
        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Leave call
      </button>
    </div>
  )
}

function MeetingRoom({ sessionId, onLeave }) {
  const [joined, setJoined] = useState(false)
  const [audioUnlockNeeded, setAudioUnlockNeeded] = useState(false)
  const [micPermissionError, setMicPermissionError] = useState('')
  const lifecycleEndSentRef = useRef(false)

  const sendLifecycleEvent = useCallback(
    async (eventName) => {
      try {
        const token = getToken()
        await fetch(`${API_BASE_URL}/learning-sessions/${sessionId}/lifecycle/${eventName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ eventAt: new Date().toISOString() }),
        })
      } catch (_error) {
        // lifecycle tracking failures should not block call UX
      }
    },
    [sessionId]
  )

  const handleLeaveTracking = useCallback(async () => {
    if (lifecycleEndSentRef.current) {
      return
    }

    lifecycleEndSentRef.current = true
    await sendLifecycleEvent('leave')
    await sendLifecycleEvent('end')
  }, [sendLifecycleEvent])

  const unlockAudioPlayback = useCallback(async () => {
    try {
      const audioNodes = Array.from(document.querySelectorAll('audio'))
      await Promise.all(audioNodes.map((audioNode) => audioNode.play().catch(() => undefined)))
      setAudioUnlockNeeded(false)
    } catch (_error) {
      setAudioUnlockNeeded(true)
    }
  }, [])

  const requestMicrophoneAccess = useCallback(async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setMicPermissionError('Microphone is not supported in this browser.')
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setMicPermissionError('')
      return true
    } catch (_error) {
      setMicPermissionError('Microphone access is blocked. Allow mic in browser site settings and try again.')
      return false
    }
  }, [])

  const { join, participants, presenterId, localParticipant } = useMeeting({
    onMeetingJoined: async () => {
      setJoined(true)
      await sendLifecycleEvent('start')
      await sendLifecycleEvent('join')
      setTimeout(() => {
        unlockAudioPlayback()
      }, 250)
    },
    onMeetingLeft: async () => {
      await handleLeaveTracking()
      onLeave()
    },
  })

  const handleJoin = useCallback(async () => {
    const micGranted = await requestMicrophoneAccess()
    if (!micGranted) {
      setAudioUnlockNeeded(true)
    }

    join()
  }, [join, requestMicrophoneAccess])

  useEffect(() => {
    if (!joined) {
      return
    }

    const retryUnlock = () => {
      unlockAudioPlayback()
    }

    window.addEventListener('click', retryUnlock, { passive: true })
    window.addEventListener('keydown', retryUnlock)

    return () => {
      window.removeEventListener('click', retryUnlock)
      window.removeEventListener('keydown', retryUnlock)
    }
  }, [joined, unlockAudioPlayback])

  const participantIds = useMemo(() => {
    const ids = [...participants.keys()]

    if (localParticipant?.id && !ids.includes(localParticipant.id)) {
      ids.unshift(localParticipant.id)
    }

    return [...new Set(ids)]
  }, [participants, localParticipant])
  const localParticipantId = localParticipant?.id || ''
  const remoteParticipantIds = useMemo(
    () => participantIds.filter((participantId) => participantId !== localParticipantId),
    [participantIds, localParticipantId]
  )

  const primaryParticipantId = useMemo(() => {
    if (participantIds.length === 0) return ''
    const remoteFirst = participantIds.find((id) => id !== localParticipantId)
    return remoteFirst || localParticipantId || participantIds[0]
  }, [participantIds, localParticipantId])

  return (
    <div className="min-h-screen bg-[#fbfcff] px-4 py-5 text-slate-800">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-base font-semibold text-slate-900">Live Meeting</h1>
          {!joined ? (
            <button onClick={handleJoin} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              Join Call
            </button>
          ) : (
            <p className="text-xs text-slate-500">Participants: {participantIds.length}</p>
          )}
        </div>

        {!joined ? (
          <div className="flex h-[65vh] items-center justify-center rounded-3xl border border-slate-200 bg-white text-slate-500">
            Join the meeting to start video call.
          </div>
        ) : (
          <>
            <div className="sr-only" aria-hidden="true">
              {remoteParticipantIds.map((participantId) => (
                <ParticipantAudio key={participantId} participantId={participantId} />
              ))}
            </div>

            {micPermissionError ? (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {micPermissionError}
                <button
                  onClick={requestMicrophoneAccess}
                  className="ml-2 rounded-md bg-rose-600 px-2 py-1 font-semibold text-white"
                >
                  Retry Mic Access
                </button>
              </div>
            ) : null}

            {audioUnlockNeeded ? (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Audio is blocked by browser autoplay policy.
                <button onClick={unlockAudioPlayback} className="ml-2 rounded-md bg-amber-500 px-2 py-1 font-semibold text-white">
                  Enable Audio
                </button>
              </div>
            ) : null}

            {presenterId && participantIds.includes(presenterId) ? (
              <ScreenShareStage presenterId={presenterId} localId={localParticipantId} participantIds={participantIds} />
            ) : (
              <PrimaryStage primaryId={primaryParticipantId} localId={localParticipantId} />
            )}

            <MeetingControls onLeave={handleLeaveTracking} />
          </>
        )}
      </div>
    </div>
  )
}

function VideoCallPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [joinData, setJoinData] = useState(null)
  const [browserIssue, setBrowserIssue] = useState('')

  useEffect(() => {
    const secureContext = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

    if (!secureContext) {
      setBrowserIssue('Camera/microphone require HTTPS (or localhost). Open this app over HTTPS.')
      return
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setBrowserIssue('This browser does not support camera/microphone access for web calls.')
      return
    }

    setBrowserIssue('')
  }, [])

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

  if (browserIssue) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#fbfcff] text-slate-700">
        <p className="max-w-lg text-center text-sm text-rose-600">{browserIssue}</p>
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
    <MeetingProvider
      config={{
        meetingId: joinData.meetingId,
        micEnabled: true,
        webcamEnabled: true,
        name: joinData.displayName,
      }}
      token={joinData.token}
    >
      <MeetingRoom sessionId={sessionId} onLeave={() => navigate('/dashboard', { replace: true })} />
    </MeetingProvider>
  )
}

export default VideoCallPage
