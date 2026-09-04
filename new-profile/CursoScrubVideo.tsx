import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    startTransition,
} from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

// User request: Create a new Framer code component named CursorScrubVideo. It must be a self-contained responsive video scrub surface with editable property controls for videoFile, axis, reverse, trackingArea, smoothing, objectFit, showPoster, and borderRadius; show a neutral placeholder when no video is provided; scrub exclusively via cursor position (no autoplay playback); warm-load on mount; wait for canplaythrough before scrubbing; lerp currentTime toward targetTime in an RAF loop while respecting seek-pending guards; handle URL/object file values robustly; clean up RAF/listeners/object URLs; and include documentation noting all-frames-keyframe encoding plus the provided ffmpeg command.

type Axis = "horizontal" | "vertical"
type TrackingArea = "component" | "window"
type FitMode = "cover" | "contain" | "fill"

interface MyComponentProps {
    videoFile?:
        | string
        | { url?: string; src?: string; file?: File; name?: string }
    axis: Axis
    reverse: boolean
    trackingArea: TrackingArea
    smoothing: number
    objectFit: FitMode
    showPoster: boolean
    borderRadius: number
}

/**
 * CursorScrubVideo
 *
 * Frame-accurate, buttery scrubbing requires every video frame to be a keyframe.
 * Recommended encoding command:
 * ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 18 -g 1 -keyint_min 1 -x264-params "scenecut=0" -profile:v high -pix_fmt yuv420p -movflags +faststart -an out.mp4
 */
/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function CursorScrubVideo(props: MyComponentProps) {
    const {
        videoFile = "",
        axis,
        reverse,
        trackingArea,
        smoothing,
        objectFit,
        showPoster,
        borderRadius,
    } = props

    const isStatic = useIsStaticRenderer()
    const rootRef = useRef<HTMLDivElement | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const rafRef = useRef<number | null>(null)
    const objectUrlRef = useRef<string | null>(null)
    const targetTimeRef = useRef(0)
    const smoothedTimeRef = useRef(0)
    const scrubEnabledRef = useRef(false)
    const seekPendingRef = useRef(false)
    const durationRef = useRef(0)

    const [hasSource, setHasSource] = useState(false)
    const [isReady, setIsReady] = useState(false)

    const resolvedVideoURL = useMemo(() => {
        let resolved = ""
        if (typeof videoFile === "string") {
            resolved = videoFile
        } else if (videoFile && typeof videoFile === "object") {
            if (typeof videoFile.url === "string") resolved = videoFile.url
            else if (typeof videoFile.src === "string") resolved = videoFile.src
            else if (
                typeof File !== "undefined" &&
                videoFile.file instanceof File
            ) {
                try {
                    resolved = URL.createObjectURL(videoFile.file)
                } catch (_error) {
                    resolved = ""
                }
            }
        }
        return resolved
    }, [videoFile])

    useEffect(() => {
        if (objectUrlRef.current && objectUrlRef.current !== resolvedVideoURL) {
            URL.revokeObjectURL(objectUrlRef.current)
            objectUrlRef.current = null
        }
        if (resolvedVideoURL.startsWith("blob:")) {
            objectUrlRef.current = resolvedVideoURL
        }
    }, [resolvedVideoURL])

    useEffect(() => {
        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current)
                objectUrlRef.current = null
            }
        }
    }, [])

    useEffect(() => {
        const sourceExists = Boolean(resolvedVideoURL)
        startTransition(() => {
            setHasSource(sourceExists)
            setIsReady(false)
        })
        scrubEnabledRef.current = false
        targetTimeRef.current = 0
        smoothedTimeRef.current = 0
    }, [resolvedVideoURL])

    const updateTargetFromPointer = useCallback(
        (
            clientX: number,
            clientY: number,
            offsetX?: number,
            offsetY?: number
        ) => {
            let normalized = 0
            if (trackingArea === "window") {
                if (typeof window === "undefined") return
                const denom =
                    axis === "horizontal"
                        ? window.innerWidth
                        : window.innerHeight
                const raw = axis === "horizontal" ? clientX : clientY
                normalized = denom > 0 ? raw / denom : 0
            } else {
                const root = rootRef.current
                if (!root) return
                const rect = root.getBoundingClientRect()
                const size = axis === "horizontal" ? rect.width : rect.height
                const rawOffset =
                    axis === "horizontal" ? (offsetX ?? 0) : (offsetY ?? 0)
                normalized = size > 0 ? rawOffset / size : 0
            }

            const clamped = Math.max(0, Math.min(1, normalized))
            const position = reverse ? 1 - clamped : clamped
            const duration = durationRef.current
            if (Number.isFinite(duration) && duration > 0) {
                targetTimeRef.current = position * duration
            } else {
                targetTimeRef.current = 0
            }
        },
        [axis, reverse, trackingArea]
    )

    useEffect(() => {
        if (isStatic) return
        if (!hasSource) return

        const video = videoRef.current
        if (!video) return

        const handleCanPlayThrough = () => {
            const duration = video.duration
            durationRef.current = Number.isFinite(duration) ? duration : 0
            scrubEnabledRef.current = durationRef.current > 0
            startTransition(() => setIsReady(scrubEnabledRef.current))
            video.currentTime = 0
            smoothedTimeRef.current = 0
            targetTimeRef.current = 0
        }
        const handleSeeking = () => {
            seekPendingRef.current = true
        }
        const handleSeeked = () => {
            seekPendingRef.current = false
        }

        video.addEventListener("canplaythrough", handleCanPlayThrough)
        video.addEventListener("seeking", handleSeeking)
        video.addEventListener("seeked", handleSeeked)

        video.currentTime = 0
        video.load()
        video
            .play()
            .then(() => video.pause())
            .catch(() => {})

        return () => {
            video.removeEventListener("canplaythrough", handleCanPlayThrough)
            video.removeEventListener("seeking", handleSeeking)
            video.removeEventListener("seeked", handleSeeked)
        }
    }, [hasSource, isStatic, resolvedVideoURL])

    useEffect(() => {
        if (isStatic) return
        if (!hasSource) return

        const onWindowMove = (event: PointerEvent) => {
            updateTargetFromPointer(event.clientX, event.clientY)
        }
        const onComponentMove = (event: PointerEvent) => {
            updateTargetFromPointer(
                event.clientX,
                event.clientY,
                event.offsetX,
                event.offsetY
            )
        }

        if (trackingArea === "window") {
            if (typeof window !== "undefined") {
                window.addEventListener("pointermove", onWindowMove, {
                    passive: true,
                })
            }
        } else {
            const root = rootRef.current
            if (root)
                root.addEventListener("pointermove", onComponentMove, {
                    passive: true,
                })
        }

        return () => {
            if (trackingArea === "window") {
                if (typeof window !== "undefined") {
                    window.removeEventListener("pointermove", onWindowMove)
                }
            } else {
                const root = rootRef.current
                if (root)
                    root.removeEventListener("pointermove", onComponentMove)
            }
        }
    }, [hasSource, isStatic, trackingArea, updateTargetFromPointer])

    useEffect(() => {
        if (isStatic) return
        if (!hasSource) return

        const tick = () => {
            const video = videoRef.current
            if (video) {
                const duration = durationRef.current
                if (
                    scrubEnabledRef.current &&
                    Number.isFinite(duration) &&
                    duration > 0
                ) {
                    const next =
                        smoothedTimeRef.current +
                        (targetTimeRef.current - smoothedTimeRef.current) *
                            smoothing
                    smoothedTimeRef.current = next
                    if (
                        !seekPendingRef.current &&
                        Math.abs(video.currentTime - next) > 0.008
                    ) {
                        video.currentTime = Math.max(
                            0,
                            Math.min(duration, next)
                        )
                    }
                }
            }
            rafRef.current = window.requestAnimationFrame(tick)
        }

        if (typeof window !== "undefined") {
            rafRef.current = window.requestAnimationFrame(tick)
        }

        return () => {
            if (rafRef.current !== null && typeof window !== "undefined") {
                window.cancelAnimationFrame(rafRef.current)
            }
            rafRef.current = null
        }
    }, [hasSource, isStatic, smoothing])

    const loadingVisible = hasSource && showPoster && !isReady

    return (
        <div
            ref={rootRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius,
                background: "#F5F5F5",
            }}
        >
            {!hasSource ? (
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#666666",
                        fontSize: 14,
                        lineHeight: 1.2,
                        textAlign: "center",
                        padding: 12,
                    }}
                >
                    Add a video file
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        src={resolvedVideoURL}
                        muted
                        playsInline
                        preload="auto"
                        disableRemotePlayback
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit,
                            borderRadius,
                            display: "block",
                            background: "#000000",
                        }}
                    />
                    {loadingVisible ? (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(255,255,255,0.22)",
                                color: "#000000",
                                fontSize: 12,
                                pointerEvents: "none",
                            }}
                        >
                            Loading video…
                        </div>
                    ) : null}
                </>
            )}
        </div>
    )
}

addPropertyControls(CursorScrubVideo, {
    videoFile: {
        type: ControlType.File,
        title: "Video",
        allowedFileTypes: ["mp4", "webm", "mov", "m4v", "ogv"],
    },
    axis: {
        type: ControlType.Enum,
        title: "Axis",
        options: ["horizontal", "vertical"],
        optionTitles: ["Horizontal", "Vertical"],
        defaultValue: "horizontal",
    },
    reverse: {
        type: ControlType.Boolean,
        title: "Reverse",
        defaultValue: false,
        enabledTitle: "Yes",
        disabledTitle: "No",
    },
    trackingArea: {
        type: ControlType.Enum,
        title: "Tracking",
        options: ["component", "window"],
        optionTitles: ["Component", "Window"],
        defaultValue: "component",
    },
    smoothing: {
        type: ControlType.Number,
        title: "Smoothing",
        min: 0.02,
        max: 1,
        step: 0.01,
        defaultValue: 0.22,
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },
    showPoster: {
        type: ControlType.Boolean,
        title: "Poster",
        defaultValue: true,
        enabledTitle: "Show",
        disabledTitle: "Hide",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 0,
        max: 200,
        step: 1,
        unit: "px",
        defaultValue: 0,
    },
})
