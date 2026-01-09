# NexSupply Practical Component Guide
## Swell-style Aesthetic + B2B Sourcing OS

> Component specifications ready for immediate use in Figma

---

## 1. Card Component

### Basic Specifications
- **Radius**: 16px (`rounded-2xl`)
- **Border**: 1px solid `#E2E8F0` (slate-200)
- **Shadow**: 
  - Default: `0px 1px 3px rgba(0, 0, 0, 0.1)` (shadow-sm)
  - Hover: `0px 4px 6px rgba(0, 0, 0, 0.1)` (shadow-md)
- **Padding**: 
  - Mobile: 16px
  - Desktop: 20px
- **Background**: `#FFFFFF`

### Type 1: Report Card (Your Products)

**Layout Structure:**
```
┌─────────────────────────────────────────┐
│ [Category]                    [Status]   │
│                                          │
│ Product Name (Up to 2 lines)             │
│ Target cost  $0.59 / unit               │
│                                          │
│ [Request verification]  [View report]   │
└─────────────────────────────────────────┘
```

**Figma Component Specifications:**

#### Header Area
- **Left: Category**
  - Text: 12px, Medium, `#64748B` (slate-500)
  - Uppercase, tracking-wide
  - Example: "CONFECTIONERY & COLLECTIBLE TOYS"

- **Right: Status Pill**
  - Completed: `bg-emerald-50`, `text-emerald-700`, `border-emerald-200`
  - Verifying: `bg-blue-50`, `text-blue-700`, `border-blue-200`
  - Draft: `bg-slate-50`, `text-slate-700`, `border-slate-200`
  - Size: 12px, Medium, Pill shape (100% corner radius)
  - Padding: 6px horizontal, 3px vertical

#### Content Area
- **Product Name**
  - Text: 18px, Semibold, `#0F172A` (slate-900)
  - Line height: 1.4
  - Max 2 lines, ellipsis
  - Margin bottom: 16px

- **Target Cost**
  - Label: 12px, Medium, Uppercase, `#64748B`
  - Value: 16px, Bold, `#0F172A`
  - Background: `#F8FAFC` (slate-50), border `#E2E8F0`
  - Padding: 12px
  - Border radius: 8px
  - Margin bottom: 16px

#### Action Area
- **Primary Button**: "Request verification"
  - Background: `#0F172A` (slate-900)
  - Text: 14px, Semibold, `#FFFFFF`
  - Padding: 10px 20px
  - Border radius: 999px (pill)
  - Shadow: `0px 4px 6px rgba(15, 23, 42, 0.1)`

- **Ghost Button**: "View report"
  - Background: Transparent
  - Text: 14px, Medium, `#0F172A`
  - Border: 1px solid `#E2E8F0`
  - Padding: 10px 20px
  - Border radius: 999px (pill)

**Spacing:**
- Button spacing: 12px
- Section spacing: 16px

---

## 2. Badge / Pill Style

### Status Badge

#### Completed
- Background: `#D1FAE5` (emerald-50)
- Text: `#047857` (emerald-700)
- Border: `#A7F3D0` (emerald-200), 1px
- Size: 12px, Medium
- Shape: Pill (100% corner radius)
- Padding: 6px 12px

#### Verifying / In Progress
- Background: `#DBEAFE` (blue-50)
- Text: `#1E40AF` (blue-700)
- Border: `#BFDBFE` (blue-200), 1px
- Size: 12px, Medium
- Shape: Pill (100% corner radius)
- Padding: 6px 12px

#### Draft / Analyzing
- Background: `#F1F5F9` (slate-50)
- Text: `#334155` (slate-700)
- Border: `#CBD5E1` (slate-200), 1px
- Size: 12px, Medium
- Shape: Pill (100% corner radius)
- Padding: 6px 12px

### Evidence Level Badge (Sample Report)

#### Low Evidence
- Background: `#FEF3C7` (amber-50)
- Text: `#B45309` (amber-700)
- Border: `#FDE68A` (amber-200), 1px

#### Medium Evidence
- Background: `#DBEAFE` (blue-50)
- Text: `#1E40AF` (blue-700)
- Border: `#BFDBFE` (blue-200), 1px

#### High Evidence
- Background: `#D1FAE5` (emerald-50)
- Text: `#047857` (emerald-700)
- Border: `#A7F3D0` (emerald-200), 1px

**Common Specifications:**
- Size: 12px, Medium
- Shape: Pill (100% corner radius)
- Padding: 6px 12px

---

## 3. Typography & Tone

### Headers
- **H1 (Hero)**: 32–40px, Bold, `#0F172A`
  - Example: "Sourcing, verification, logistics — all in one place."
- **H2 (Section)**: 18–24px, Semibold, `#0F172A`
  - Example: "Supply Chain Control Center", "Decision", "Verified facts"
- **H3 (Card Title)**: 16px, Semibold, `#0F172A`

### Subtext
- **Body Large**: 15px, Regular, `#64748B`
  - Line height: 1.6
  - Max 2 lines
  - Example: "Track every product from first estimate to delivery."

- **Body**: 14px, Regular, `#64748B`
- **Body Small**: 13px, Regular, `#64748B`

### Copy Patterns (Swell Rhythm + NexSupply Domain)

**Principles:**
- Friendly but professional
- "Verb + Domain Noun" format
- Present the next action clearly

**Examples:**
- ✅ "Save your reports, not just links."
- ✅ "Happy with this estimate? Start verification to turn it into a real order."
- ✅ "We run the factory chaos so you can keep selling."
- ✅ "Ready to move? Start verification and we'll take it to production."
- ✅ "Pick any completed report and request verification to kick off production."

---

## 4. Design Snapshot by Page

### 1) App Home (Control Center)

#### Hero Card
```
┌─────────────────────────────────────────────┐
│  Sourcing, verification, logistics —        │
│  all in one place.                          │
│                                              │
│  From factory floor to your door. We run    │
│  the chaos so you can keep selling.         │
│                                              │
│                    [+ Start new analysis]    │
└─────────────────────────────────────────────┘
```

**Specifications:**
- Background: `#0F172A` (slate-900) gradient
- Text: White
- Padding: 40px
- Border radius: 16px
- CTA Button: White background, slate-900 text

#### 4 Pipeline Cards (Grid)
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ [Icon]   │ │ [Icon]   │ │ [Icon]   │ │ [Icon]   │
│          │ │          │ │          │ │          │
│    14    │ │    0     │ │    0     │ │    0     │
│          │ │          │ │          │ │          │
│ Analyzing│ │ Verifying│ │ Ready    │ │ In       │
│          │ │          │ │ to order │ │ transit  │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

**Specifications:**
- Background: `#FFFFFF`
- Border: 1px solid `#E2E8F0`
- Border radius: 12px
- Padding: 20px
- Value: 32px, Bold, `#0F172A`
- Label: 14px, Regular, `#64748B`
- Icon: 20px, Background `#F8FAFC`

#### Your Products List
- Report Card (Type 1) repeating
- Card spacing: 16px

---

### 2) Sample Report (Decision / Proof)

#### Decision Card
```
┌─────────────────────────────────────────────┐
│ Decision                                    │
│                                              │
│  $1.77 per unit                             │
│  (Range: $1.65 – $1.89)                    │
│                                              │
│              [Medium evidence]               │
│              Unit weight confirmed          │
│                                              │
│ ─────────────────────────────────────────── │
│ [Start verification]  [Upload missing photos]│
└─────────────────────────────────────────────┘
```

**Specifications:**
- Background: `#FFFFFF`
- Border: 1px solid `#E2E8F0`
- Border radius: 16px
- Padding: 24px
- Large Value: 28px, Bold, `#0F172A`
- Range Text: 13px, Regular, `#64748B`
- Evidence pill: Medium evidence style
- Bottom Buttons: Primary + Secondary

#### Verified Facts Card
```
┌─────────────────────────────────────────────┐
│ [Icon]  Facts                                │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Barcode                                 │ │
│ │ UPC 1234567890                          │ │
│ │                              [Captured]  │ │
│ └─────────────────────────────────────────┘ │
│                                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Weight                                  │ │
│ │ 150g • From label text                  │ │
│ │                              [Captured]  │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Specifications:**
- Each Fact entry: Background `#F8FAFC`, border `#E2E8F0`
- Captured pill: emerald style
- Unreadable pill: amber style
- Missing pill: slate style

#### Suppliers Card
- Small card for each factory candidate
- Background: `#F8FAFC`
- Border: 1px solid `#E2E8F0`
- Border radius: 12px
- Padding: 16px

---

### 3) Analyze / Auth (Swell Tone Emphasis)

#### Analyze Page

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Product photos                              │
│                                              │
│ ┌──────────────┐  ┌──────────────────────┐ │
│ │              │  │ Assumptions           │ │
│ │ Upload Card  │  │                      │ │
│ │              │  │ Destination: US       │ │
│ │ [Choose]     │  │                      │ │
│ │ [Take photo] │  │ Target Sell Price    │ │
│ │              │  │                      │ │
│ │ └──────────────┘  │ [Calculate]         │ │
│ │                    └──────────────────────┘ │
│ └─────────────────────────────────────────────┘
```

**Specifications:**
- Main Board: Level 1 card (rounded-3xl, deep shadow)
- Upload Card: Level 2 card
- Assumptions Panel: Level 2 card
- CTA Button: Primary style

#### Sign in / Sign up Page

**Layout:**
```
┌─────────────────────────────────────────────┐
│          Welcome back                        │
│          Sign in to save your sourcing      │
│          reports and track verification.     │
│                                              │
│          [Continue with Google]              │
│                                              │
│          ─────── or use email ───────        │
│                                              │
│          [Email input]                       │
│          [Password input]                    │
│                                              │
│          [Sign in]                          │
│                                              │
│          We keep your reports private...    │
└─────────────────────────────────────────────┘
```

**Specifications:**
- Centered alignment
- Card: rounded-2xl, shadow-sm
- Padding: 32px
- Form element spacing: 16px

---

## 5. Color Palette

### Backgrounds
- **Primary**: `#FFFFFF`
- **Secondary**: `#F8FAFC` (slate-50)

### Text
- **Primary**: `#0F172A` (slate-900)
- **Secondary**: `#64748B` (slate-500/600)
- **Muted**: `#94A3B8` (slate-400)

### Accent Colors
- **Primary CTA**: `#0F172A` ~ `#020617` (slate-900)
- **Accent**: `#2563EB` (blue-600) or `#059669` (emerald-600) - choose one

### Status Colors
- **Success/Completed**: `#047857` (emerald-700), `#D1FAE5` (emerald-50)
- **Info/Verifying**: `#1E40AF` (blue-700), `#DBEAFE` (blue-50)
- **Warning**: `#B45309` (amber-700), `#FEF3C7` (amber-50)
- **Neutral**: `#334155` (slate-700), `#F1F5F9` (slate-50)

### Borders
- **Default**: `#E2E8F0` (slate-200)
- **Hover**: `#CBD5E1` (slate-300)

---

## 6. Figma Component Checklist

### Card Components
- [ ] Report Card (Type 1)
  - [ ] Header (Category + Status)
  - [ ] Content (Product Name + Target Cost)
  - [ ] Actions (Primary + Ghost buttons)
- [ ] Decision Card
- [ ] Facts Card
- [ ] Pipeline Status Card

### Badge Components
- [ ] Status Badge (Completed, Verifying, Draft)
- [ ] Evidence Level Badge (Low, Medium, High)
- [ ] Fact Status Badge (Captured, Unreadable, Missing)

### Button Components
- [ ] Primary (slate-900)
- [ ] Secondary (Ghost)
- [ ] Text Link

### Typography Styles
- [ ] H1 (Hero)
- [ ] H2 (Section)
- [ ] H3 (Card Title)
- [ ] Body Large
- [ ] Body
- [ ] Body Small
- [ ] Caption

### Color Styles
- [ ] Primary Background
- [ ] Secondary Background
- [ ] Primary Text
- [ ] Secondary Text
- [ ] Muted Text
- [ ] Primary CTA
- [ ] Accent
- [ ] Status Colors (Success, Info, Warning, Neutral)
- [ ] Border

---

## 7. Implementation Examples

### Report Card Example (React/Tailwind)
```tsx
<div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
  {/* Header */}
  <div className="flex items-center justify-between mb-3">
    <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">
      {category}
    </span>
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium ${statusBadge[status]}`}>
      {status}
    </span>
  </div>
  
  {/* Product Name */}
  <h3 className="text-[18px] font-semibold text-slate-900 mb-4 line-clamp-2">
    {productName}
  </h3>
  
  {/* Target Cost */}
  <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 mb-4">
    <p className="text-[12px] font-medium text-slate-500 uppercase tracking-wide mb-0.5">
      Target Cost
    </p>
    <p className="text-[16px] font-bold text-slate-900">
      ${cost} / unit
    </p>
  </div>
  
  {/* Action Buttons */}
  <div className="flex items-center gap-3">
    <button className="flex-1 rounded-full bg-slate-900 px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:shadow-md transition-shadow">
      Request verification
    </button>
    <button className="px-5 py-2.5 rounded-full border border-slate-200 text-[14px] font-medium text-slate-900 hover:bg-slate-50 transition-colors">
      View report
    </button>
  </div>
</div>
```

---

## 8. Consistency Checklist

Verify for each screen implementation:
- [ ] Card radius: 16px (rounded-2xl)
- [ ] Border: 1px solid #E2E8F0
- [ ] Shadow: shadow-sm (default), shadow-md (hover)
- [ ] Padding: 16px (mobile), 20px (desktop)
- [ ] Badge: Pill shape, 12px text
- [ ] Button: Pill shape, "Verb + Domain Noun" format
- [ ] Typography: Headers bold and concise, body 13–14px
- [ ] Color: Base slate, only 1–2 accent colors

---

*By creating these components in Figma and reusing them across the Sample Report, Control Center, and Auth screens, you will achieve a consistent design that feels like a "Swell aesthetic on a B2B Sourcing OS."*
