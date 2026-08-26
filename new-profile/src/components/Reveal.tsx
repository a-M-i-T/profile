import { motion, useReducedMotion, type Variants } from "framer-motion"
import type { ReactNode } from "react"

const ease = [0.22, 1, 0.36, 1] as const

const variants: Variants = {
  hidden: { y: 20, opacity: 1 },
  show: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease },
  },
}

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  )
}

export function Stagger({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}

export const itemVariants: Variants = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0 },
}
