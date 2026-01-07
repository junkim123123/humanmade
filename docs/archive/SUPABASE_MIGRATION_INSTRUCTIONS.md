# Supplier Matches Cache Index 마이그레이션 적용 방법

## 문제
`product_supplier_matches` 테이블에서 `upsert` 시 "Missing unique index" 에러 발생

## 해결
두 개의 unique index를 생성해야 합니다.

## 적용 방법 (가장 쉬움)

### 1. Supabase Dashboard 사용

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **SQL Editor** 클릭
4. 아래 SQL을 복사해서 붙여넣기
5. **Run** 버튼 클릭

```sql
-- Create unique index for product_id + supplier_id combination
CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_product_supplier_uq
  ON public.product_supplier_matches (product_id, supplier_id)
  WHERE product_id IS NOT NULL AND supplier_id IS NOT NULL;

-- Create unique index for analysis_id + supplier_id combination
CREATE UNIQUE INDEX IF NOT EXISTS product_supplier_matches_analysis_supplier_uq
  ON public.product_supplier_matches (analysis_id, supplier_id)
  WHERE analysis_id IS NOT NULL AND supplier_id IS NOT NULL;

COMMENT ON INDEX product_supplier_matches_product_supplier_uq IS 'Unique index for upsert conflict resolution when product_id is present';
COMMENT ON INDEX product_supplier_matches_analysis_supplier_uq IS 'Unique index for upsert conflict resolution when analysis_id is present';
```

### 2. 확인

마이그레이션 적용 후 아래 쿼리로 확인:

```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'product_supplier_matches'
AND indexname IN (
  'product_supplier_matches_product_supplier_uq',
  'product_supplier_matches_analysis_supplier_uq'
)
ORDER BY indexname;
```

두 개의 인덱스가 보이면 성공입니다.

## 파일 위치

- 마이그레이션 파일: `supabase/migration_fix_supplier_matches_cache.sql`
- 적용용 파일: `supabase/apply-supplier-matches-index.sql`

