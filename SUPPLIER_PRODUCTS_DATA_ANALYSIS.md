# supplier_products Table Data Structure Analysis

## 📊 Current Data Status

### Table Information
- **Table Name**: `supplier_products`
- **Number of Records**: 309,257
- **Size**: 172 MB
- **Purpose**: Supplier/factory products for matching

### Data Structure Analysis

#### ✅ ImportKey Data Actually Stored
Each record contains the following information:
```json
{
  "id": "76ba0da0-...",
  "supplier_id": "phone",  // ❌ Dummy data
  "supplier_name": "phone -",  // ❌ Dummy data (not actual company name)
  "product_name": "Fruit Marshmallow",
  "product_description": "Origin: K | Quantity: 3527 | Weight: 11109 | FWDR REF: ...",
  "import_key_id": "HLCUBO12511ATCV7",  // ✅ Original ImportKey record ID
  "category": "Confectionery"
}
```

### 🔍 Problems Found

#### 1. **supplier_name is dummy data**
- Mostly `"phone -"` or similar dummy values
- Actual company name (Shipper/Exporter) is not stored
- `product_description` contains customs data but requires parsing

#### 2. **import_key_id exists but no original table**
- `import_key_id` field attempts to track original ImportKey records
- But original customs data tables (`shipping_records`, `import_records`) do not exist
- Therefore, actual company names cannot be found using `import_key_id` alone

#### 3. **product_description contains customs information**
- `product_description` contains information like `Origin: K | Quantity: 3527 | Weight: 11109`
- But Shipper/Exporter names are not included

## 💡 Solutions

### Option 1: Extract company name from product_description (realistic)
Analyze `product_description` to extract actual company names:
```typescript
// product_description example:
// "Origin: K | Quantity: 3527 | Weight: 11109 | FWDR REF: CJ LOGISTICS | CNEE REF: ..."

// Pattern analysis:
// - Forwarder name after "FWDR REF:"
// - Consignee name after "CNEE REF:"  
// - Notify party name after "ND NOTIFY:"
// - Find "SHIPPER:" or "EXPORTER:" keywords
```

### Option 2: Re-query original data with import_key_id (impossible)
Requires original ImportKey API or database, but currently seems inaccessible.

### Option 3: Utilize report_importkey_companies (limited)
Match company information stored in `report_importkey_companies` with `supplier_products`:
- Update `supplier_products.supplier_name` with `report_importkey_companies.company_name`
- However, it's stored only per report, so full matching is difficult

## 🎯 Recommendations

### Immediately Actionable Improvements

1. **Add product_description parsing logic**
```typescript
   // Extract company name from product_description
   function extractSupplierName(desc: string) {
     // Find patterns like "FWDR REF:", "CNEE REF:", "ND NOTIFY:", "SHIPPER:", "EXPORTER:"
     // Extract actual company name
   }
```

2. **supplier_name update script**
```sql
   -- Update supplier_name with company name extracted from product_description
   UPDATE supplier_products 
   SET supplier_name = ... 
   WHERE supplier_name LIKE 'phone%';
```

3. **Improve data quality**
- Filter records where `supplier_name` is "phone -"
- Use only records with actual company names
- Exclude or mark dummy data separately

### Long-term Improvements

1. **Store original ImportKey data**
- Create `shipping_records` or `import_records` tables
- Store original customs data to enable lookup by `import_key_id`

2. **Data Normalization**
- Add `shipper_name`, `exporter_name` fields to `supplier_products`
- Store actual company names during ImportKey data collection

## 📝 Current Usage Status

### ✅ Actually in Use
- `supplier_products` table: Used for factory matching in Intelligence Pipeline
- `import_key_id` field: For tracking original records (but no original table)

### ❌ Not Used
- `supplier_name` field: Mostly dummy data, practically unusable
- Original customs data tables: Do not exist

## 🔧 Immediately Applicable Fixes

### 1. Improve supplier_name filtering
```typescript
// in intelligence-pipeline.ts
// Exclude dummy data like "phone -", "phone", "email", "contact"
const dummyPatterns = ['phone', 'email', 'contact', 'website'];
```

### 2. Extract company name from product_description
```typescript
// Attempt to extract actual company name from product_description
// Pattern matching for company name extraction
// Example: "ND NOTIFY: DAMCO DISTRIBUTION SERVICES INC" → "DAMCO DISTRIBUTION SERVICES INC"
```

## 📊 Data Quality Statistics (Estimated)
- **Total Records**: 309,257
- **Dummy supplier_name**: Approx. 80-90% (estimated)
- **Actual Company Name**: Approx. 10-20% (estimated)
- **Has import_key_id**: 100% (all records have it)

## 🎯 Conclusion
1. **`supplier_products` table is actually in use** and contains ImportKey data.
2. **Problem**: `supplier_name` is dummy data, making it difficult to find actual company names.
3. **Solution**: 
- Add logic to extract company names from `product_description`
- Strengthen dummy data filtering
- Establish original ImportKey data storage structure (long-term)
