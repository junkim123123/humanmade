# 🔧 DB 마이그레이션 실행 가이드

## 문제
`image_url` 컬럼에 base64 data URL을 저장하려고 하면 인덱스 크기 제한(8191 bytes)을 초과하여 에러가 발생합니다.

## 해결 방법
다음 SQL을 Supabase SQL Editor에서 실행하세요.

## 실행 단계

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 "SQL Editor" 클릭
   - "New query" 버튼 클릭

3. **아래 SQL 복사 & 붙여넣기**

```sql
-- Step 1: Drop the UNIQUE constraint on (product_id, image_url)
ALTER TABLE public.product_analyses 
  DROP CONSTRAINT IF EXISTS product_analyses_product_id_image_url_key;

-- Step 2: Make image_url nullable (data URLs won't be stored)
ALTER TABLE public.product_analyses 
  ALTER COLUMN image_url DROP NOT NULL;

-- Step 3: Drop the index on image_url (too large for base64 data URLs)
DROP INDEX IF EXISTS public.idx_product_analyses_image_url;

-- Step 4: Add unique index on image_hash (used as cache key)
CREATE UNIQUE INDEX IF NOT EXISTS product_analyses_image_hash_uq
  ON public.product_analyses (image_hash)
  WHERE image_hash IS NOT NULL;

-- Step 5: Add comments
COMMENT ON COLUMN public.product_analyses.image_url IS 'Original image URL (null for data URLs to avoid index size limits)';
COMMENT ON COLUMN public.product_analyses.image_hash IS 'SHA-256 hash of image used as cache key. Unique index ensures no duplicates.';
```

4. **실행**
   - "Run" 버튼 클릭 (또는 Ctrl+Enter)
   - 성공 메시지 확인

5. **검증 (선택사항)**
   - 아래 쿼리로 인덱스 확인:
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'product_analyses'
   ORDER BY indexname;
   ```

## 예상 결과

- ✅ `product_analyses_product_id_image_url_key` 제약 제거됨
- ✅ `image_url` 컬럼이 nullable로 변경됨
- ✅ `idx_product_analyses_image_url` 인덱스 제거됨
- ✅ `product_analyses_image_hash_uq` unique 인덱스 생성됨

## 주의사항

- 이 마이그레이션은 기존 데이터에 영향을 주지 않습니다 (안전함)
- `IF EXISTS` / `IF NOT EXISTS`를 사용하여 이미 실행된 경우에도 안전합니다
- 마이그레이션 후 코드가 정상적으로 작동하는지 테스트하세요

