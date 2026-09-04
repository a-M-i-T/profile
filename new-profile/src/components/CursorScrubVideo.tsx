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
const SIDE_HYSTERESIS = 0.07
const LEFT_SPAN = 0.36
const DOWN_ENTER = 0.62
const DOWN_LEAVE = 0.5
const UP_ENTER = 0.36
const UP_LEAVE = 0.46
const CENTER_ENTER = 0.16
const CENTER_LEAVE = 0.34
const TAKE_DWELL_MS = 40
const SCRUB_FOLLOW = 14
const NEAR_FRAMES = 12

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function frameAlongPath(path: GazePath, t: number) {
  return path.start + clamp01(t) * (path.end - path.start)
}

function takeOf(frame: number) {
  if (frame >= 0 && frame <= 16) return "center"
  if (frame >= 24 && frame <= 64) return "upRight"
  if (frame >= 65 && frame <= 82) return "upLeft"
  if (frame >= 98 && frame <= 115) return "down"
  if (frame >= 116 && frame <= 130) return "right"
  if (frame >= 150 && frame <= 172) return "left"
  if (frame >= 173 && frame <= 204) return "downLeft"
  return "other"
}

function canLerp(a: number, b: number) {
  const left = takeOf(a)
  return (left !== "other" && left === takeOf(b)) || Math.abs(a - b) <= NEAR_FRAMES
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
    return frameAlongPath(paths.center, 0.5)
  }

  if (pitch.current === "up") {
    const lift = (UP_LEAVE - y) / UP_LEAVE
    if (side.current === "left" || x < 0.5) {
      return frameAlongPath(paths.upLeft, Math.max((0.5 - x) / 0.5, lift))
    }
    return frameAlongPath(paths.upRight, Math.max((x - 0.5) / 0.5, lift))
  }

  if (pitch.current === "down" && (side.current === "left" || x < 0.5)) {
    const across = (0.5 - x) / 0.5
    const drop = (y - DOWN_ENTER) / (1 - DOWN_ENTER)
    return frameAlongPath(paths.downLeft, Math.max(across, drop))
  }

  if (side.current === "left") {
    return frameAlongPath(paths.left, (0.5 - x) / LEFT_SPAN)
  }
  return frameAlongPath(paths.right, (x - 0.5) / 0.5)
}

function frameTime(frame: number, duration: number) {
  return Math.min(duration, Math.max(0, frame / FPS + 1 / FPS / 4))
}

export function CursorScrubVideo({
  src,
  axis = "horizontal",
  reverse = false,
  trackingArea = "window",
  follow = 7.5,
  gazePaths,
  className = "",
}: CursorScrubVideoProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const targetXRef = useRef(0.5)
  const targetYRef = useRef(0.5)
  const smoothedXRef = useRef(0.5)
  const smoothedYRef = useRef(0.5)
  const playheadRef = useRef(8)
  const heldGoalRef = useRef(8)
  const pendingTakeRef = useRef<string | null>(null)
  const pendingSinceRef = useRef(0)
  const durationRef = useRef(0)
  const lastTickRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const seekingRef = useRef(false)
  const queuedTimeRef = useRef<number | null>(null)
  const sideRef = useRef<"left" | "right">("right")
  const pitchRef = useRef<"up" | "level" | "down">("level")
  const centerRef = useRef(true)
  const reduceMotionRef = useRef(false)
  const primedRef = useRef(false)
  const [isReady, setIsReady] = useState(false)

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
    const video = videoRef.current
    if (!video) return

    setIsReady(false)
    playheadRef.current = 8
    heldGoalRef.current = 8
    targetXRef.current = 0.5
    targetYRef.current = 0.5
    smoothedXRef.current = 0.5
    smoothedYRef.current = 0.5
    seekingRef.current = false
    queuedTimeRef.current = null
    primedRef.current = false
    pendingTakeRef.current = null
    pendingSinceRef.current = 0
    sideRef.current = "right"
    pitchRef.current = "level"
    centerRef.current = true

    let primed = false
    const onReady = () => {
      const duration = video.duration
      if (primed || !Number.isFinite(duration) || duration <= 0) return
      primed = true
      durationRef.current = duration
      const rest = frameTime(8, duration)
      const finishPrime = () => {
        video.pause()
        video.currentTime = rest
        primedRef.current = true
        setIsReady(true)
      }
      video.play().then(finishPrime).catch(finishPrime)
    }

    video.addEventListener("loadedmetadata", onReady)
    video.addEventListener("canplay", onReady)
    if (video.readyState >= 1) onReady()

    return () => {
      video.pause()
      video.removeEventListener("loadedmetadata", onReady)
      video.removeEventListener("canplay", onReady)
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
    let onSeeked: (() => void) | null = null
    let failsafe = 0

    const clearSeekWait = () => {
      const video = videoRef.current
      if (video && onSeeked) video.removeEventListener("seeked", onSeeked)
      if (failsafe) window.clearTimeout(failsafe)
      onSeeked = null
      failsafe = 0
    }

    const applySeek = (time: number) => {
      const video = videoRef.current
      if (!video || cancelled) return
      const next = Math.min(durationRef.current, Math.max(0, time))

      if (seekingRef.current) {
        queuedTimeRef.current = next
        return
      }

      if (Math.abs(video.currentTime - next) < 0.012) return

      seekingRef.current = true
      queuedTimeRef.current = null

      const finish = () => {
        if (cancelled) return
        clearSeekWait()
        seekingRef.current = false
        const queued = queuedTimeRef.current
        queuedTimeRef.current = null
        if (queued !== null && Math.abs(queued - video.currentTime) > 0.012) {
          applySeek(queued)
        }
      }

      onSeeked = finish
      video.addEventListener("seeked", finish)
      failsafe = window.setTimeout(finish, 90)
      video.currentTime = next
    }

    const tick = (now: number) => {
      const video = videoRef.current
      const duration = durationRef.current
      const last = lastTickRef.current || now
      lastTickRef.current = now
      const dt = Math.min(0.05, (now - last) / 1000)

      if (video && duration > 0 && primedRef.current && !reduceMotionRef.current) {
        const k = 1 - Math.exp(-follow * dt)
        smoothedXRef.current += (targetXRef.current - smoothedXRef.current) * k
        smoothedYRef.current += (targetYRef.current - smoothedYRef.current) * k

        const lastFrame = Math.max(0, Math.round(duration * FPS) - 1)
        let goal = gazePaths
          ? pickPathFrame(
              smoothedXRef.current,
              smoothedYRef.current,
              gazePaths,
              sideRef,
              pitchRef,
              centerRef,
            )
          : smoothedXRef.current * lastFrame

        const playhead = playheadRef.current
        if (!canLerp(playhead, goal)) {
          const take = takeOf(goal)
          if (pendingTakeRef.current !== take) {
            pendingTakeRef.current = take
            pendingSinceRef.current = now
          }
          if (now - pendingSinceRef.current < TAKE_DWELL_MS) {
            goal = heldGoalRef.current
          } else {
            playheadRef.current = goal
            heldGoalRef.current = goal
            pendingTakeRef.current = take
            applySeek(frameTime(goal, duration))
            rafRef.current = window.requestAnimationFrame(tick)
            return
          }
        } else {
          pendingTakeRef.current = takeOf(goal)
          heldGoalRef.current = goal
        }

        const scrub = 1 - Math.exp(-SCRUB_FOLLOW * dt)
        playheadRef.current += (goal - playheadRef.current) * scrub
        applySeek(frameTime(playheadRef.current, duration))
      }

      rafRef.current = window.requestAnimationFrame(tick)
    }

    rafRef.current = window.requestAnimationFrame(tick)
    return () => {
      cancelled = true
      clearSeekWait()
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [follow, gazePaths])

  return (
    <div ref={rootRef} className={`relative h-full w-full overflow-hidden bg-ink ${className}`}>
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="auto"
        disableRemotePlayback
        className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
      />
      {!isReady ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/50 text-xs text-muted">
          Loading…
        </div>
      ) : null}
    </div>
  )
}
