import React from "react"

type LogoItem = {
  name: string
  description: string
}

const CHANNELS: LogoItem[] = [
  { name: "Wholesale", description: "Club & bulk retail" },
  { name: "Convenience", description: "High-frequency, fast turns" },
  { name: "Specialty retail", description: "Category-led buyers" },
]

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ")
}

export default function RetailerLogos(props: {
  className?: string
  label?: string
  tonedDown?: boolean
}) {
  const label = props.label ?? "Works for channels like"
  const tonedDown = props.tonedDown ?? true

  return (
    <div className={cx("w-full flex flex-col items-center gap-3", props.className)} aria-label="Retailer logos">
      <div className={cx("text-xs uppercase tracking-[0.18em] text-slate-400", tonedDown && "opacity-90")}>
        {label}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {CHANNELS.map((channel) => (
          <div
            key={channel.name}
            className={cx(
              "rounded-full border border-slate-200 bg-white px-4 py-2 text-center",
              tonedDown && "opacity-95"
            )}
          >
            <div className="text-sm font-semibold text-slate-900">{channel.name}</div>
            <div className="text-xs text-slate-500">{channel.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
