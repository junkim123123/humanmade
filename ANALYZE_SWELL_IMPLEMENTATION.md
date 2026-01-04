# Analyze 섹션 Swell 스타일 구현 가이드

## 개요
Swell 스타일의 3D 통일 가이드를 적용한 Analyze 섹션 구현입니다.

## 파일 구조
- `SWELL_3D_STYLE_GUIDE.md` - 전체 3D 스타일 원칙
- `src/components/analyze/AnalyzeFormSwell.tsx` - Swell 스타일 Analyze 폼

## 사용 방법

### 1. AnalyzePage에서 사용
```tsx
// src/components/analyze/AnalyzePage.tsx
import { AnalyzeFormSwell } from "@/components/analyze/AnalyzeFormSwell";

export function AnalyzePage({ mode }: AnalyzePageProps) {
  return (
    <div className="min-h-[calc(100vh-var(--topbar-h))] bg-gradient-to-b from-slate-50/90 to-slate-100/80">
      <AnalyzeFormSwell mode={mode} />
    </div>
  );
}
```

### 2. 주요 기능
- ✅ 파일 업로드 (Product, Barcode, Label)
- ✅ 이미지 프리뷰
- ✅ 폼 검증
- ✅ API 연동 및 폴링
- ✅ 에러 처리
- ✅ Swell 스타일 3D 카드 디자인

### 3. 스타일 특징
- **Level 1 보드**: 큰 섹션 래퍼 (rounded-3xl, 깊은 그림자)
- **Level 2 카드**: 업로드 카드들 (rounded-2xl, 중간 그림자)
- **Level 3 요소**: CTA 버튼 (rounded-full, 강한 그림자)
- **Hover 효과**: translate-y와 그림자 증가
- **그라데이션 배경**: from-slate-50/90 to-slate-100/80

## 다음 단계
1. AnalyzePage에서 AnalyzeFormSwell로 교체
2. 추가 기능 통합 (Advanced settings 등)
3. 드래그 앤 드롭 기능 추가
4. 이미지 편집 기능 추가

