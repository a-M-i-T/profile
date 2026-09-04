import { useState } from "react"
import { motion } from "framer-motion"
import { experience } from "../data"
import { itemVariants, Reveal, Stagger } from "./Reveal"

function keepsDarkCard(company: string, logo: string) {
  const haystack = `${company} ${logo}`.toLowerCase()
  return haystack.includes("empire") || haystack.includes("aryaitandmedia")
}

function JobLogo({ company, logo }: { company: string; logo: string | null }) {
  const [failed, setFailed] = useState(false)
  const label = company.split(/[\s/]/)[0]

  if (!logo || failed) {
    return (
      <div className="flex h-20 w-28 items-center justify-center rounded-2xl border border-dashed border-line bg-ink-soft px-2 text-center text-[10px] uppercase tracking-wider text-muted">
        {label}
      </div>
    )
  }

  return (
    <div
      className={`flex h-20 w-28 items-center justify-center overflow-hidden rounded-2xl border border-line p-2 ${
        keepsDarkCard(company, logo) ? "bg-ink" : "bg-white"
      }`}
    >
      <img
        src={logo}
        alt={`${company} logo`}
        className="max-h-full max-w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

export function Experience() {
  return (
    <section id="work" className="relative z-10 mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
      <Reveal>
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-coral">Experience</p>
        <h2 className="font-display text-4xl font-bold text-fog md:text-5xl">
          Work that shipped.
        </h2>
      </Reveal>

      <Stagger className="mt-14 space-y-0">
        {experience.map((job, index) => (
          <motion.article
            key={job.company}
            variants={itemVariants}
            className="group relative grid gap-6 border-t border-line py-10 md:grid-cols-[140px_120px_1fr] md:gap-8"
          >
            <div className="text-sm text-muted md:pt-3">{job.period}</div>

            <div className="flex items-start">
              <JobLogo company={job.company} logo={job.logo} />
            </div>

            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-display text-2xl font-bold text-fog transition group-hover:text-lime">
                  {job.company}
                </h3>
                <span className="text-sm text-coral">{job.role}</span>
              </div>
              {job.note ? <p className="mt-1 text-sm text-muted">{job.note}</p> : null}
              {job.summary ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fog/70">{job.summary}</p>
              ) : null}
              <ul className="mt-4 space-y-2">
                {job.points.map((point) => (
                  <li key={point} className="flex gap-3 text-fog/85">
                    <span
                      className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                        index % 2 === 0 ? "bg-lime" : "bg-coral"
                      }`}
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </motion.article>
        ))}
      </Stagger>
    </section>
  )
}
