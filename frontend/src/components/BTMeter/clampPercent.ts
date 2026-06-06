/** current / max をパーセント(0〜100)に変換してクランプする */
export function clampPercent(current: number, max: number): number {
  if (max <= 0) return 0
  const pct = (current / max) * 100
  return Math.max(0, Math.min(100, Math.round(pct)))
}
