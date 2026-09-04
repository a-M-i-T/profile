import { useCallback, useEffect, useRef, useState } from "react"

type Axis = "horizontal" | "vertical"
type TrackingArea = "component" | "window"
type GazePath = { start: number; end: number }
type GazePaths = {
  center: GazePath
  left: GazePath
  right: GazePath
  down: GazePath
  downLeft: GazePath
  upRight: GazePath
  upLeft: GazePath
}

type CursorScrubVideoProps = {
  src: string
  axis?: Axis
  reverse?: boolean
  trackingArea?: TrackingArea
  follow?: number
  gazePaths?: GazePaths
  className?: string
}

const FPS = 24
const FADE_MS = 80
const SIDE_HYSTERESIS = 0.028
const LEFT_SPAN = 0.36
const DOWN_ENTER = 0.62
const DOWN_LEAVE = 0.5
const UP_ENTER = 0.36
const UP_LEAVE = 0.46
const CENTER_ENTER = 0.14
const CENTER_LEAVE = 0.22

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function easeOut(t: number) {
  const x = clamp01(t)
  return 1 - (1 - x) * (1 - x)
}

function takeOf(frame: number) {
  if (frame >= 0 && frame <= 16) return "center"
  if (frame >= 24 && frame <= 64) return "upRight"
  if (frame >= 65 && frame <= 82) return "upLeft"
  if (frame >= 116 && frame <= 130) return "right"
  if (frame >= 98 && frame <= 115) return "down"
  if (frame >= 150 && frame <= 172) return "left"
  if (frame >= 173 && frame <= 204) return "downLeft"
  return "other"
}

function sameTake(a: number, b: number) {
  const left = takeOf(a)
  return left !== "other" && left === takeOf(b)
}

function frameAlongPath(path: GazePath, t: number, ease: (t: number) => number) {
  return path.start + ease(clamp01(t)) * (path.end - path.start)
}

function pickPathFrame(
  x: number,
  y: number,
  paths: GazePaths,
  side: { current: "left" | "right" },
  pitch: { current: "up" | "level" | "down" },
  center: { current: boolean },
) {
  const fromCenter = Math.hypot(x - 0.5, y - 0.5)
  if (fromCenter < CENTER_ENTER) center.current = true
  else if (fromCenter > CENTER_LEAVE) center.current = false

  if (x < 0.5 - SIDE_HYSTERESIS) side.current = "left"
  else if (x > 0.5 + SIDE_HYSTERESIS) side.current = "right"

  if (y < UP_ENTER) pitch.current = "up"
  else if (y > DOWN_ENTER) pitch.current = "down"
  else if (pitch.current === "up" && y > UP_LEAVE) pitch.current = "level"
  else if (pitch.current === "down" && y < DOWN_LEAVE) pitch.current = "level"

  if (center.current && paths.center) {
    return frameAlongPath(paths.center, 0.5, easeOut)
  }

  if (pitch.current === "up") {
    const lift = (UP_LEAVE - y) / UP_LEAVE
    if (side.current === "left" || x < 0.5) {
      return frameAlongPath(paths.upLeft, Math.max((0.5 - x) / 0.5, lift), easeOut)
    }
    return frameAlongPath(paths.upRight, Math.max((x - 0.5) / 0.5, lift), easeOut)
  }

  if (pitch.current === "down" && (side.current === "left" || x < 0.5)) {
    const across = (0.5 - x) / 0.5
    const drop = (y - DOWN_ENTER) / (1 - DOWN_ENTER)
    return frameAlongPath(paths.downLeft, Math.max(across, drop), easeOut)
  }

  if (side.current === "left") {
    return frameAlongPath(paths.left, (0.5 - x) / LEFT_SPAN, easeOut)
  }
  return frameAlongPath(paths.right, (x - 0.5) / 0.5, easeOut)
}

function frameTime(frame: number, duration: number) {
  return Math.min(duration, Math.max(0, frame / FPS + 1 / FPS / 4))
}

export function CursorScrubVideo({
  src,
  axis = "horizontal",
  reverse = false,
  trackingArea = "window",
  follow = 8,
  gazePaths,
  className = "",
}: CursorScrubVideoProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const layerARef = useRef<HTMLVideoElement | null>(null)
  const layerBRef = useRef<HTMLVideoElement | null>(null)
  const activeRef = useRef<0 | 1>(0)
  const targetXRef = useRef(0.5)
  const targetYRef = useRef(0.5)
  const smoothedXRef = useRef(0.5)
  const smoothedYRef = useRef(0.5)
  const shownFrameRef = useRef(8)
  const durationRef = useRef(0)
  const lastTickRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const fadingRef = useRef(false)
  const seekingRef = useRef(false)
  const queuedTakeRef = useRef<number | null>(null)
  const sideRef = useRef<"left" | "right">("right")
  const pitchRef = useRef<"up" | "level" | "down">("level")
  const centerRef = useRef(true)
  const reduceMotionRef = useRef(false)
  const primedRef = useRef(false)
  const [isReady, setIsReady] = useState(false)

  const layers = () => [layerARef.current, layerBRef.current] as const

  const updateTargetFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (reduceMotionRef.current) return
      const root = rootRef.current
      const clamp = (value: number) => Math.max(0, Math.min(1, value))

      if (gazePaths && root) {
        const rect = root.getBoundingClientRect()
        const localX = rect.width > 0 ? (clientX - rect.left) / rect.width : 0.5
        const localY = rect.height > 0 ? (clientY - rect.top) / rect.height : 0.5
        targetXRef.current = reverse ? 1 - clamp(localX) : clamp(localX)
        targetYRef.current = clamp(localY)
        return
      }

      const readAxis = (horizontal: boolean) => {
        if (trackingArea === "window") {
          const denom = horizontal ? window.innerWidth : window.innerHeight
          const raw = horizontal ? clientX : clientY
          return denom > 0 ? raw / denom : 0.5
        }
        if (!root) return 0.5
        const rect = root.getBoundingClientRect()
        const size = horizontal ? rect.width : rect.height
        const raw = horizontal ? clientX - rect.left : clientY - rect.top
        return size > 0 ? raw / size : 0.5
      }

      let x = clamp(readAxis(true))
      const y = clamp(readAxis(false))
      if (reverse) x = 1 - x
      targetXRef.current = axis === "horizontal" ? x : y
      targetYRef.current = 0.5
    },
    [axis, gazePaths, reverse, trackingArea],
  )

  useEffect(() => {
    reduceMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
  }, [])

  useEffect(() => {
    const a = layerARef.current
    const b = layerBRef.current
    if (!a || !b) return

    setIsReady(false)
    shownFrameRef.current = 8
    targetXRef.current = 0.5
    targetYRef.current = 0.5
    smoothedXRef.current = 0.5
    smoothedYRef.current = 0.5
    activeRef.current = 0
    fadingRef.current = false
    seekingRef.current = false
    queuedTakeRef.current = null
    primedRef.current = false
    sideRef.current = "right"
    pitchRef.current = "level"
    centerRef.current = true
    a.style.opacity = "1"
    b.style.opacity = "0"

    let primed = false
    const onReady = () => {
      const duration = a.duration || b.duration
      if (primed || !Number.isFinite(duration) || duration <= 0) return
      primed = true
      durationRef.current = duration
      const rest = frameTime(8, duration)
      const prime = (video: HTMLVideoElement) => {
        video
          .play()
          .then(() => {
            video.pause()
            video.currentTime = rest
            primedRef.current = true
            setIsReady(true)
          })
          .catch(() => {
            video.pause()
            video.currentTime = rest
            primedRef.current = true
            setIsReady(true)
          })
      }
      prime(a)
      prime(b)
    }

    a.addEventListener("loadedmetadata", onReady)
    b.addEventListener("loadedmetadata", onReady)
    a.addEventListener("canplay", onReady)
    b.addEventListener("canplay", onReady)
    if (a.readyState >= 1 || b.readyState >= 1) onReady()

    return () => {
      a.pause()
      b.pause()
      a.removeEventListener("loadedmetadata", onReady)
      b.removeEventListener("loadedmetadata", onReady)
      a.removeEventListener("canplay", onReady)
      b.removeEventListener("canplay", onReady)
    }
  }, [src])

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      updateTargetFromPointer(event.clientX, event.clientY)
    }
    window.addEventListener("pointermove", onMove, { passive: true, capture: true })
    window.addEventListener("mousemove", onMove, { passive: true, capture: true })
    return () => {
      window.removeEventListener("pointermove", onMove, { capture: true })
      window.removeEventListener("mousemove", onMove, { capture: true })
    }
  }, [updateTargetFromPointer])

  useEffect(() => {
    const showLayer = (index: 0 | 1, frame: number) => {
      const [a, b] = layers()
      if (!a || !b) return
      const front = index === 0 ? a : b
      const back = index === 0 ? b : a
      front.style.opacity = "1"
      back.style.opacity = "0"
      activeRef.current = index
      shownFrameRef.current = frame
      fadingRef.current = false
    }

    const crossfadeTo = (frame: number) => {
      const [a, b] = layers()
      if (!a || !b) return
      const duration = durationRef.current
      if (duration <= 0 || fadingRef.current) {
        queuedTakeRef.current = frame
        return
      }

      const backIndex: 0 | 1 = activeRef.current === 0 ? 1 : 0
      const back = backIndex === 0 ? a : b
      const time = frameTime(frame, duration)

      fadingRef.current = true
      queuedTakeRef.current = null
      let settled = false

      const finish = () => {
        if (settled) return
        settled = true
        back.removeEventListener("seeked", finish)
        window.clearTimeout(failsafe)
        showLayer(backIndex, frame)
        const queued = queuedTakeRef.current
        queuedTakeRef.current = null
        if (queued !== null && !sameTake(queued, frame)) {
          window.requestAnimationFrame(() => crossfadeTo(queued))
        }
      }

      const failsafe = window.setTimeout(finish, 280)
      back.addEventListener("seeked", finish)
      back.pause()
      if (Math.abs(back.currentTime - time) < 0.01) {
        finish()
      } else {
        back.currentTime = time
      }
    }

    const tick = (now: number) => {
      const [a, b] = layers()
      const front = activeRef.current === 0 ? a : b
      const duration = durationRef.current
      const last = lastTickRef.current || now
      lastTickRef.current = now
      const dt = Math.min(0.05, (now - last) / 1000)

      if (
        front &&
        duration > 0 &&
        primedRef.current &&
        !reduceMotionRef.current
      ) {
        const headingLeft = Boolean(gazePaths) && targetXRef.current < 0.48
        const headingDown = Boolean(gazePaths) && targetYRef.current > DOWN_ENTER
        const headingUp = Boolean(gazePaths) && targetYRef.current < UP_ENTER
        const followNow =
          follow + (headingLeft ? 4 : 0) + (headingDown || headingUp ? 3 : 0)
        const k = 1 - Math.exp(-followNow * dt)
        smoothedXRef.current += (targetXRef.current - smoothedXRef.current) * k
        smoothedYRef.current += (targetYRef.current - smoothedYRef.current) * k

        const lastFrame = Math.max(0, Math.round(duration * FPS) - 1)
        const useRaw = headingDown || headingUp
        const frame = gazePaths
          ? pickPathFrame(
              useRaw ? targetXRef.current : smoothedXRef.current,
              useRaw ? targetYRef.current : smoothedYRef.current,
              gazePaths,
              sideRef,
              pitchRef,
              centerRef,
            )
          : smoothedXRef.current * lastFrame

        const shown = shownFrameRef.current
        const takeChanged = Boolean(gazePaths) && !sameTake(frame, shown)

        if (takeChanged) {
          if (!fadingRef.current) crossfadeTo(frame)
          else queuedTakeRef.current = frame
        } else if (!fadingRef.current && !seekingRef.current) {
          const goal = frameTime(frame, duration)
          const frameMoved = Math.round(frame) !== Math.round(shown)
          if (frameMoved && Math.abs(front.currentTime - goal) > 1 / FPS) {
            seekingRef.current = true
            const done = () => {
              seekingRef.current = false
              front.removeEventListener("seeked", done)
            }
            front.addEventListener("seeked", done)
            window.setTimeout(done, 120)
            front.currentTime = goal
          }
          shownFrameRef.current = frame
        }
      }

      rafRef.current = window.requestAnimationFrame(tick)
    }

    rafRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [follow, gazePaths])

  const videoClass =
    "absolute inset-0 h-full w-full object-cover object-[center_18%] transition-opacity ease-out"
  const videoStyle = { transitionDuration: `${FADE_MS}ms` } as const

  return (
    <div ref={rootRef} className={`relative h-full w-full overflow-hidden bg-ink ${className}`}>
      <video
        ref={layerARef}
        src={src}
        muted
        playsInline
        preload="auto"
        disableRemotePlayback
        className={videoClass}
        style={{ ...videoStyle, opacity: 1 }}
      />
      <video
        ref={layerBRef}
        src={src}
        muted
        playsInline
        preload="auto"
        disableRemotePlayback
        className={videoClass}
        style={{ ...videoStyle, opacity: 0 }}
      />
      {!isReady ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/50 text-xs text-muted">
          Loading…
        </div>
      ) : null}
    </div>
  )
}
