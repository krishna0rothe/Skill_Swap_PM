const formatDateTime = (value) => {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

const formatMoney = (currency, amount) => `${currency} ${Number(amount || 0).toFixed(2)}`

function WalletSection({ wallet, transactions, mode }) {
  const statusTone = (status) => {
    if (status === 'captured' || status === 'paid' || status === 'authorized') {
      return 'bg-emerald-100 text-emerald-700'
    }

    if (status === 'refunded' || status === 'failed') {
      return 'bg-rose-100 text-rose-700'
    }

    return 'bg-amber-100 text-amber-700'
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50 p-6 shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Wallet Overview</h2>
            <p className="mt-1 text-sm text-slate-600">Track credits, money balances, and recent transaction activity.</p>
          </div>

          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-violet-700">
            Mode: {mode}
          </span>
        </div>

        {!wallet ? (
          <p className="mt-4 rounded-xl bg-white/80 px-3 py-2 text-sm text-slate-600">Wallet data unavailable.</p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-xs text-slate-500">Available Credits</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{wallet.creditBalance}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-xs text-slate-500">Locked Credits</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{wallet.lockedCreditBalance}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-xs text-slate-500">Money Balance</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(wallet.currency, wallet.realMoneyBalance)}</p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4">
              <p className="text-xs text-slate-500">Locked Money</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatMoney(wallet.currency, wallet.lockedMoneyBalance)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-slate-900">Recent Transactions</h3>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
            {transactions?.length || 0}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">Latest wallet-related transaction events for your sessions.</p>

        {!transactions || transactions.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">No transactions found yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {transactions.map((transaction) => {
              const isCredit = transaction.direction === 'credit'
              const amountPrefix = isCredit ? '+' : '-'

              return (
                <div key={transaction._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{transaction.learningSessionTitle || 'Session Transaction'}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {transaction.mode === 'money' ? 'Money transfer' : 'Credits settlement'} • {formatDateTime(transaction.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className={`text-sm font-bold ${isCredit ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {amountPrefix}
                        {transaction.mode === 'money'
                          ? formatMoney(transaction.currency, transaction.amount)
                          : `${Number(transaction.amount || 0)} credits`}
                      </p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-1 text-[10px] font-semibold ${statusTone(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>

                  {transaction.notes ? <p className="mt-2 text-xs text-slate-500">{transaction.notes}</p> : null}
                  {transaction.learningSessionScheduledAt ? (
                    <p className="mt-1 text-[11px] text-slate-500">
                      Session time: {formatDateTime(transaction.learningSessionScheduledAt)}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletSection
