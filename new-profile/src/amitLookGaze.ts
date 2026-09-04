/** Continuous takes in amit-look.mp4 used for smooth follow. */
export const amitLookPaths = {
  /** Opening rest — looking into the camera. */
  center: { start: 8, end: 8 },
  left: { start: 155, end: 171 },
  /** Level look-right at ~5s in the source clip. */
  right: { start: 118, end: 122 },
  down: { start: 102, end: 114 },
  /** Bottom-left take at ~8s in the source clip. */
  downLeft: { start: 174, end: 192 },
  /** Up-right take in the first look-around. */
  upRight: { start: 28, end: 60 },
  /** Up-left take after the up-right glance. */
  upLeft: { start: 66, end: 78 },
} as const
