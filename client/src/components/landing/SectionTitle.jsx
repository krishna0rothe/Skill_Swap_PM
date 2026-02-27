function SectionTitle({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      {eyebrow && (
        <p className="mb-3 inline-flex rounded-full border border-violet-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-600 shadow-sm">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">{subtitle}</p>}
    </div>
  )
}

export default SectionTitle
