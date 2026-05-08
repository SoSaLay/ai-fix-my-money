interface BadgeProps {
  label: string
  color: string
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

export function Badge({ label, color }: BadgeProps) {
  const rgb = hexToRgb(color)

  return (
    <span
      className="rounded-full px-3 py-1 text-label-md font-medium inline-flex items-center"
      style={{
        backgroundColor: `rgba(${rgb}, 0.15)`,
        color: color,
      }}
    >
      {label}
    </span>
  )
}
