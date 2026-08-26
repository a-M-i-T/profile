import gsap from "gsap"
import { Observer } from "gsap/Observer"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

gsap.registerPlugin(Observer)

export const SNAP_SECTIONS = [
  { id: "top", label: "Intro" },
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
] as const

type SnapContextValue = {
  index: number
  enabled: boolean
  goTo: (index: number) => void
  goToId: (id: string) => void
}

const SnapContext = createContext<SnapContextValue | null>(null)

export function useSnap() {
  const ctx = useContext(SnapContext)
  if (!ctx) {
    return {
      index: 0,
      enabled: false,
      goTo: () => {},
      goToId: () => {},
    }
  }
  return ctx
}

function canUseSnap() {
  return (
    window.matchMedia("(min-width: 768px)").matches &&
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

function atBottom(el: HTMLElement) {
  return el.scrollTop + el.clientHeight >= el.scrollHeight - 2
}

function atTop(el: HTMLElement) {
  return el.scrollTop <= 2
}

export function SnapProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(0)
  const [enabled, setEnabled] = useState(false)
  const indexRef = useRef(0)
  const enabledRef = useRef(false)
  const animatingRef = useRef(false)
  const goToRef = useRef<(next: number, direction?: number) => void>(() => {})

  useEffect(() => {
    document.documentElement.classList.toggle("snap-active", enabled)
    return () => document.documentElement.classList.remove("snap-active")
  }, [enabled])

  useLayoutEffect(() => {
    const track = document.querySelector<HTMLElement>(".snap-track")
    if (!track) return

    const panels = () => gsap.utils.toArray<HTMLElement>(".snap-panel")

    const place = (i: number) => {
      gsap.set(track, { y: -i * window.innerHeight })
    }

    const goTo = (next: number, direction?: number) => {
      if (!enabledRef.current) return
      const list = panels()
      if (next < 0 || next >= list.length || next === indexRef.current) return
      if (animatingRef.current) return

      const dir = direction ?? (next > indexRef.current ? 1 : -1)
      animatingRef.current = true

      const incoming = list[next]
      if (incoming) {
        incoming.scrollTop = dir > 0 ? 0 : Math.max(0, incoming.scrollHeight - incoming.clientHeight)
      }

      gsap.to(track, {
        y: -next * window.innerHeight,
        duration: 0.85,
        ease: "power3.inOut",
        overwrite: true,
        onComplete: () => {
          indexRef.current = next
          setIndex(next)
          const id = SNAP_SECTIONS[next]?.id
          if (id) history.replaceState(null, "", `#${id}`)
          gsap.delayedCall(0.45, () => {
            animatingRef.current = false
          })
        },
        onInterrupt: () => {
          animatingRef.current = false
        },
      })
    }

    goToRef.current = goTo

    let observer: Observer | null = null
    let intent = 0

    const bindObserver = () => {
      observer?.kill()
      intent = 0
      observer = Observer.create({
        target: window,
        type: "wheel",
        preventDefault: true,
        tolerance: 12,
        onChangeY: (self) => {
          if (!enabledRef.current || animatingRef.current) return

          const list = panels()
          const panel = list[indexRef.current]
          const delta = self.deltaY

          if (delta > 0 && panel && !atBottom(panel)) {
            panel.scrollTop += delta
            intent = 0
            return
          }
          if (delta < 0 && panel && !atTop(panel)) {
            panel.scrollTop += delta
            intent = 0
            return
          }

          intent += delta
          if (intent > 90) {
            intent = 0
            goTo(indexRef.current + 1, 1)
          } else if (intent < -90) {
            intent = 0
            goTo(indexRef.current - 1, -1)
          }
        },
      })
    }

    const enable = () => {
      enabledRef.current = true
      setEnabled(true)
      place(indexRef.current)
      bindObserver()
    }

    const disable = () => {
      enabledRef.current = false
      setEnabled(false)
      observer?.kill()
      observer = null
      gsap.set(track, { clearProps: "transform" })
    }

    const syncMode = () => {
      if (canUseSnap()) {
        enable()
      } else {
        disable()
      }
    }

    const onKey = (event: KeyboardEvent) => {
      if (!enabledRef.current || animatingRef.current) return
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault()
        goTo(indexRef.current + 1, 1)
      } else if (
        event.key === " " &&
        !(event.target as HTMLElement | null)?.closest("button, a, [role='button']")
      ) {
        event.preventDefault()
        goTo(indexRef.current + 1, 1)
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault()
        goTo(indexRef.current - 1, -1)
      } else if (event.key === "Home") {
        event.preventDefault()
        goTo(0, -1)
      } else if (event.key === "End") {
        event.preventDefault()
        goTo(listLength(), 1)
      }
    }

    const listLength = () => panels().length - 1

    const onClick = (event: MouseEvent) => {
      if (!enabledRef.current) return
      const link = (event.target as HTMLElement | null)?.closest("a[href^='#']")
      if (!link) return
      const id = link.getAttribute("href")?.slice(1)
      if (!id) return
      const next = SNAP_SECTIONS.findIndex((section) => section.id === id)
      if (next < 0) return
      event.preventDefault()
      goTo(next)
    }

    const onNativeScroll = () => {
      if (enabledRef.current) return
      const list = panels()
      let active = 0
      list.forEach((panel, i) => {
        if (panel.getBoundingClientRect().top <= window.innerHeight * 0.4) active = i
      })
      if (indexRef.current !== active) {
        indexRef.current = active
        setIndex(active)
      }
    }

    const hash = window.location.hash.slice(1)
    const hashIndex = SNAP_SECTIONS.findIndex((section) => section.id === hash)
    if (hashIndex >= 0) {
      indexRef.current = hashIndex
      setIndex(hashIndex)
    }

    syncMode()

    const media = [
      window.matchMedia("(min-width: 768px)"),
      window.matchMedia("(pointer: fine)"),
      window.matchMedia("(prefers-reduced-motion: reduce)"),
    ]
    media.forEach((mq) => mq.addEventListener("change", syncMode))
    window.addEventListener("resize", syncMode)
    window.addEventListener("keydown", onKey)
    window.addEventListener("scroll", onNativeScroll, { passive: true })
    document.addEventListener("click", onClick)

    return () => {
      observer?.kill()
      gsap.killTweensOf(track)
      enabledRef.current = false
      setEnabled(false)
      media.forEach((mq) => mq.removeEventListener("change", syncMode))
      window.removeEventListener("resize", syncMode)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("scroll", onNativeScroll)
      document.removeEventListener("click", onClick)
    }
  }, [])

  const goTo = useCallback((next: number) => {
    goToRef.current(next)
  }, [])

  const goToId = useCallback((id: string) => {
    const next = SNAP_SECTIONS.findIndex((section) => section.id === id)
    if (next >= 0) goToRef.current(next)
  }, [])

  const value = useMemo(
    () => ({ index, enabled, goTo, goToId }),
    [index, enabled, goTo, goToId],
  )

  return <SnapContext.Provider value={value}>{children}</SnapContext.Provider>
}

export function SnapViewport({ children }: { children: ReactNode }) {
  return (
    <div className="snap-viewport">
      <div className="snap-track">{children}</div>
    </div>
  )
}

export function SnapDots() {
  const { index, enabled, goTo } = useSnap()

  if (!enabled) return null

  return (
    <nav
      aria-label="Sections"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 md:flex"
    >
      {SNAP_SECTIONS.map((section, i) => (
        <button
          key={section.id}
          type="button"
          aria-label={section.label}
          aria-current={index === i ? "true" : undefined}
          onClick={() => goTo(i)}
          className={`block h-2.5 w-2.5 rounded-full transition ${
            index === i ? "scale-125 bg-lime" : "bg-fog/25 hover:bg-fog/60"
          }`}
        />
      ))}
    </nav>
  )
}
