# Swell 스타일 3D 통일 가이드

## 전체 3D 스타일 원칙

### 배경
- 아주 옅은 gradient + subtle noise, 상단에서 하단으로 살짝 어두워지는 톤
- `bg-slate-50/80` 또는 `bg-gradient-to-b from-slate-50/90 to-slate-100/80`
- Page padding: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`

### 카드/패널 공통 스타일

#### 기본 스타일
- **Radius**: `rounded-2xl` (18–20px)
- **3D 느낌**:
  ```tsx
  className="
    bg-white/90 border border-slate-200
    shadow-[0_18px_45px_rgba(15,23,42,0.12)]
    backdrop-blur-sm
  "
  ```
- **Hover 효과**:
  ```tsx
  className="
    hover:translate-y-[-2px]
    hover:shadow-[0_24px_55px_rgba(15,23,42,0.18)]
    transition-all duration-300
  "
  ```
- **안쪽 padding**: `p-5 sm:p-6 lg:p-7`

### 깊이 레벨 (Z-index 계층)

#### Level 1: 섹션 전체 래퍼 카드
```tsx
className="
  rounded-3xl border border-slate-200/80 bg-white/95
  shadow-[0_22px_60px_rgba(15,23,42,0.15)]
  backdrop-blur-sm
  px-4 py-5 sm:p-6 lg:p-7
"
```

#### Level 2: 내부 카드/패널
```tsx
className="
  rounded-2xl border border-slate-200 bg-slate-50/90
  shadow-[0_16px_40px_rgba(15,23,42,0.12)]
  p-5
"
```

#### Level 3: CTA 버튼 및 작은 요소
```tsx
// CTA 버튼
className="
  rounded-full bg-slate-900 px-4 py-2.5
  shadow-[0_18px_40px_rgba(15,23,42,0.4)]
  hover:shadow-[0_22px_55px_rgba(15,23,42,0.5)]
  transition-all
"

// 작은 pill 배지
className="
  rounded-full bg-slate-100 px-2.5 py-1
  text-xs font-medium
"
```

### 색상 토큰
- **Primary background**: `bg-white/90` ~ `bg-white/95`
- **Secondary background**: `bg-slate-50/80` ~ `bg-slate-50/90`
- **Border**: `border-slate-200` ~ `border-slate-200/80`
- **Text primary**: `text-slate-900`
- **Text secondary**: `text-slate-600`
- **Text muted**: `text-slate-500`

### 적용 범위
이 스타일 규칙을 다음 섹션에 통일 적용:
- Hero 섹션
- Analyze 섹션
- Pricing 섹션
- Sample report 섹션
- Proof 섹션

