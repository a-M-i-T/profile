import { motion } from "framer-motion"
import { Mail, Phone } from "lucide-react"
import { profile } from "../data"
import { Reveal } from "./Reveal"

function LinkedInIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.94 6.5A1.94 1.94 0 1 1 5 4.56 1.94 1.94 0 0 1 6.94 6.5ZM7 8.89H4v11.1h3Zm4.6 0H8.67v11.1H11.6v-5.8c0-1.53.73-2.45 2.05-2.45 1.23 0 1.85.84 1.85 2.45v5.8H18.5v-6.5c0-3.2-1.72-4.7-4.06-4.7a3.64 3.64 0 0 0-3.28 1.7h-.06V8.89Z" />
    </svg>
  )
}

export function Contact() {
  return (
    <section id="contact" className="relative z-10 min-h-full py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(200,245,71,0.15),transparent_45%),radial-gradient(circle_at_20%_80%,rgba(255,77,46,0.12),transparent_40%)]" />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-coral">Contact</p>
          <h2 className="font-display max-w-3xl text-4xl font-bold leading-tight text-fog md:text-6xl">
            Let’s build something
            <span className="text-lime"> sharp</span> together.
          </h2>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Open to senior PHP full-stack roles. LinkedIn is the best first contact; email works too.
            Flexible on Dallas timezone overlap from Kathmandu.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-12 flex flex-wrap gap-4">
          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-lime px-6 py-4 font-semibold text-ink"
          >
            <LinkedInIcon className="h-5 w-5" />
            LinkedIn
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            href={`mailto:${profile.email}`}
            className="inline-flex items-center gap-3 rounded-full border border-line px-6 py-4 font-semibold text-fog hover:border-lime hover:text-lime"
          >
            <Mail className="h-5 w-5" />
            Email me
          </motion.a>
          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            href={`tel:${profile.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-3 rounded-full border border-line px-6 py-4 font-semibold text-fog hover:border-coral hover:text-coral"
          >
            <Phone className="h-5 w-5" />
            {profile.phone}
          </motion.a>
        </Reveal>
      </div>
    </section>
  )
}
