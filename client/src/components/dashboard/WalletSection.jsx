function WalletSection({ wallet }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
      <h2 className="text-xl font-bold text-slate-900">Wallet</h2>
      <p className="mt-1 text-sm text-slate-600">Credits are locked on request acceptance and settled on session completion.</p>

      {!wallet ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">Wallet data unavailable.</p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Available Credits</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{wallet.creditBalance}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Locked Credits</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{wallet.lockedCreditBalance}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Money Balance</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {wallet.currency} {wallet.realMoneyBalance}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Locked Money</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {wallet.currency} {wallet.lockedMoneyBalance}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletSection
