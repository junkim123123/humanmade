# NexSupply 실전 컴포넌트 가이드
## Swell 계열 느낌 + B2B 소싱 OS

> Figma에서 바로 사용할 수 있는 컴포넌트 스펙

---

## 1. 카드 (Card) 컴포넌트

### 기본 스펙
- **Radius**: 16px (`rounded-2xl`)
- **Border**: 1px solid `#E2E8F0` (slate-200)
- **Shadow**: 
  - 기본: `0px 1px 3px rgba(0, 0, 0, 0.1)` (shadow-sm)
  - Hover: `0px 4px 6px rgba(0, 0, 0, 0.1)` (shadow-md)
- **Padding**: 
  - 모바일: 16px
  - 데스크톱: 20px
- **Background**: `#FFFFFF`

### 타입 1: 리포트 카드 (Your Products)

**레이아웃 구조:**
```
┌─────────────────────────────────────────┐
│ [Category]                    [Status]   │
│                                          │
│ Product Name (2줄까지)                  │
│ Target cost  $0.59 / unit               │
│                                          │
│ [Request verification]  [View report]   │
└─────────────────────────────────────────┘
```

**Figma 컴포넌트 스펙:**

#### 상단 헤더 영역
- **왼쪽: 카테고리**
  - 텍스트: 12px, Medium, `#64748B` (slate-500)
  - Uppercase, tracking-wide
  - 예: "CONFECTIONERY & COLLECTIBLE TOYS"

- **오른쪽: 상태 Pill**
  - Completed: `bg-emerald-50`, `text-emerald-700`, `border-emerald-200`
  - Verifying: `bg-blue-50`, `text-blue-700`, `border-blue-200`
  - Draft: `bg-slate-50`, `text-slate-700`, `border-slate-200`
  - Size: 12px, Medium, Pill shape (100% corner radius)
  - Padding: 6px horizontal, 3px vertical

#### 중간 콘텐츠 영역
- **제품명**
  - 텍스트: 18px, Semibold, `#0F172A` (slate-900)
  - Line height: 1.4
  - Max 2 lines, ellipsis
  - Margin bottom: 16px

- **Target Cost**
  - 레이블: 12px, Medium, Uppercase, `#64748B`
  - 값: 16px, Bold, `#0F172A`
  - 배경: `#F8FAFC` (slate-50), border `#E2E8F0`
  - Padding: 12px
  - Border radius: 8px
  - Margin bottom: 16px

#### 하단 액션 영역
- **Primary 버튼**: "Request verification"
  - Background: `#0F172A` (slate-900)
  - Text: 14px, Semibold, `#FFFFFF`
  - Padding: 10px 20px
  - Border radius: 999px (pill)
  - Shadow: `0px 4px 6px rgba(15, 23, 42, 0.1)`

- **Ghost 버튼**: "View report"
  - Background: Transparent
  - Text: 14px, Medium, `#0F172A`
  - Border: 1px solid `#E2E8F0`
  - Padding: 10px 20px
  - Border radius: 999px (pill)

**간격:**
- 버튼 간격: 12px
- 섹션 간격: 16px

---

## 2. 뱃지 / Pill 스타일

### 상태 뱃지

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

### 증거 레벨 뱃지 (Sample Report)

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

**공통 스펙:**
- Size: 12px, Medium
- Shape: Pill (100% corner radius)
- Padding: 6px 12px

---

## 3. 타이포그래피 & 톤

### 헤더
- **H1 (Hero)**: 32–40px, Bold, `#0F172A`
  - 예: "Sourcing, verification, logistics — all in one place."
- **H2 (Section)**: 18–24px, Semibold, `#0F172A`
  - 예: "Supply Chain Control Center", "Decision", "Verified facts"
- **H3 (Card Title)**: 16px, Semibold, `#0F172A`

### 서브텍스트
- **Body Large**: 15px, Regular, `#64748B`
  - Line height: 1.6
  - Max 2 lines
  - 예: "Track every product from first estimate to delivery."

- **Body**: 14px, Regular, `#64748B`
- **Body Small**: 13px, Regular, `#64748B`

### 카피 패턴 (Swell 리듬 + NexSupply 도메인)

**원칙:**
- 친근하지만 전문적
- "동사 + 도메인 명사" 형식
- 다음 액션을 명확히 제시

**예시:**
- ✅ "Save your reports, not just links."
- ✅ "Happy with this estimate? Start verification to turn it into a real order."
- ✅ "We run the factory chaos so you can keep selling."
- ✅ "Ready to move? Start verification and we'll take it to production."
- ✅ "Pick any completed report and request verification to kick off production."

---

## 4. 페이지별 디자인 스냅샷

### 1) App 홈 (Control Center)

#### 상단 히어로 카드
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

**스펙:**
- Background: `#0F172A` (slate-900) gradient
- Text: White
- Padding: 40px
- Border radius: 16px
- CTA 버튼: White background, slate-900 text

#### 파이프라인 카드 4개 (Grid)
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

**스펙:**
- Background: `#FFFFFF`
- Border: 1px solid `#E2E8F0`
- Border radius: 12px
- Padding: 20px
- 숫자: 32px, Bold, `#0F172A`
- 레이블: 14px, Regular, `#64748B`
- 아이콘: 20px, 배경 `#F8FAFC`

#### Your Products 리스트
- 리포트 카드 (타입 1) 반복
- 카드 간격: 16px

---

### 2) Sample Report (Decision / Proof)

#### 상단 Decision 카드
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

**스펙:**
- Background: `#FFFFFF`
- Border: 1px solid `#E2E8F0`
- Border radius: 16px
- Padding: 24px
- 큰 숫자: 28px, Bold, `#0F172A`
- Range 텍스트: 13px, Regular, `#64748B`
- Evidence pill: Medium evidence 스타일
- 하단 버튼: Primary + Secondary

#### Verified Facts 카드
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

**스펙:**
- 각 Fact 항목: Background `#F8FAFC`, border `#E2E8F0`
- Captured pill: emerald 스타일
- Unreadable pill: amber 스타일
- Missing pill: slate 스타일

#### Suppliers 카드
- 각 후보 팩토리를 작은 카드로 표시
- Background: `#F8FAFC`
- Border: 1px solid `#E2E8F0`
- Border radius: 12px
- Padding: 16px

---

### 3) Analyze / Auth (Swell 톤 강조)

#### Analyze 페이지

**레이아웃:**
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
│ └──────────────┘  │ [Calculate]         │ │
│                    └──────────────────────┘ │
└─────────────────────────────────────────────┘
```

**스펙:**
- 메인 보드: Level 1 카드 (rounded-3xl, 깊은 shadow)
- 업로드 카드: Level 2 카드
- Assumptions 패널: Level 2 카드
- CTA 버튼: Primary 스타일

#### Sign in / Sign up 페이지

**레이아웃:**
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

**스펙:**
- 중앙 정렬
- 카드: rounded-2xl, shadow-sm
- Padding: 32px
- 폼 요소 간격: 16px

---

## 5. 색 팔레트

### 기본 배경
- **Primary**: `#FFFFFF`
- **Secondary**: `#F8FAFC` (slate-50)

### 텍스트
- **Primary**: `#0F172A` (slate-900)
- **Secondary**: `#64748B` (slate-500/600)
- **Muted**: `#94A3B8` (slate-400)

### 포인트 색상
- **Primary CTA**: `#0F172A` ~ `#020617` (slate-900)
- **Accent**: `#2563EB` (blue-600) 또는 `#059669` (emerald-600) - 하나만 선택

### 상태 색상
- **Success/Completed**: `#047857` (emerald-700), `#D1FAE5` (emerald-50)
- **Info/Verifying**: `#1E40AF` (blue-700), `#DBEAFE` (blue-50)
- **Warning**: `#B45309` (amber-700), `#FEF3C7` (amber-50)
- **Neutral**: `#334155` (slate-700), `#F1F5F9` (slate-50)

### Border
- **Default**: `#E2E8F0` (slate-200)
- **Hover**: `#CBD5E1` (slate-300)

---

## 6. Figma 컴포넌트 체크리스트

### 카드 컴포넌트
- [ ] 리포트 카드 (타입 1)
  - [ ] 상단 헤더 (카테고리 + 상태)
  - [ ] 중간 콘텐츠 (제품명 + Target Cost)
  - [ ] 하단 액션 (Primary + Ghost 버튼)
- [ ] Decision 카드
- [ ] Facts 카드
- [ ] Pipeline Status 카드

### 뱃지 컴포넌트
- [ ] 상태 뱃지 (Completed, Verifying, Draft)
- [ ] 증거 레벨 뱃지 (Low, Medium, High)
- [ ] Fact 상태 뱃지 (Captured, Unreadable, Missing)

### 버튼 컴포넌트
- [ ] Primary (slate-900)
- [ ] Secondary (Ghost)
- [ ] Text Link

### 타이포그래피 스타일
- [ ] H1 (Hero)
- [ ] H2 (Section)
- [ ] H3 (Card Title)
- [ ] Body Large
- [ ] Body
- [ ] Body Small
- [ ] Caption

### 색상 스타일
- [ ] Primary Background
- [ ] Secondary Background
- [ ] Primary Text
- [ ] Secondary Text
- [ ] Muted Text
- [ ] Primary CTA
- [ ] Accent
- [ ] 상태 색상 (Success, Info, Warning, Neutral)
- [ ] Border

---

## 7. 사용 예시

### 리포트 카드 구현 예시
```tsx
<div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
  {/* 상단 헤더 */}
  <div className="flex items-center justify-between mb-3">
    <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">
      {category}
    </span>
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium ${statusBadge[status]}`}>
      {status}
    </span>
  </div>
  
  {/* 제품명 */}
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
  
  {/* 액션 버튼 */}
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

## 8. 일관성 체크리스트

각 화면 구현 시 확인:
- [ ] 카드 radius: 16px (rounded-2xl)
- [ ] Border: 1px solid #E2E8F0
- [ ] Shadow: shadow-sm (기본), shadow-md (hover)
- [ ] Padding: 16px (모바일), 20px (데스크톱)
- [ ] 뱃지: Pill shape, 12px 텍스트
- [ ] 버튼: Pill shape, "동사 + 도메인 명사" 형식
- [ ] 타이포: 헤더 굵고 짧게, 바디 13–14px
- [ ] 색상: 베이스 슬레이트, 포인트 1–2색만

---

*이 가이드를 Figma에서 컴포넌트로 만들고, Sample report, Control Center, Auth 세 화면에 재사용하면 "Swell 느낌인데 소싱 OS 같은" 일관된 디자인이 완성됩니다.*

