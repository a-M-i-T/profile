import { motion } from "framer-motion"
import { skills } from "../data"
import { itemVariants, Reveal, Stagger } from "./Reveal"

const groups = [
  { title: "Billing & integrations", items: skills.billing, tone: "lime" },
  { title: "Backend / PHP", items: skills.backend, tone: "coral" },
  { title: "Database & caching", items: skills.database, tone: "lime" },
  { title: "Frontend", items: skills.frontend, tone: "coral" },
  { title: "Security & infra", items: skills.security, tone: "lime" },
  { title: "Workflow", items: skills.workflow, tone: "coral" },
] as const

export function Skills() {
  return (
    <section id="skills" className="relative z-10 min-h-full border-y border-line bg-ink-soft py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-lime">Skills</p>
          <h2 className="font-display max-w-2xl text-4xl font-bold text-fog md:text-5xl">
            Lean stack. Deep fundamentals.
          </h2>
        </Reveal>

        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <motion.div
              key={group.title}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="rounded-3xl border border-line bg-ink/70 p-6 transition hover:border-fog/25"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="font-display text-lg font-bold text-fog">{group.title}</h3>
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                    group.tone === "lime" ? "bg-lime" : "bg-coral"
                  }`}
                />
              </div>
              <ul className="space-y-2">
                {group.items.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-xl border border-line/70 px-3 py-2 text-sm text-fog/85 transition hover:border-lime hover:text-lime"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
