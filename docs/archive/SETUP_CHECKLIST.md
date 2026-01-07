# 🚀 NexSupply Setup Checklist

## ✅ 완료된 작업

### 1. 프로젝트 구조
- ✅ Next.js 14 (App Router) 설정
- ✅ TypeScript + Tailwind CSS 구성
- ✅ Intelligence Pipeline 핵심 로직 구현
- ✅ Supabase 스키마 적용 완료

### 2. 데이터베이스
- ✅ 3개 테이블 생성 (product_analyses, supplier_products, product_supplier_matches)
- ✅ RLS 정책 설정
- ✅ 인덱스 및 트리거 구성
- ✅ **테스트 데이터 삽입 완료** (11개 제품)

### 3. 코드 파일
- ✅ `src/lib/intelligence-pipeline.ts` - 핵심 파이프라인
- ✅ `src/lib/gemini-service.ts` - Gemini API 서비스
- ✅ `src/app/api/test-pipeline/route.ts` - 테스트 API
- ✅ `supabase/seed_data.sql` - 시드 데이터 스크립트

---

## 🔧 실행 전 필수 설정

### Step 1: 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 내용을 입력하세요:

```bash
# Supabase (Project Settings -> API에서 확인)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini (https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your-gemini-api-key-here

# Fixer.io (선택사항)
FIXER_API_KEY=your-fixer-api-key-here
```

**⚠️ 중요:** `.env.local` 파일은 Git에 커밋되지 않습니다 (`.gitignore`에 포함됨)

### Step 2: Supabase 테스트 데이터 확인

이미 11개의 테스트 제품이 삽입되었습니다:
- Glassware: 3개
- Accessories: 2개
- Storage: 2개
- Paper Products: 2개
- Tools: 2개

추가 데이터가 필요하면 `supabase/seed_data.sql`을 Supabase SQL Editor에서 실행하세요.

### Step 3: 개발 서버 실행

```bash
cd nexsupply
npm run dev
```

서버가 `http://localhost:3000`에서 실행됩니다.

---

## 🧪 테스트 방법

### 방법 1: 브라우저에서 테스트

```
http://localhost:3000/api/test-pipeline?imageUrl=https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&quantity=100&dutyRate=0.15
```

### 방법 2: curl로 테스트

```bash
curl "http://localhost:3000/api/test-pipeline?imageUrl=https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&quantity=100&dutyRate=0.15"
```

### 방법 3: POST 요청 (JSON)

```bash
curl -X POST http://localhost:3000/api/test-pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    "quantity": 100,
    "dutyRate": 0.15,
    "shippingCost": 500,
    "fee": 100
  }'
```

---

## 📊 예상 결과

성공적인 응답 예시:

```json
{
  "success": true,
  "message": "Intelligence pipeline executed successfully",
  "data": {
    "productId": "uuid-here",
    "analysis": {
      "productName": "Glass Pipe",
      "category": "Glassware",
      "hsCode": "7013.99",
      "confidence": 0.9
    },
    "supplierMatches": [
      {
        "supplierName": "Hebei Glass Works Co.",
        "productName": "Borosilicate Glass Pipe 4inch",
        "matchScore": 85,
        "matchReason": "HS Code match, High name similarity"
      }
    ],
    "landedCosts": [
      {
        "totalLandedCost": 3.25,
        "formula": "Unit * (1+Duty) + Shipping + Fee = 2.50 * (1+0.15) + 5.00 + 1.00 = 3.25"
      }
    ],
    "cached": {
      "analysis": false,
      "matches": false
    }
  }
}
```

---

## 🐛 문제 해결

### 에러: "GEMINI_API_KEY is not defined"
- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인 (`GEMINI_API_KEY`)
- 서버를 재시작하세요 (`Ctrl+C` 후 `npm run dev`)

### 에러: "Failed to fetch image"
- 이미지 URL이 공개적으로 접근 가능한지 확인
- CORS 문제일 수 있음 (이미지 호스팅 서비스 사용 권장)

### 에러: "No supplier matches found"
- Supabase에 테스트 데이터가 있는지 확인
- `supabase/seed_data.sql`을 다시 실행

### 에러: "Row Level Security policy violation"
- Supabase 인증이 설정되어 있는지 확인
- RLS 정책을 임시로 비활성화하거나 서비스 키 사용 고려

---

## 📝 다음 단계

1. ✅ 환경 변수 설정
2. ✅ 테스트 실행
3. 🔄 실제 제품 이미지로 테스트
4. 🔄 프론트엔드 UI 개발
5. 🔄 프로덕션 배포

---

## 📚 참고 문서

- [Supabase 문서](https://supabase.com/docs)
- [Gemini API 문서](https://ai.google.dev/docs)
- [Next.js 문서](https://nextjs.org/docs)

