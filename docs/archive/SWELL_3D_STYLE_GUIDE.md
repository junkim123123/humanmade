# Swell-style 3D Unification Guide

## Overall 3D Style Principles

### Background
- Very subtle gradient + subtle noise, with a slightly darker tone from top to bottom.
- `bg-slate-50/80` or `bg-gradient-to-b from-slate-50/90 to-slate-100/80`
- Page padding: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`

### Card/Panel Common Styles

#### Basic Style
- **Radius**: `rounded-2xl` (18–20px)
- **3D Effect**:
  ```tsx
  className="
    bg-white/90 border border-slate-200
    shadow-[0_18px_45px_rgba(15,23,42,0.12)]
    backdrop-blur-sm
  "
  ```
- **Hover Effect**:
  ```tsx
  className="
    hover:translate-y-[-2px]
    hover:shadow-[0_24px_55px_rgba(15,23,42,0.18)]
    transition-all duration-300
  "
  ```
- **Internal Padding**: `p-5 sm:p-6 lg:p-7`

### Depth Levels (Z-index Hierarchy)

#### Level 1: Full Section Wrapper Card
```tsx
className="
  rounded-3xl border border-slate-200/80 bg-white/95
  shadow-[0_22px_60px_rgba(15,23,42,0.15)]
  backdrop-blur-sm
  px-4 py-5 sm:p-6 lg:p-7
"
```

#### Level 2: Internal Card/Panel
```tsx
className="
  rounded-2xl border border-slate-200 bg-slate-50/90
  shadow-[0_16px_40px_rgba(15,23,42,0.12)]
  p-5
"
```

#### Level 3: CTA Buttons and Small Elements
```tsx
// CTA Button
className="
  rounded-full bg-slate-900 px-4 py-2.5
  shadow-[0_18px_40px_rgba(15,23,42,0.4)]
  hover:shadow-[0_22px_55px_rgba(15,23,42,0.5)]
  transition-all
"

// Small Pill Badge
className="
  rounded-full bg-slate-100 px-2.5 py-1
  text-xs font-medium
"
```

### Color Tokens
- **Primary background**: `bg-white/90` ~ `bg-white/95`
- **Secondary background**: `bg-slate-50/80` ~ `bg-slate-50/90`
- **Border**: `border-slate-200` ~ `border-slate-200/80`
- **Text primary**: `text-slate-900`
- **Text secondary**: `text-slate-600`
- **Text muted**: `text-slate-500`

### Scope of Application
Apply these style rules consistently to the following sections:
- Hero section
- Analyze section
- Pricing section
- Sample report section
- Proof section
