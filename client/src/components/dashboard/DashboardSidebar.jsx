import SkillSwapLogo from '../common/SkillSwapLogo'

function DashboardSidebar({ activeSection, onChangeSection, user, onLogout }) {
  const sidebarItems = ['home', 'sessions', 'discover', 'wallet']

  return (
    <aside className="border-r border-slate-200/70 bg-white/90 p-5">
      <div className="mb-8 inline-flex">
        <SkillSwapLogo />
      </div>

      <nav className="space-y-2">
        {sidebarItems.map((item) => (
          <button
            key={item}
            onClick={() => onChangeSection(item)}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium capitalize transition ${
              activeSection === item ? 'bg-violet-50 font-semibold text-violet-700' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      <div className="mt-10 border-t border-slate-100 pt-4">
        <button
          onClick={() => onChangeSection('settings')}
          className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
            activeSection === 'settings' ? 'bg-violet-50 font-semibold text-violet-700' : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          Settings
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-3">
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <p className="text-sm font-semibold text-slate-800">{user?.username || 'User'}</p>
        <p className="text-xs text-slate-500">{user?.email || ''}</p>
      </div>

      <button
        onClick={onLogout}
        className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
      >
        Logout
      </button>
    </aside>
  )
}

export default DashboardSidebar
