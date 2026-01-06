import React from "react"

type Item = { key: string; node: React.ReactNode }

function LogoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: 44,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 0,
      }}
    >
      {children}
    </div>
  )
}

function LogoImg({
  src,
  alt,
  height = 28,
  maxWidth = 260,
}: {
  src: string
  alt: string
  height?: number
  maxWidth?: number
}) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={{
        height,
        width: "auto",
        maxWidth,
        display: "block",
      }}
    />
  )
}

export default function TrustedByBar() {
  const items: Item[] = [
    {
      key: "costco",
      node: <LogoImg src="/logos/costco.svg" alt="Costco Wholesale" height={30} maxWidth={340} />,
    },
    {
      key: "7eleven",
      node: <LogoImg src="/logos/7-eleven.svg" alt="7 Eleven" height={30} maxWidth={340} />,
    },
    {
      key: "donki",
      node: <LogoImg src="/logos/don-quijote.svg" alt="Don Quijote" height={30} maxWidth={340} />,
    },
  ]

  return (
    <div style={{ width: "100%" }}>
      <div style={{ textAlign: "center", color: "#64748B", fontSize: 18, marginBottom: 18 }}>
        Sourced for channels like
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 64,
          flexWrap: "wrap",
        }}
      >
        {items.map((it) => (
          <LogoBox key={it.key}>{it.node}</LogoBox>
        ))}
      </div>
    </div>
  )
}
