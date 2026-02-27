function PlaceholderSection({ title }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_-38px_rgba(79,70,229,0.45)]">
      <h2 className="text-xl font-bold capitalize text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">This page is ready for the next module implementation.</p>
    </div>
  )
}

export default PlaceholderSection
