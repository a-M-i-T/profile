import { motion, useReducedMotion } from "framer-motion"
import { ArrowDownRight, MapPin } from "lucide-react"
import { profile } from "../data"

function LinkedInIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.94 6.5A1.94 1.94 0 1 1 5 4.56 1.94 1.94 0 0 1 6.94 6.5ZM7 8.89H4v11.1h3Zm4.6 0H8.67v11.1H11.6v-5.8c0-1.53.73-2.45 2.05-2.45 1.23 0 1.85.84 1.85 2.45v5.8H18.5v-6.5c0-3.2-1.72-4.7-4.06-4.7a3.64 3.64 0 0 0-3.28 1.7h-.06V8.89Z" />
    </svg>
  )
}

function GitHubIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.2-3.37-1.2-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94a3.86 3.86 0 0 1 1.03-2.68 3.6 3.6 0 0 1 .1-2.64s.84-.27 2.75 1.02a9.45 9.45 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02a3.6 3.6 0 0 1 .1 2.64 3.86 3.86 0 0 1 1.03 2.68c0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.86v2.76c0 .26.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  )
}

export function Hero() {
  const reduce = useReducedMotion()

  return (
    <section id="top" className="relative z-10 min-h-[100svh] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 mesh opacity-90" />
      <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-lime/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 left-0 h-64 w-64 rounded-full bg-coral/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:justify-center md:px-8 md:pb-24 md:pt-24">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted"
        >
          <MapPin className="h-4 w-4 text-coral" />
          {profile.location} · Open to opportunities
        </motion.p>

        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-[clamp(3.2rem,12vw,7.5rem)] font-extrabold leading-[0.9] tracking-tight text-fog"
        >
          Amit
          <br />
          <span className="text-lime">Arya</span>
        </motion.h1>

        <motion.p
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.65 }}
          className="mt-6 max-w-xl text-lg text-fog/80 md:text-xl"
        >
          {profile.role}. {profile.tagline}
        </motion.p>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <a
            href="#work"
            className="group inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 font-semibold text-white transition hover:scale-[1.03] hover:bg-fog hover:text-ink"
          >
            See my work
            <ArrowDownRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-fog transition hover:border-lime hover:text-lime"
          >
            <LinkedInIcon className="h-4 w-4" /> LinkedIn
          </a>
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-fog transition hover:border-lime hover:text-lime"
          >
            <GitHubIcon className="h-4 w-4" /> GitHub
          </a>
          <a
            href={profile.resume}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-3 text-fog transition hover:border-coral hover:text-coral"
          >
            Resume PDF
          </a>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="mt-16 hidden items-end gap-3 text-xs uppercase tracking-[0.2em] text-muted md:flex"
        >
          <span className="h-px w-10 bg-lime" />
          Scroll
        </motion.div>
      </div>
    </section>
  )
}
