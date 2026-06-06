// ============================================================
// BTメーター — チームの貯まったポイントを視覚化するゲージ
// 進捗の可視化が狙い。フィーバー(満タン)で見た目が変わる。
// ============================================================
interface BTMeterProps {
  /** 現在のポイント */
  current: number
  /** 満タン(フィーバー)とみなす閾値 */
  max: number
}

export function clampPercent(current: number, max: number): number {
  if (max <= 0) return 0
  const pct = (current / max) * 100
  return Math.max(0, Math.min(100, Math.round(pct)))
}

export default function BTMeter({ current, max }: BTMeterProps) {
  const percent = clampPercent(current, max)
  const isFever = percent >= 100

  return (
    <div className="w-full" role="meter" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className="mb-1 flex justify-between text-sm font-medium">
        <span>BTメーター</span>
        <span>{isFever ? '⚡FEVER!⚡' : `${percent}%`}</span>
      </div>
      <div className="h-5 w-full overflow-hidden rounded-full bg-bt-dark/10">
        <div
          className={`h-full rounded-full transition-all ${isFever ? 'bg-bt-gold animate-pulse' : 'bg-bt-gold'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
