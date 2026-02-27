import { Link } from 'react-router-dom'
import { clearToken } from '../utils/authStorage'

function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#fbfcff] px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">Auth and onboarding flow is connected. Feature modules will be added next.</p>
        <div className="mt-5 flex gap-3">
          <Link to="/onboarding" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold">
            Go to onboarding
          </Link>
          <Link
            to="/login"
            onClick={() => clearToken()}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Logout
          </Link>
        </div>
      </div>
    </main>
  )
}

export default DashboardPage
