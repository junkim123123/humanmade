# ImportKey 데이터 저장 구조 분석

## 📊 현재 ImportKey 데이터 사용 현황

### ✅ 실제로 사용 중인 테이블

#### 1. `report_importkey_companies` ✅
- **용도**: 리포트별로 ImportKey에서 추출한 회사 정보 저장
- **저장 위치**: `supabase/migrations_archive/add_report_importkey_companies.sql`
- **사용 위치**: 
  - `src/app/api/reports/[reportId]/route.ts` (891-892줄) - 회사 정보 추출 및 저장
  - `src/lib/intelligence-pipeline.ts` (1659줄) - 공장 검색 시 참조
- **데이터 구조**:
  ```sql
  - report_id (UUID)
  - company_name (TEXT) - 실제 업체명
  - role (TEXT) - 'Shipper', 'Exporter', 'Consignee', 'Importer'
  - shipments_count (INTEGER)
  - last_seen (DATE)
  - origin_country (TEXT)
  - example_description (TEXT)
  - source (TEXT) - 'internal_records'
  ```

#### 2. `supplier_products.import_key_id` ✅
- **용도**: `supplier_products` 테이블의 각 레코드가 어떤 ImportKey 데이터에서 왔는지 추적
- **사용 위치**: 
  - `src/lib/intelligence-pipeline.ts` - 공장 매칭 시 참조
- **현재 상태**: 필드는 있지만 실제로 사용되는지 불명확

### ❓ 존재 여부 불명확한 테이블 (코드에서 참조하지만 스키마에 없음)

#### 1. `shipping_records` / `shipping_records_normalized` / `import_records`
- **코드 참조 위치**:
  - `src/app/api/reports/[reportId]/route.ts` (714-716줄)
  - `src/lib/intelligence-pipeline.ts` (3340-3342줄)
- **문제점**: 
  - `schema.sql`에 테이블 정의가 없음
  - 코드에서 `try-catch`로 감싸서 실패해도 계속 진행하도록 되어 있음
  - 실제로는 이 테이블들이 존재하지 않을 가능성이 높음

## 🔍 코드 분석 결과

### ImportKey 데이터 추출 로직

```typescript
// src/app/api/reports/[reportId]/route.ts (700-899줄)
// 리포트 GET 요청 시 ImportKey 회사 정보를 추출하여 report_importkey_companies에 저장

const sourcesToTry = [
  { table: "shipping_records_normalized", dateCol: "shipment_date" },
  { table: "shipping_records", dateCol: "shipment_date" },
  { table: "import_records", dateCol: "shipment_date" },
];

// 각 테이블을 시도하지만, 없으면 다음 테이블로 넘어감
// 최종적으로 데이터를 찾으면 report_importkey_companies에 저장
```

### 문제점

1. **원본 통관 데이터 테이블이 없음**
   - `shipping_records`, `import_records` 같은 테이블이 스키마에 정의되어 있지 않음
   - 코드는 이 테이블들을 참조하려고 하지만 실제로는 존재하지 않을 가능성이 높음

2. **데이터 저장 방식이 불명확**
   - ImportKey 원본 데이터가 어디에 저장되어 있는지 불명확
   - `report_importkey_companies`는 리포트별로 추출된 회사 정보만 저장
   - 원본 통관 데이터는 별도 시스템이나 외부 서비스에 있을 가능성

3. **실제 사용 여부**
   - `report_importkey_companies`는 실제로 사용 중 (리포트 API에서 저장)
   - 하지만 원본 데이터 테이블들이 없어서 데이터 추출이 실패할 가능성

## 💡 권장 사항

### 1. 즉시 확인 필요
- Supabase에서 실제로 `shipping_records`, `import_records` 테이블이 존재하는지 확인
- `report_importkey_companies` 테이블에 실제 데이터가 있는지 확인

### 2. 데이터 저장 전략 재검토
- ImportKey 원본 데이터를 Supabase에 저장할지 결정
- 외부 서비스(ImportKey API)에서 실시간으로 가져올지 결정
- 현재는 리포트 생성 시에만 추출하여 `report_importkey_companies`에 저장하는 방식

### 3. 코드 정리
- 존재하지 않는 테이블 참조 코드는 제거하거나 주석 처리
- 실제 데이터 소스를 명확히 하기

## 📝 확인 방법

```sql
-- 1. report_importkey_companies 테이블 확인
SELECT COUNT(*) FROM report_importkey_companies;

-- 2. 원본 통관 데이터 테이블 존재 여부 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%shipping%' OR table_name LIKE '%import%');

-- 3. supplier_products에서 import_key_id 사용 여부 확인
SELECT COUNT(*) FROM supplier_products WHERE import_key_id IS NOT NULL;
```

## 🎯 결론

- **`report_importkey_companies`**: 실제로 사용 중이며, 리포트별 회사 정보를 저장하는 용도로 작동
- **원본 통관 데이터 테이블들**: 스키마에 없어서 실제로는 사용되지 않을 가능성이 높음
- **권장**: 원본 데이터 테이블이 없다면 해당 참조 코드를 정리하거나, 실제 데이터 소스를 명확히 해야 함

