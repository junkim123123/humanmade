# supplier_products 테이블 데이터 구조 분석

## 📊 현재 데이터 현황

### 테이블 정보
- **테이블명**: `supplier_products`
- **레코드 수**: 309,257개
- **크기**: 172 MB
- **용도**: Supplier/factory products for matching

### 데이터 구조 분석

#### ✅ 실제로 저장된 ImportKey 데이터

각 레코드에는 다음 정보가 포함되어 있습니다:

```json
{
  "id": "7aecb17c-4cc4-443a-8bad-a28d5e8bd4d9",
  "supplier_id": "phone",  // ❌ 더미 데이터
  "supplier_name": "phone -",  // ❌ 더미 데이터 (실제 업체명 아님)
  "product_name": "DECORATIVE PAPER...",
  "product_description": "... | Origin: K | Quantity: 3527 | Weight: 11109",
  "import_key_id": "HLCUBO12511ATCV7",  // ✅ ImportKey 원본 레코드 ID
  "unit_price": "0.00",
  "moq": 1,
  "lead_time": 0,
  "category": "Home",
  "hs_code": null
}
```

### 🔍 발견된 문제점

#### 1. **supplier_name이 더미 데이터**
- 대부분 `"phone -"` 또는 유사한 더미 값
- 실제 업체명(Shipper/Exporter)이 저장되지 않음
- `product_description`에는 통관 데이터가 있지만 파싱이 필요

#### 2. **import_key_id는 있지만 원본 테이블 없음**
- `import_key_id` 필드로 원본 ImportKey 레코드를 추적하려고 하지만
- 원본 통관 데이터 테이블(`shipping_records`, `import_records`)이 존재하지 않음
- 따라서 `import_key_id`만으로는 실제 업체명을 찾을 수 없음

#### 3. **product_description에 통관 정보 포함**
- `product_description`에 `Origin: K | Quantity: 3527 | Weight: 11109` 같은 정보가 있음
- 하지만 Shipper/Exporter 이름은 포함되어 있지 않음

## 💡 해결 방안

### 옵션 1: product_description에서 업체명 추출 (현실적)

`product_description`을 분석하여 실제 업체명을 추출:

```typescript
// product_description 예시:
// "FWDR REF: Z CNEE REF: - CNEE REF: PAPER GIFT BAGS PO NO. SC NO. - -- 001 ND NOTIFY PARTY DAMCO DISTRIBUTION SERVICES INC..."

// 패턴 분석:
// - "FWDR REF:" 뒤에 포워더 이름
// - "CNEE REF:" 뒤에 수하인 이름  
// - "ND NOTIFY:" 뒤에 통지 당사자 이름
// - "SHIPPER:" 또는 "EXPORTER:" 키워드 찾기
```

### 옵션 2: import_key_id로 원본 데이터 재조회 (불가능)

원본 ImportKey API나 데이터베이스가 필요하지만, 현재는 접근 불가능한 것으로 보임.

### 옵션 3: report_importkey_companies 활용 (제한적)

`report_importkey_companies` 테이블에 저장된 회사 정보를 `supplier_products`와 매칭:
- `report_importkey_companies.company_name`을 `supplier_products.supplier_name`으로 업데이트
- 하지만 리포트별로만 저장되어 있어서 전체 매칭은 어려움

## 🎯 권장 사항

### 즉시 실행 가능한 개선

1. **product_description 파싱 로직 추가**
   ```typescript
   // product_description에서 업체명 추출
   function extractCompanyNameFromDescription(description: string): string | null {
     // "FWDR REF:", "CNEE REF:", "ND NOTIFY:", "SHIPPER:", "EXPORTER:" 패턴 찾기
     // 실제 업체명 추출
   }
   ```

2. **supplier_name 업데이트 스크립트**
   ```sql
   -- product_description에서 추출한 업체명으로 supplier_name 업데이트
   UPDATE supplier_products 
   SET supplier_name = extracted_company_name
   WHERE supplier_name = 'phone -' OR supplier_name LIKE 'phone%';
   ```

3. **데이터 품질 개선**
   - `supplier_name`이 "phone -"인 레코드 필터링
   - 실제 업체명이 있는 레코드만 사용
   - 더미 데이터는 제외하거나 별도 표시

### 장기적 개선

1. **ImportKey 원본 데이터 저장**
   - `shipping_records` 또는 `import_records` 테이블 생성
   - 원본 통관 데이터를 저장하여 `import_key_id`로 조회 가능하게

2. **데이터 정규화**
   - `supplier_products`에 `shipper_name`, `exporter_name` 필드 추가
   - ImportKey 데이터 수집 시 실제 업체명 저장

## 📝 현재 사용 현황

### ✅ 실제로 사용 중
- `supplier_products` 테이블: Intelligence Pipeline에서 공장 매칭에 사용
- `import_key_id` 필드: 원본 레코드 추적용 (하지만 원본 테이블 없음)

### ❌ 사용되지 않음
- `supplier_name` 필드: 대부분 더미 데이터로 실제로는 사용 불가
- 원본 통관 데이터 테이블: 존재하지 않음

## 🔧 즉시 적용 가능한 수정

### 1. supplier_name 필터링 개선

```typescript
// intelligence-pipeline.ts에서
function shouldRemoveName(supplierName: string): boolean {
  // "phone -", "phone", "email", "contact" 같은 더미 데이터 제외
  const dummyPatterns = ['phone', 'email', 'contact', 'n/a', 'unknown'];
  return dummyPatterns.some(pattern => 
    supplierName.toLowerCase().includes(pattern.toLowerCase())
  );
}
```

### 2. product_description에서 업체명 추출

```typescript
// product_description에서 실제 업체명 추출 시도
function extractCompanyFromDescription(description: string): string | null {
  // 패턴 매칭으로 업체명 추출
  // 예: "ND NOTIFY: DAMCO DISTRIBUTION SERVICES INC" → "DAMCO DISTRIBUTION SERVICES INC"
}
```

## 📊 데이터 품질 통계 (예상)

- **전체 레코드**: 309,257개
- **더미 supplier_name**: 약 80-90% (추정)
- **실제 업체명**: 약 10-20% (추정)
- **import_key_id 보유**: 100% (모든 레코드에 있음)

## 🎯 결론

1. **`supplier_products` 테이블은 실제로 사용 중**이며, ImportKey 데이터가 저장되어 있음
2. **문제점**: `supplier_name`이 더미 데이터로 되어 있어 실제 업체명을 찾기 어려움
3. **해결책**: 
   - `product_description`에서 업체명 추출 로직 추가
   - 더미 데이터 필터링 강화
   - 원본 ImportKey 데이터 저장 구조 구축 (장기)

