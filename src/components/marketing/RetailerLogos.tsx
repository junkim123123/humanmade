import React from "react"

type LogoItem = {
  name: string
  src?: string
  widthClass: string
}

const LOGOS: LogoItem[] = [
  { name: "Costco Wholesale", widthClass: "w-56 md:w-64" },
  { name: "7 Eleven", widthClass: "w-40 md:w-48" },
  { name: "Don Quijote", widthClass: "w-44 md:w-52" },
]

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ")
}

export default function RetailerLogos(props: {
  className?: string
  label?: string
  tonedDown?: boolean
}) {
  const label = props.label ?? "Sourced for channels like"
  const tonedDown = props.tonedDown ?? true

  return (
    <div className={cx("w-full flex flex-col items-center gap-3", props.className)} aria-label="Retailer logos">
      <div className="text-sm text-slate-500">{label}</div>

      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {LOGOS.map((logo) => (
          <div key={logo.name} className={cx("h-12 flex items-center justify-center px-6 bg-white rounded-lg border border-slate-200 shadow-sm", logo.widthClass)}>
            <span className={cx("font-semibold text-slate-700 text-xl", tonedDown && "opacity-90")}>{logo.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
