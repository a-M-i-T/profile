import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useSnap } from "../snap/SnapScroll"

const links = [
  { href: "#work", label: "Work" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
]

export function Nav() {
  const { enabled, index } = useSnap()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (enabled) {
      setScrolled(index > 0)
      return
    }
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [enabled, index])

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "border-b border-line bg-ink/80 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <a href="#top" className="font-display text-lg font-bold tracking-tight text-fog">
          Amit<span className="text-lime">.</span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-lime"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            className="rounded-full bg-lime px-4 py-2 text-sm font-semibold text-ink transition hover:scale-[1.03] hover:bg-white"
          >
            Let’s talk
          </a>
        </div>
        <a
          href="#contact"
          className="rounded-full bg-lime px-3 py-1.5 text-sm font-semibold text-ink md:hidden"
        >
          Talk
        </a>
      </nav>
    </motion.header>
  )
}
