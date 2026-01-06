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
      node: (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#E5E7EB",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 22,
              color: "#6B7280",
              flex: "0 0 auto",
            }}
          >
            7
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#3F3F46", lineHeight: 1 }}>
            Eleven
          </div>
        </div>
      ),
    },
    {
      key: "donki",
      node: (
        <div
          style={{
            height: 44,
            padding: "0 18px",
            borderRadius: 16,
            background: "#E5E7EB",
            display: "inline-flex",
            alignItems: "center",
            fontSize: 30,
            fontWeight: 800,
            color: "#3F3F46",
            lineHeight: 1,
            whiteSpace: "nowrap",
          }}
        >
          Don Quijote
        </div>
      ),
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
