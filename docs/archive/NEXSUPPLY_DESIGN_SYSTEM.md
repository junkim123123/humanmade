# NexSupply Design System
## "Swell-style Visuals + B2B Sourcing OS"

### Overall Direction
- **Visuals**: Soft cards, generous whitespace, and friendly tones inspired by Swell.
- **Structure & Language**: A B2B OS centered around pipeline, reports, verification, and orders.

---

## Screen Roles & Definitions

### 1. Marketing Site (`/`)
**Role**: Emphasize trust and track record
- Use cases: Don Quijote, 7‑Eleven, Amazon
- Components: Hero, Flow Diorama, Margin Comparison, Proof Showcase

### 2. Analyze / Sample Report (`/analyze`, `/sample-report/v2`)
**Role**: "Draft buy plan" — Summary cards for figures and risks
- Pre-verification estimate
- 3-tier structure: Facts / Estimate / Proof
- Clearly define the flow: Draft → Verification → Execution

### 3. App Home / Reports (`/app/reports`)
**Role**: "Supply Chain Control Center" — Pipeline board
- Sourcing, verification, logistics — all in one place
- Visualize the Draft → Verification → Execution flow
- Pipeline Statuses: Analyzing → Verifying → Ready to Order

---

## UI Style Guide

### Card

#### Level 1: Section Wrapper Card
```tsx
className="
  rounded-3xl border border-slate-200 bg-white/95
  shadow-[0_26px_70px_rgba(15,23,42,0.18)]
  backdrop-blur-sm p-5 sm:p-6
"
```

#### Level 2: Internal Content Card
```tsx
className="
  rounded-2xl border border-slate-200 bg-white/90
  shadow-[0_18px_45px_rgba(15,23,42,0.14)]
  hover:shadow-[0_24px_60px_rgba(15,23,42,0.22)]
  hover:-translate-y-[2px]
  transition-all p-4 sm:p-5
"
```

#### Level 3: Small Info Card
```tsx
className="
  rounded-xl border border-slate-200 bg-slate-50/90
  shadow-[0_8px_20px_rgba(15,23,42,0.08)]
  p-3 sm:p-4
"
```

**Common Principles:**
- Corner Radius: `rounded-3xl` (Level 1), `rounded-2xl` (Level 2), `rounded-xl` (Level 3)
- Light Shadows: Deep but soft
- Section Header + Concise one-line description
- Hover Effect: Subtle upward lift (`-translate-y-[2px]`)

---

### Badge

#### Status Badge
```tsx
// Completed
className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[12px] font-medium"

// Verifying / In Progress
className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[12px] font-medium"

// Draft / Pending
className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[12px] font-medium"

// Risk / Warning
className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 text-[12px] font-medium"

// Requires Action
className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-[12px] font-medium"
```

**Principles:**
- Pill-shaped (`rounded-full`)
- Restrained color palette: Use only emerald, amber, slate, yellow, and blue
- Typography: `text-[12px] font-medium`
- Icon inclusion allowed (gap-1.5)

---

### Button

#### Primary CTA
```tsx
className="
  inline-flex items-center justify-center
  rounded-full bg-slate-900 px-5 py-2.5
  text-[14px] font-semibold text-white
  shadow-[0_18px_45px_rgba(15,23,42,0.5)]
  hover:bg-slate-800
  hover:shadow-[0_22px_55px_rgba(15,23,42,0.6)]
  transition-all
"
```

#### Secondary CTA
```tsx
className="
  inline-flex items-center justify-center
  rounded-full bg-slate-100 px-5 py-2.5
  text-[14px] font-medium text-slate-900
  border border-slate-200
  hover:bg-slate-200
  transition-colors
"
```

#### Text Link
```tsx
className="
  text-[14px] font-medium text-slate-900
  hover:text-slate-700 hover:underline
  transition-colors
"
```

**Principles:**
- Always "Verb + Domain Noun": "Start verification", "View report", "Move to orders"
- Primary: Deep shadow; Secondary: Shallow shadow or border-only
- `rounded-full` (pill shape)

---

### Typography

#### Headers
```tsx
// H1 (Hero)
className="text-[28px] sm:text-[32px] font-bold text-slate-900 leading-tight"

// H2 (Section)
className="text-[20px] sm:text-[22px] font-semibold text-slate-900"

// H3 (Card Title)
className="text-[16px] font-semibold text-slate-900"
```

#### Body
```tsx
// Body Large
className="text-[15px] text-slate-600 leading-relaxed"

// Body Regular
className="text-[14px] text-slate-600 leading-relaxed"

// Body Small
className="text-[13px] text-slate-600 leading-relaxed"

// Caption
className="text-[12px] text-slate-500"
```

**Principles:**
- Headers should be bold and concise (`font-bold` or `font-semibold`)
- Body text should be 13–14px for readability
- Colors: `text-slate-900` (Header), `text-slate-600` (Body), `text-slate-500` (Caption)

---

### Color Palette

#### Base
- **White**: `bg-white` / `bg-white/95` (Card background)
- **Slate 50**: `bg-slate-50` (Section background)
- **Slate 100**: `bg-slate-100` (Badge, Icon background)
- **Slate 200**: `border-slate-200` (Borders)
- **Slate 600**: `text-slate-600` (Body text)
- **Slate 900**: `text-slate-900` (Headers, Primary buttons)

#### Accent Colors (Use only 1–2 per context)
- **Emerald** (Success/Completed): `bg-emerald-100 text-emerald-700 border-emerald-200`
- **Amber** (In-progress/Caution): `bg-amber-100 text-amber-700 border-amber-200`
- **Blue** (Info/Action Required): `bg-blue-100 text-blue-700 border-blue-200`
- **Yellow** (Warning/Risk): `bg-yellow-100 text-yellow-700 border-yellow-200`

**Principles:**
- Base is white/slate
- Point colors should be limited to 1–2 per context
- Use restrained, sophisticated color choices

---

### Spacing

#### Section Spacing
```tsx
// Section Padding
className="py-12 lg:py-16"

// Container Padding
className="px-4 sm:px-6 lg:px-8"

// Max Width
className="max-w-5xl mx-auto" // Reports/App
className="max-w-6xl mx-auto" // Marketing
```

#### Card Internal Spacing
```tsx
// Level 1 Card
className="p-5 sm:p-6"

// Level 2 Card
className="p-4 sm:p-5"

// Level 3 Card
className="p-3 sm:p-4"
```

**Principles:**
- Generous whitespace like Swell
- Responsive: Tighter on mobile, more spacious on desktop

---

### Pipeline Visualization

#### 3-Step Flow
```
Draft → Verification → Execution
```

**Visual Representation:**
- Represent each step as a card
- Connect with arrows or paths
- Use status badges to indicate the current step

**Text:**
- "Draft buy plan"
- "Start verification"
- "Move to orders"

---

## Copy Guide

### Button/Action Text
Always follow the **"Verb + Domain Noun"** format:
- ✅ "Start verification"
- ✅ "View report"
- ✅ "Move to orders"
- ✅ "View logistics"
- ❌ "Verify now"
- ❌ "See details"

### Section Headers
Follow the **"Role + One-line Description"** format:
- "Draft buy plan — we'll lock numbers after verification."
- "Supply Chain Control Center — monitor your sourcing pipeline"
- "Facts — captured from your product photos"

### Status Descriptions
Follow the **"Current Status + Next Action"** format:
- "Draft range (duty, freight, unit landed cost). Confirmed during verification."
- "Suggested by trade data — verify before ordering."
- "Ready to move? Start verification and we'll take it to production."

---

## Component Examples

### Report Card
```tsx
<div className="rounded-2xl border border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.14)] hover:shadow-[0_24px_60px_rgba(15,23,42,0.22)] hover:-translate-y-[2px] transition-all p-5">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-[16px] font-semibold text-slate-900">Product Name</h3>
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 text-[12px] font-medium">
      Completed
    </span>
  </div>
  <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 mb-4">
    <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">Target Cost</p>
    <p className="text-[16px] font-bold text-slate-900">$1.77 / unit</p>
  </div>
  <p className="text-[13px] text-slate-500 mb-4">Ready to move? Start verification and we'll take it to production.</p>
  <button className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_18px_45px_rgba(15,23,42,0.5)] hover:bg-slate-800 hover:shadow-[0_22px_55px_rgba(15,23,42,0.6)] transition-all">
    Start verification
  </button>
</div>
```

### Pipeline Status Card
```tsx
<div className="rounded-xl border border-slate-200 bg-white p-5">
  <div className="flex items-center justify-between mb-3">
    <div className="p-2 rounded-lg bg-slate-100">
      <Clock className="w-5 h-5 text-slate-600" />
    </div>
    <span className="text-[12px] font-medium text-slate-400 uppercase tracking-wide">Verifying</span>
  </div>
  <div className="text-[32px] font-bold text-slate-900 leading-none">5</div>
  <p className="text-[14px] text-amber-600 mt-1">In progress</p>
</div>
```

### Facts Panel
```tsx
<div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
  <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
      <Shield className="w-5 h-5 text-slate-600" />
    </div>
    <h3 className="text-[16px] font-semibold text-slate-900">Facts</h3>
  </div>
  <div className="px-6 py-5 space-y-3">
    <div className="flex items-start justify-between gap-3 border rounded-xl px-4 py-3 border-emerald-200 bg-emerald-50">
      <div className="flex-1">
        <div className="text-[14px] font-medium text-slate-900">Barcode</div>
        <div className="text-[13px] text-slate-600">UPC 1234567890</div>
      </div>
      <span className="text-[11px] font-medium px-2 py-0.5 rounded shrink-0 text-emerald-700 bg-emerald-100">Captured</span>
    </div>
  </div>
</div>
```

---

## Figma Component Styles

### Card Style
- **Corner Radius**: 
  - Level 1: 24px (`rounded-3xl`)
  - Level 2: 16px (`rounded-2xl`)
  - Level 3: 12px (`rounded-xl`)
- **Shadow**:
  - Level 1: `0px 26px 70px rgba(15, 23, 42, 0.18)`
  - Level 2: `0px 18px 45px rgba(15, 23, 42, 0.14)`
  - Level 2 Hover: `0px 24px 60px rgba(15, 23, 42, 0.22)`
  - Level 3: `0px 8px 20px rgba(15, 23, 42, 0.08)`
- **Border**: `1px solid #E2E8F0` (slate-200)
- **Background**: `#FFFFFF` or `rgba(255, 255, 255, 0.95)`

### Badge Style
- **Shape**: Pill (100% corner radius)
- **Padding**: 12px horizontal, 6px vertical
- **Typography**: 12px, Medium weight
- **Colors**:
  - Completed: Background `#D1FAE5`, Text `#047857`, Border `#A7F3D0`
  - Verifying: Background `#FEF3C7`, Text `#B45309`, Border `#FDE68A`
  - Draft: Background `#F1F5F9`, Text `#334155`, Border `#CBD5E1`
  - Risk: Background `#FEF9C3`, Text `#854D0E`, Border `#FDE047`
  - Action: Background `#DBEAFE`, Text `#1E40AF`, Border `#BFDBFE`

### Button Style
- **Primary**:
  - Shape: Pill (100% corner radius)
  - Background: `#0F172A` (slate-900)
  - Text: `#FFFFFF`, 14px, Semibold
  - Shadow: `0px 18px 45px rgba(15, 23, 42, 0.5)`
  - Hover: Background `#1E293B`, Shadow `0px 22px 55px rgba(15, 23, 42, 0.6)`
- **Secondary**:
  - Shape: Pill (100% corner radius)
  - Background: `#F1F5F9` (slate-100)
  - Text: `#0F172A` (slate-900), 14px, Medium
  - Border: `1px solid #E2E8F0` (slate-200)
  - Hover: Background `#E2E8F0` (slate-200)

### Typography Style
- **H1**: 32px, Bold, `#0F172A`
- **H2**: 22px, Semibold, `#0F172A`
- **H3**: 16px, Semibold, `#0F172A`
- **Body Large**: 15px, Regular, `#475569`
- **Body**: 14px, Regular, `#475569`
- **Body Small**: 13px, Regular, `#475569`
- **Caption**: 12px, Regular, `#64748B`

---

## Implementation Checklist

### Add to Each Screen
- [ ] Top-level one-line description of the screen's role
- [ ] 3-step visualization: Draft → Verification → Execution
- [ ] Current stage indicator using status badges
- [ ] Buttons/Actions in "Verb + Domain Noun" format

### Unified Styling
- [ ] Card levels (1/2/3) clearly differentiated
- [ ] Badges: Pill-shaped, restrained colors
- [ ] Buttons: Clear Primary/Secondary distinction
- [ ] Typography: Bold/concise headers, 13–14px body
- [ ] Color: Slate base, maximum 1–2 accent colors per context

---

## References

- **Swell**: Soft cards, generous whitespace, friendly tone
- **B2B OS**: Pipeline-centric, status-based, clear actions
- **Legacy NexSupply**: Maintain trade/logistics terminology

---

*This guide is intended to provide a consistent user experience while maintaining NexSupply's "Swell visual style + B2B sourcing OS" identity.*
