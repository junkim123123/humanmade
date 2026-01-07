# NexSupply 데이터베이스 사용 현황 분석 리포트

## 📊 실제 사용 중인 테이블 목록 (코드 분석 결과)

### ✅ 핵심 테이블 (필수 - 절대 삭제 불가)

1. **profiles** ✅
   - 사용 빈도: 매우 높음
   - 용도: 사용자 인증, 권한 관리
   - 코드 위치: `src/server/actions/profile.ts`, `src/app/api/analyze/route.ts`

2. **reports** ✅
   - 사용 빈도: 매우 높음 (42회 참조)
   - 용도: 리포트 생성, 조회, 업데이트
   - 코드 위치: 거의 모든 리포트 관련 파일

3. **supplier_products** ✅
   - 사용 빈도: 매우 높음 (20회 참조)
   - 용도: Intelligence Pipeline, 공장 매칭
   - 코드 위치: `src/lib/intelligence-pipeline.ts` (핵심)

4. **product_supplier_matches** ✅
   - 사용 빈도: 높음 (5회 참조)
   - 용도: 매칭 결과 캐싱
   - 코드 위치: `src/lib/intelligence-pipeline.ts`, `src/app/api/reports/[reportId]/route.ts`

5. **product_analyses** ✅
   - 사용 빈도: 중간 (4회 참조)
   - 용도: AI 분석 결과 저장
   - 코드 위치: `src/lib/intelligence-pipeline.ts`

6. **credits** ✅
   - 사용 빈도: 높음 (7회 참조)
   - 용도: 크레딧 잔액 관리
   - 코드 위치: `src/server/actions/credits.ts`

7. **credit_transactions** ✅
   - 사용 빈도: 중간 (2회 참조)
   - 용도: 크레딧 거래 내역
   - 코드 위치: `src/server/actions/credits.ts`

8. **orders** ✅
   - 사용 빈도: 매우 높음 (24회 참조)
   - 용도: 주문 관리
   - 코드 위치: `src/server/actions/orders.ts`, `src/app/admin/page.tsx`

### ⚠️ Order 워크플로우 테이블 (복잡하지만 필요)

9. **order_messages** ✅ (6회 참조)
10. **order_events** ✅ (10회 참조)
11. **order_quotes** ✅ (4회 참조)
12. **order_uploads** ✅ (3회 참조)
13. **order_milestones** ✅ (3회 참조)
14. **order_documents** ✅ (1회 참조)
15. **order_cost_models** ✅ (3회 참조)
16. **order_partner_assignments** ✅ (2회 참조)
17. **order_rfqs** ✅ (2회 참조)

### 📋 기타 사용 중인 테이블

18. **verification_requests** ✅ (4회 참조) - `verifications` 테이블과 별개
19. **leads** ✅ (3회 참조)
20. **invoices** ✅ (6회 참조)
21. **admin_users** ✅ (1회 참조)
22. **report_importkey_companies** ✅ (2회 참조)
23. **supplier_enrichment** ✅ (3회 참조)
24. **suppliers** ✅ (3회 참조)
25. **supplier_import_stats** ✅ (1회 참조)
26. **user_credits** ✅ (2회 참조) - `credits`와 별개로 사용

### ❌ 사용되지 않는 테이블 (정리 가능)

1. **verifications** ❌
   - schema.sql에 정의되어 있지만 코드에서 사용 안 함
   - 대신 `verification_requests` 사용
   - **삭제 가능**: 코드에서 참조 없음

2. **messages** ❌
   - schema.sql에 정의되어 있지만 코드에서 사용 안 함
   - 대신 `order_messages` 사용
   - **삭제 가능**: 코드에서 참조 없음

3. **files** ❌
   - schema.sql에 정의되어 있지만 코드에서 사용 안 함
   - 실제로는 Supabase Storage 직접 사용
   - **삭제 가능**: 코드에서 참조 없음

## 🔍 RPC 함수 사용 현황

### ❌ 사용되지 않는 함수
- `add_user_credits` - 이미 직접 SQL로 대체됨 (방금 수정함)

### ✅ 사용 중인 함수
- 없음 (모두 직접 SQL 쿼리 사용)

## 💡 정리 제안 및 실행 계획

### 🟢 즉시 삭제 가능 (안전)

다음 3개 테이블은 코드에서 전혀 사용되지 않으므로 안전하게 삭제 가능:

```sql
-- 1. verifications 테이블 삭제 (verification_requests 사용 중)
DROP TABLE IF EXISTS public.verifications CASCADE;

-- 2. messages 테이블 삭제 (order_messages 사용 중)
DROP TABLE IF EXISTS public.messages CASCADE;

-- 3. files 테이블 삭제 (Storage 직접 사용)
DROP TABLE IF EXISTS public.files CASCADE;
```

### 🟡 검토 필요 (신중하게)

- **Order 관련 테이블 9개**: 워크플로우가 복잡해서 모두 필요할 수 있음
- 일부는 JSONB 필드로 통합 가능하지만, 데이터 무결성과 쿼리 성능을 고려해야 함

### 🔴 절대 삭제 금지

- 핵심 테이블 8개 (profiles, reports, supplier_products, product_supplier_matches, product_analyses, credits, credit_transactions, orders)
- Order 워크플로우 테이블 9개
- 기타 사용 중인 테이블 9개

## 📝 실행 가능한 정리 스크립트

다음 SQL을 실행하면 사용되지 않는 테이블을 안전하게 삭제할 수 있습니다:

```sql
-- 사용되지 않는 테이블 삭제 (안전)
BEGIN;

-- 1. verifications 삭제 (verification_requests 사용 중)
DROP TABLE IF EXISTS public.verifications CASCADE;

-- 2. messages 삭제 (order_messages 사용 중)  
DROP TABLE IF EXISTS public.messages CASCADE;

-- 3. files 삭제 (Storage 직접 사용)
DROP TABLE IF EXISTS public.files CASCADE;

-- 관련 인덱스도 자동 삭제됨 (CASCADE)

COMMIT;
```

## 📈 정리 후 예상 효과

- **테이블 수**: 27개 → 24개 (3개 감소)
- **복잡도**: 중간 수준 감소
- **유지보수**: 더 명확한 구조
- **성능**: 영향 없음 (사용되지 않는 테이블이므로)

## ⚠️ 주의사항

1. **백업 필수**: 삭제 전 반드시 데이터베이스 백업
2. **테스트 환경에서 먼저 실행**: 프로덕션 적용 전 테스트
3. **RLS 정책 확인**: 삭제된 테이블 관련 정책도 함께 삭제됨 (CASCADE)

