import { AnimatePresence, motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"
import { hobbyProjects, projects, type Project, type ProjectType } from "../data"
import { itemVariants, Reveal, Stagger } from "./Reveal"

const filters: { id: ProjectType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "apps", label: "Apps" },
  { id: "cms", label: "CMS" },
  { id: "ec", label: "Ecommerce" },
  { id: "plugins", label: "Plugins" },
]

function ProjectFrame({
  href,
  children,
}: {
  href?: string
  children: ReactNode
}) {
  const className =
    "group block overflow-hidden rounded-[1.75rem] border border-line bg-ink transition hover:border-fog/30"

  if (href) {
    return (
      <motion.a
        layout
        variants={itemVariants}
        whileHover={{ y: -6 }}
        href={href}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {children}
      </motion.a>
    )
  }

  return (
    <motion.article layout variants={itemVariants} whileHover={{ y: -6 }} className={className}>
      {children}
    </motion.article>
  )
}

function ProjectCard({
  project,
  index,
  kicker,
}: {
  project: Project
  index: number
  kicker?: string
}) {
  return (
    <ProjectFrame href={project.href ?? undefined}>
      <div className="relative aspect-[16/10] overflow-hidden bg-ink-soft">
        {project.image ? (
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className={`flex h-full w-full items-end p-6 ${
              project.accent === "lime"
                ? "bg-gradient-to-br from-lime/30 via-ink to-ink"
                : "bg-gradient-to-br from-coral/30 via-ink to-ink"
            }`}
          >
            <p className="font-display text-4xl font-bold text-fog/90">{project.title}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent opacity-80" />
        {project.href ? (
          <span
            className={`absolute right-4 top-4 rounded-full p-2 ${
              project.accent === "lime" ? "bg-lime text-ink" : "bg-coral text-white"
            }`}
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        ) : null}
      </div>

      <div className="p-6">
        <p className="font-display text-xs uppercase tracking-[0.18em] text-muted">
          {String(index + 1).padStart(2, "0")} · {kicker ?? project.type}
        </p>
        <h3 className="mt-2 font-display text-2xl font-bold text-fog">{project.title}</h3>
        <p className="mt-2 text-sm text-muted">{project.blurb}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <span
              key={tech}
              className="rounded-full border border-line px-3 py-1 text-xs text-fog/80"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </ProjectFrame>
  )
}

export function Projects() {
  const [filter, setFilter] = useState<ProjectType>("all")

  const visible = useMemo(
    () => (filter === "all" ? projects : projects.filter((p) => p.type === filter)),
    [filter],
  )

  return (
    <section id="projects" className="relative z-10 min-h-full border-y border-line bg-ink-soft py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal>
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-lime">Projects</p>
          <h2 className="font-display text-4xl font-bold text-fog md:text-5xl">
            Selected work.
          </h2>
        </Reveal>

        <Reveal delay={0.05} className="mt-8 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === item.id
                  ? "bg-lime text-ink"
                  : "border border-line text-muted hover:border-lime hover:text-lime"
              }`}
            >
              {item.label}
            </button>
          ))}
        </Reveal>

        <AnimatePresence mode="popLayout">
          <Stagger className="mt-10 grid gap-5 md:grid-cols-2">
            {visible.map((project, i) => (
              <ProjectCard key={project.title} project={project} index={i} />
            ))}
          </Stagger>
        </AnimatePresence>

        <Reveal className="mt-20">
          <p className="mb-3 text-sm uppercase tracking-[0.2em] text-coral">Side work</p>
          <h2 className="font-display text-4xl font-bold text-fog md:text-5xl">
            Hobby projects.
          </h2>
        </Reveal>

        <Stagger className="mt-10 grid gap-5 md:grid-cols-2">
          {hobbyProjects.map((project, i) => (
            <ProjectCard key={project.title} project={project} index={i} kicker="hobby" />
          ))}
        </Stagger>
      </div>
    </section>
  )
}
