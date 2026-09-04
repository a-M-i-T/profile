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
const SIDE_HYSTERESIS = 0.05
const LEFT_SPAN = 0.36
const DOWN_ENTER = 0.62
const DOWN_LEAVE = 0.5
const UP_ENTER = 0.36
const UP_LEAVE = 0.46
const CENTER_ENTER = 0.14
const CENTER_LEAVE = 0.28

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function easeInOut(t: number) {
  const x = clamp01(t)
  return x < 0.5 ? 2 * x * x : 1 - ((-2 * x + 2) ** 2) / 2
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
    return frameAlongPath(paths.center, 0.5, easeInOut)
  }

  if (pitch.current === "up") {
    const lift = (UP_LEAVE - y) / UP_LEAVE
    if (side.current === "left" || x < 0.5) {
      return frameAlongPath(paths.upLeft, Math.max((0.5 - x) / 0.5, lift), easeInOut)
    }
    return frameAlongPath(paths.upRight, Math.max((x - 0.5) / 0.5, lift), easeInOut)
  }

  if (pitch.current === "down" && (side.current === "left" || x < 0.5)) {
    const across = (0.5 - x) / 0.5
    const drop = (y - DOWN_ENTER) / (1 - DOWN_ENTER)
    return frameAlongPath(paths.downLeft, Math.max(across, drop), easeInOut)
  }

  if (side.current === "left") {
    return frameAlongPath(paths.left, (0.5 - x) / LEFT_SPAN, easeInOut)
  }
  return frameAlongPath(paths.right, (x - 0.5) / 0.5, easeInOut)
}

function frameTime(frame: number, duration: number) {
  return Math.min(duration, Math.max(0, frame / FPS + 1 / FPS / 4))
}

function whenFramePainted(video: HTMLVideoElement, onPaint: () => void) {
  const rvfc = video.requestVideoFrameCallback?.bind(video)
  if (rvfc) {
    const id = rvfc(() => onPaint())
    return () => video.cancelVideoFrameCallback?.(id)
  }
  const id = window.requestAnimationFrame(() => {
    window.requestAnimationFrame(onPaint)
  })
  return () => window.cancelAnimationFrame(id)
}

export function CursorScrubVideo({
  src,
  axis = "horizontal",
  reverse = false,
  trackingArea = "window",
  follow = 3.6,
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
    const onMove = (event: MouseEvent) => {
      updateTargetFromPointer(event.clientX, event.clientY)
    }
    const moveOpts: AddEventListenerOptions = { passive: true, capture: true }
    window.addEventListener("pointermove", onMove, moveOpts)
    window.addEventListener("mousemove", onMove, moveOpts)
    return () => {
      window.removeEventListener("pointermove", onMove, moveOpts)
      window.removeEventListener("mousemove", onMove, moveOpts)
    }
  }, [updateTargetFromPointer])

  useEffect(() => {
    let cancelled = false
    let cancelPaint: (() => void) | null = null
    let seekVideo: HTMLVideoElement | null = null
    let onSeeked: (() => void) | null = null
    let failsafe = 0

    const abortSwap = () => {
      if (seekVideo && onSeeked) seekVideo.removeEventListener("seeked", onSeeked)
      cancelPaint?.()
      if (failsafe) window.clearTimeout(failsafe)
      cancelPaint = null
      seekVideo = null
      onSeeked = null
      failsafe = 0
    }

    const reveal = (index: 0 | 1, frame: number) => {
      const [a, b] = layers()
      if (!a || !b) return
      const front = index === 0 ? a : b
      const back = index === 0 ? b : a
      front.style.opacity = "1"
      front.style.zIndex = "2"
      back.style.opacity = "0"
      back.style.zIndex = "1"
      activeRef.current = index
      shownFrameRef.current = frame
      fadingRef.current = false
      seekingRef.current = false
    }

    const swapTo = (frame: number) => {
      const [a, b] = layers()
      if (!a || !b || cancelled) return
      const duration = durationRef.current
      if (duration <= 0) return

      if (fadingRef.current) {
        queuedTakeRef.current = frame
        return
      }

      if (Math.round(frame) === Math.round(shownFrameRef.current)) return

      const backIndex: 0 | 1 = activeRef.current === 0 ? 1 : 0
      const back = backIndex === 0 ? a : b
      const time = frameTime(frame, duration)

      fadingRef.current = true
      queuedTakeRef.current = null
      let settled = false

      const finish = () => {
        if (settled || cancelled) return
        settled = true
        abortSwap()
        reveal(backIndex, frame)
        const queued = queuedTakeRef.current
        queuedTakeRef.current = null
        if (queued !== null && Math.round(queued) !== Math.round(frame)) {
          swapTo(queued)
        }
      }

      onSeeked = () => {
        if (cancelled) return
        seekVideo?.removeEventListener("seeked", onSeeked!)
        onSeeked = null
        cancelPaint = whenFramePainted(back, finish)
      }
      seekVideo = back
      back.addEventListener("seeked", onSeeked)
      failsafe = window.setTimeout(finish, 400)

      if (Math.abs(back.currentTime - time) < 1 / FPS / 2) {
        onSeeked()
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

      if (front && duration > 0 && primedRef.current && !reduceMotionRef.current) {
        const k = 1 - Math.exp(-follow * dt)
        smoothedXRef.current += (targetXRef.current - smoothedXRef.current) * k
        smoothedYRef.current += (targetYRef.current - smoothedYRef.current) * k

        const lastFrame = Math.max(0, Math.round(duration * FPS) - 1)
        const frame = gazePaths
          ? pickPathFrame(
              smoothedXRef.current,
              smoothedYRef.current,
              gazePaths,
              sideRef,
              pitchRef,
              centerRef,
            )
          : smoothedXRef.current * lastFrame

        if (Math.round(frame) !== Math.round(shownFrameRef.current)) {
          swapTo(frame)
        }
      }

      rafRef.current = window.requestAnimationFrame(tick)
    }

    rafRef.current = window.requestAnimationFrame(tick)
    return () => {
      cancelled = true
      abortSwap()
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [follow, gazePaths])

  const videoClass =
    "absolute inset-0 h-full w-full object-cover object-[center_18%]"

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
        style={{ opacity: 1, zIndex: 2 }}
      />
      <video
        ref={layerBRef}
        src={src}
        muted
        playsInline
        preload="auto"
        disableRemotePlayback
        className={videoClass}
        style={{ opacity: 0, zIndex: 1 }}
      />
      {!isReady ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/50 text-xs text-muted">
          Loading…
        </div>
      ) : null}
    </div>
  )
}
