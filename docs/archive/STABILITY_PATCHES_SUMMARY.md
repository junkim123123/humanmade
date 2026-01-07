# 안정화 패치 요약

## ✅ 완료된 패치

### 1. intelligence-pipeline.ts OR 필터 강화
- `normalizeTerm` 함수 강화: `[%_(),.]` 제거, 길이 제한 40자
- 최소 2자 필터링 추가
- fallback anchor keywords도 동일한 패턴 재사용
- select 컬럼을 공백 없이 지정 (성능 개선)

### 2. reports 페이지 서버 컴포넌트로 리팩토링
- `app/reports/[reportId]/page.tsx` → 서버 컴포넌트
- `app/reports/[reportId]/ReportClient.tsx` → 클라이언트 컴포넌트
- `not-found.tsx` 자동 적용 (404 시)

### 3. savedReport 플래그 추가
- `/api/analyze` 응답에 `savedReport: boolean` 추가
- analyze 페이지에서 `savedReport === false`면 리포트로 이동하지 않음
- 사용자에게 "리포트 저장 실패" 안내 표시

### 4. pg_trgm 인덱스 마이그레이션
- `supabase/migrations/add_trgm_index.sql` 생성
- Supabase Dashboard에서 실행 필요

## 📋 적용해야 할 마이그레이션

### Supabase Dashboard > SQL Editor에서 실행:

```sql
-- 1. pg_trgm extension 및 인덱스
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS supplier_products_name_trgm
  ON supplier_products USING gin (product_name gin_trgm_ops);

-- 2. supplier matches 캐시 unique index
CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_product_supplier_uq
  ON public.product_supplier_matches (product_id, supplier_id)
  WHERE product_id IS NOT NULL AND supplier_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_analysis_supplier_uq
  ON public.product_supplier_matches (analysis_id, supplier_id)
  WHERE analysis_id IS NOT NULL AND supplier_id IS NOT NULL;
```

### 인덱스 확인:

```sql
-- pg_trgm 인덱스 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'supplier_products'
AND indexname = 'supplier_products_name_trgm';

-- supplier matches unique index 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'product_supplier_matches'
AND indexname IN (
  'product_supplier_matches_product_supplier_uq',
  'product_supplier_matches_analysis_supplier_uq'
);
```

## 🧪 테스트 체크리스트

1. **분석 1회 실행 후 reports 테이블에 row 생성 확인**
   - Supabase Dashboard > Table Editor > reports
   - 새로운 row가 생성되었는지 확인

2. **같은 입력으로 2회 실행 시 reportId 동일 확인**
   - 같은 이미지, 같은 파라미터로 2번 실행
   - 같은 `reportId`로 라우팅되는지 확인
   - 서버 로그에 "Found existing report, upsert success" 메시지 확인

3. **supplier 검색이 timeout 없이 5초 내로 완료되는지 확인**
   - 서버 로그에서 statement timeout 에러 없음
   - 검색 결과가 5초 내에 반환됨

4. **프로덕션에서 mock fallback 로그가 절대 안 뜨는지 확인**
   - 서버 로그에서 "Report not found in DB, trying mock fallback" 메시지 없음
   - 모든 리포트가 DB에서 조회됨

5. **저장 실패 시 사용자 안내 확인**
   - `SUPABASE_SERVICE_ROLE_KEY` 누락 시 에러 메시지 표시
   - 리포트로 이동하지 않고 "저장 실패" 안내만 표시

6. **404 페이지 작동 확인**
   - 존재하지 않는 reportId 접근 시 `not-found.tsx` 표시
   - "새 분석 시작하기" 버튼 동작 확인

## 🔍 확인 사항

### 환경변수
- `SUPABASE_SERVICE_ROLE_KEY` 설정 확인 (NEXT_PUBLIC 없이)
- 로컬: `.env.local`에 추가 후 서버 재시작
- Vercel: Project Settings > Environment Variables에 추가 후 재배포

### 런타임 설정
- `export const runtime = "nodejs";` 확인됨 (`/api/analyze`)
- `export const dynamic = "force-dynamic";` 확인됨 (`/reports/[reportId]/page.tsx`)

