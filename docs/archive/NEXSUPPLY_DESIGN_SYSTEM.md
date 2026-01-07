# NexSupply Design System
## "Swell 계열 비주얼 + B2B 소싱 OS"

### 전체 방향
- **비주얼**: Swell처럼 부드러운 카드/여백/톤
- **구조·언어**: 파이프라인, 리포트, 검증, 오더 중심의 B2B OS

---

## 화면별 역할 정리

### 1. 마케팅 사이트 (`/`)
**역할**: 신뢰/트랙레코드 강조
- Don Quijote, 7‑Eleven, Amazon 사례
- Hero, Flow Diorama, Margin Comparison, Proof Showcase

### 2. Analyze / Sample report (`/analyze`, `/sample-report/v2`)
**역할**: "Draft buy plan" — 숫자+리스크 요약 카드
- Pre-verification estimate
- Facts / Estimate / Proof 3단 구조
- Draft → Verification → Execution 흐름 명시

### 3. App 홈 / Reports (`/app/reports`)
**역할**: "Supply Chain Control Center" — 파이프라인 보드
- Sourcing, verification, logistics — all in one place
- Draft → Verification → Execution 시각화
- Pipeline 상태: Analyzing → Verifying → Ready to Order

---

## UI 스타일 가이드

### 카드 (Card)

#### Level 1: 섹션 래퍼 카드
```tsx
className="
  rounded-3xl border border-slate-200 bg-white/95
  shadow-[0_26px_70px_rgba(15,23,42,0.18)]
  backdrop-blur-sm p-5 sm:p-6
"
```

#### Level 2: 내부 컨텐츠 카드
```tsx
className="
  rounded-2xl border border-slate-200 bg-white/90
  shadow-[0_18px_45px_rgba(15,23,42,0.14)]
  hover:shadow-[0_24px_60px_rgba(15,23,42,0.22)]
  hover:-translate-y-[2px]
  transition-all p-4 sm:p-5
"
```

#### Level 3: 작은 정보 카드
```tsx
className="
  rounded-xl border border-slate-200 bg-slate-50/90
  shadow-[0_8px_20px_rgba(15,23,42,0.08)]
  p-3 sm:p-4
"
```

**공통 원칙:**
- 라운드 코너: `rounded-3xl` (Level 1), `rounded-2xl` (Level 2), `rounded-xl` (Level 3)
- 연한 그림자: 깊이감 있지만 부드럽게
- 섹션별 헤더 + 짧은 설명 한 줄
- Hover 효과: 살짝 위로 떠오르는 느낌 (`-translate-y-[2px]`)

---

### 뱃지 (Badge)

#### 상태 뱃지 (Status Badge)
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

**원칙:**
- Pill형 (`rounded-full`)
- 색은 절제: emerald, amber, slate, yellow, blue만 사용
- 텍스트: `text-[12px] font-medium`
- 아이콘 포함 가능 (gap-1.5)

---

### 버튼 (Button)

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

**원칙:**
- 항상 "동사 + 도메인 명사": "Start verification", "View report", "Move to orders"
- Primary: 깊은 그림자, Secondary: 얕은 그림자 또는 border만
- `rounded-full` (pill shape)

---

### 타이포그래피 (Typography)

#### 헤더
```tsx
// H1 (Hero)
className="text-[28px] sm:text-[32px] font-bold text-slate-900 leading-tight"

// H2 (Section)
className="text-[20px] sm:text-[22px] font-semibold text-slate-900"

// H3 (Card Title)
className="text-[16px] font-semibold text-slate-900"
```

#### 바디
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

**원칙:**
- 헤더는 굵고 짧게 (`font-bold` 또는 `font-semibold`)
- 바디는 13–14px로 읽기 편하게
- 색상: `text-slate-900` (헤더), `text-slate-600` (바디), `text-slate-500` (캡션)

---

### 색상 (Color Palette)

#### 베이스
- **White**: `bg-white` / `bg-white/95` (카드 배경)
- **Slate 50**: `bg-slate-50` (섹션 배경)
- **Slate 100**: `bg-slate-100` (뱃지, 아이콘 배경)
- **Slate 200**: `border-slate-200` (경계선)
- **Slate 600**: `text-slate-600` (바디 텍스트)
- **Slate 900**: `text-slate-900` (헤더, Primary 버튼)

#### 포인트 색상 (1–2색만 사용)
- **Emerald** (성공/완료): `bg-emerald-100 text-emerald-700 border-emerald-200`
- **Amber** (진행중/주의): `bg-amber-100 text-amber-700 border-amber-200`
- **Blue** (정보/액션 필요): `bg-blue-100 text-blue-700 border-blue-200`
- **Yellow** (경고/리스크): `bg-yellow-100 text-yellow-700 border-yellow-200`

**원칙:**
- 베이스는 흰색/슬레이트
- 포인트는 딱 1–2색만 사용 (상황에 따라)
- 절제된 색상 사용

---

### 여백 (Spacing)

#### 섹션 간격
```tsx
// Section Padding
className="py-12 lg:py-16"

// Container Padding
className="px-4 sm:px-6 lg:px-8"

// Max Width
className="max-w-5xl mx-auto" // Reports/App
className="max-w-6xl mx-auto" // Marketing
```

#### 카드 내부 여백
```tsx
// Level 1 Card
className="p-5 sm:p-6"

// Level 2 Card
className="p-4 sm:p-5"

// Level 3 Card
className="p-3 sm:p-4"
```

**원칙:**
- Swell처럼 넉넉한 여백
- 반응형: 모바일은 작게, 데스크톱은 크게

---

### 파이프라인 시각화

#### 3단계 흐름
```
Draft → Verification → Execution
```

**시각 표현:**
- 각 단계는 카드로 표시
- 화살표 또는 경로로 연결
- 상태 뱃지로 현재 단계 표시

**텍스트:**
- "Draft buy plan" (초안)
- "Start verification" (검증 시작)
- "Move to orders" (주문으로 이동)

---

## 카피 가이드

### 버튼/액션 텍스트
항상 **"동사 + 도메인 명사"** 형식:
- ✅ "Start verification"
- ✅ "View report"
- ✅ "Move to orders"
- ✅ "View logistics"
- ❌ "Verify now"
- ❌ "See details"

### 섹션 헤더
**"역할 + 한 줄 설명"** 형식:
- "Draft buy plan — we'll lock numbers after verification."
- "Supply Chain Control Center — monitor your sourcing pipeline"
- "Facts — captured from your product photos"

### 상태 설명
**"현재 상태 + 다음 액션"** 형식:
- "Draft range (duty, freight, unit landed cost). Confirmed during verification."
- "Suggested by trade data — verify before ordering."
- "Ready to move? Start verification and we'll take it to production."

---

## 컴포넌트 예시

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

## Figma 컴포넌트 스타일

### 카드 스타일
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
- **Background**: `#FFFFFF` 또는 `rgba(255, 255, 255, 0.95)`

### 뱃지 스타일
- **Shape**: Pill (100% corner radius)
- **Padding**: 12px horizontal, 6px vertical
- **Typography**: 12px, Medium weight
- **Colors**:
  - Completed: Background `#D1FAE5`, Text `#047857`, Border `#A7F3D0`
  - Verifying: Background `#FEF3C7`, Text `#B45309`, Border `#FDE68A`
  - Draft: Background `#F1F5F9`, Text `#334155`, Border `#CBD5E1`
  - Risk: Background `#FEF9C3`, Text `#854D0E`, Border `#FDE047`
  - Action: Background `#DBEAFE`, Text `#1E40AF`, Border `#BFDBFE`

### 버튼 스타일
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

### 타이포그래피 스타일
- **H1**: 32px, Bold, `#0F172A`
- **H2**: 22px, Semibold, `#0F172A`
- **H3**: 16px, Semibold, `#0F172A`
- **Body Large**: 15px, Regular, `#475569`
- **Body**: 14px, Regular, `#475569`
- **Body Small**: 13px, Regular, `#475569`
- **Caption**: 12px, Regular, `#64748B`

---

## 구현 체크리스트

### 각 화면에 추가할 것
- [ ] 상단에 "이 화면이 무슨 역할인지" 한 줄 설명
- [ ] Draft → Verification → Execution 3단계 시각화
- [ ] 상태 뱃지로 현재 단계 표시
- [ ] 버튼/액션은 "동사 + 도메인 명사" 형식

### 스타일 통일
- [ ] 카드: Level 1/2/3 구분 명확히
- [ ] 뱃지: Pill형, 절제된 색상
- [ ] 버튼: Primary/Secondary 구분
- [ ] 타이포: 헤더 굵고 짧게, 바디 13–14px
- [ ] 색상: 베이스는 슬레이트, 포인트는 1–2색만

---

## 참고 레퍼런스

- **Swell**: 부드러운 카드, 넉넉한 여백, 친근한 톤
- **B2B OS**: 파이프라인 중심, 상태 기반, 액션 명확
- **기존 NexSupply**: 무역/로지스틱스 용어 유지

---

*이 가이드는 NexSupply의 "Swell 계열 비주얼 + B2B 소싱 OS" 정체성을 유지하면서 일관된 사용자 경험을 제공하기 위한 것입니다.*

