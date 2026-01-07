# 최종 패치 요약

## ✅ 완료된 패치

### 1. intelligence-pipeline.ts OR 필터 정리
- `normalizeTerm` 함수 추가로 SQL injection 방지 및 깔끔한 필터 생성
- OR 키워드를 6개로 제한 (statement timeout 방지)
- fallback anchor keywords도 동일하게 정리
- select 컬럼을 필요한 것만 지정하여 성능 개선

### 2. pg_trgm 인덱스 마이그레이션
- `supabase/migrations/add_trgm_index.sql` 생성
- `pg_trgm` extension 활성화
- `supplier_products.product_name`에 GIN trigram 인덱스 추가
- ilike 검색 성능 대폭 개선

### 3. not-found.tsx 작동하도록 수정
- reports 페이지에서 404 에러 시 "NOT_FOUND" 상태 설정
- 조건부 렌더링으로 not-found UI 표시
- "새 분석 시작하기" 및 "홈으로 돌아가기" 버튼 추가

### 4. 저장 실패 시 사용자 안내
- `SUPABASE_SERVICE_ROLE_KEY` 누락 시 명확한 에러 메시지 반환
- 사용자에게 "리포트 저장 실패" 안내 제공

## 📋 적용해야 할 마이그레이션

### Supabase Dashboard에서 실행:

```sql
-- 1. pg_trgm extension 및 인덱스
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS supplier_products_name_trgm
  ON supplier_products USING gin (product_name gin_trgm_ops);

-- 2. supplier matches 캐시 unique index (이전에 언급됨)
CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_product_supplier_uq
  ON public.product_supplier_matches (product_id, supplier_id)
  WHERE product_id IS NOT NULL AND supplier_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_analysis_supplier_uq
  ON public.product_supplier_matches (analysis_id, supplier_id)
  WHERE analysis_id IS NOT NULL AND supplier_id IS NOT NULL;
```

## 🧪 테스트 체크리스트

1. **같은 이미지, 같은 파라미터로 2번 실행**
   - ✅ 같은 `reportId`로 라우팅되는지 확인
   - ✅ 서버 로그에 "Found existing report, upsert success" 메시지 확인

2. **Supabase reports 테이블 확인**
   - ✅ `reports` 테이블에 row가 1개만 있는지 확인
   - ✅ `input_key`가 dedupe 역할을 하는지 확인

3. **서버 로그 확인**
   - ✅ 프로덕션에서 mock fallback이 절대 안 뜨는지 확인
   - ✅ "Report saved successfully" 또는 "Found existing report" 메시지 확인

4. **404 테스트**
   - ✅ 존재하지 않는 reportId 접근 시 not-found UI 표시 확인
   - ✅ "새 분석 시작하기" 버튼 동작 확인

5. **성능 테스트**
   - ✅ anchor keywords 검색 시 statement timeout이 발생하지 않는지 확인
   - ✅ pg_trgm 인덱스 적용 후 검색 속도 개선 확인

