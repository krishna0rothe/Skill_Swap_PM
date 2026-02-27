import { motion } from 'framer-motion'

function FeatureCard({ title, description, icon }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="rounded-[1.1rem] bg-gradient-to-br from-sky-100 via-white to-violet-100 p-[1px] shadow-[0_12px_30px_-22px_rgba(79,70,229,0.45)]"
    >
      <div className="rounded-[1rem] border border-white bg-white p-5">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 to-violet-100 text-lg">
          {icon}
        </div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
    </motion.article>
  )
}

export default FeatureCard
