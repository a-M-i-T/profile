import { motion } from "framer-motion"
import { profile } from "../data"
import { Reveal } from "./Reveal"

export function About() {
  return (
    <section id="about" className="relative z-10 mx-auto max-w-6xl px-5 py-24 md:px-8 md:py-32">
      <div className="grid items-center gap-12 md:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-coral">About</p>
          <h2 className="font-display text-4xl font-bold leading-tight text-fog md:text-5xl">
            Architecture-first.
            <span className="text-lime"> Security-minded.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">
            {profile.about}
          </p>
          <ul className="mt-8 space-y-3">
            {profile.highlights.map((item, i) => (
              <li key={item} className="flex gap-3 text-sm text-fog/85 md:text-base">
                <span
                  className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                    i % 2 === 0 ? "bg-lime" : "bg-coral"
                  }`}
                />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1} className="relative">
          <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-lime/30 via-transparent to-coral/30 blur-xl" />
          <motion.div
            whileHover={{ rotate: -1.5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative overflow-hidden rounded-[1.75rem] border border-line bg-ink-soft"
          >
            <img
              src={profile.photo}
              alt="Amit Arya"
              className="aspect-[4/5] w-full object-cover grayscale transition duration-500 hover:grayscale-0"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/60 to-transparent p-6">
              <p className="font-display text-2xl font-bold text-fog">10+ years</p>
              <p className="text-sm text-muted">PHP · MySQL · Full-stack delivery</p>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  )
}
