# ImportKey Data Storage Structure Analysis

## 📊 Current ImportKey Data Usage Status

### ✅ Tables Currently in Use

1. **`report_importkey_companies`**
   - **Purpose**: Stores company information extracted from ImportKey per report
   - **Storage Location**: `supabase/migrations_archive/add_report_importkey_companies.sql`
   - **Usage Location**: 
     - `src/app/api/reports/[reportId]/route.ts` (lines 891-892) - Extracting and storing company information
     - `src/lib/intelligence-pipeline.ts` (line 1659) - Referenced during factory search
   - **Data Structure**:
     - id (UUID)
     - report_id (UUID)
     - company_name (TEXT) - Actual company name
     - role (TEXT) - Importer/Exporter
     - shipments_count (INTEGER)
     - last_seen (DATE)
     - origin_country (TEXT)
     - example_description (TEXT)
     - source (TEXT) - internal_records, etc.

2. **`supplier_products.import_key_id`**
   - **Purpose**: Tracks which ImportKey data each record in the `supplier_products` table came from
   - **Usage Location**: 
     - `src/lib/intelligence-pipeline.ts` - Referenced during factory matching
   - **Current Status**: Field exists but unclear if actually used

### ❓ Tables with Unclear Existence (referenced in code but not in schema)

- **`shipping_records`**, **`import_records`**, **`customs_data`**
- **Code Reference Location**:
  - `src/app/api/reports/[reportId]/route.ts` (lines 714-716)
  - `src/lib/intelligence-pipeline.ts` (lines 3340-3342)
- **Problem**: 
  - No table definition in `schema.sql`
  - Code is wrapped in `try-catch` to continue even if it fails
  - It is highly likely that these tables do not actually exist

## 🔍 Code Analysis Results

### ImportKey Data Extraction Logic

```typescript
// src/app/api/reports/[reportId]/route.ts (lines 700-899)
// Extracts ImportKey company information and stores it in report_importkey_companies when a report GET request is made
const tablesToTry = ['shipping_records', 'import_records', 'customs_data'];
// Attempts each table, but moves to the next if it doesn't exist
// Finally, if data is found, it is stored in report_importkey_companies
```

### Problems

1. **Missing Original Customs Data Tables**
   - Tables like `shipping_records`, `import_records` are not defined in the schema
   - The code tries to reference these tables, but they likely do not exist in reality

2. **Unclear Data Storage Method**
   - Unclear where the original ImportKey data is stored
   - `report_importkey_companies` only stores extracted company information per report
   - Original customs data is likely in a separate system or external service

3. **Actual Usage Status**
   - `report_importkey_companies` is actually in use (stored by the report API)
   - However, data extraction may fail due to the absence of original data tables

## 💡 Recommendations

### 1. Immediate Verification Required
- Verify if `shipping_records`, `import_records` tables actually exist in Supabase
- Verify if `report_importkey_companies` table contains actual data

### 2. Re-evaluate Data Storage Strategy
- Decide whether to store original ImportKey data in Supabase
- Decide whether to fetch in real-time from an external service (ImportKey API)
- Currently, data is extracted only during report generation and stored in `report_importkey_companies`

### 3. Code Cleanup
- Remove or comment out code referencing non-existent tables
- Clarify the actual data source

## 📝 Verification Method

```sql
-- 1. Check report_importkey_companies table
SELECT * FROM report_importkey_companies LIMIT 10;

-- 2. Check for existence of original customs data tables
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'shipping_records'
);

-- 3. Check usage of import_key_id in supplier_products
SELECT import_key_id, COUNT(*) FROM supplier_products 
WHERE import_key_id IS NOT NULL 
GROUP BY import_key_id LIMIT 10;
```

## 🎯 Conclusion

- **`report_importkey_companies`**: Actually in use, functions to store company information per report
- **Original Customs Data Tables**: Not in schema, so likely not in actual use
- **Recommendation**: If original data tables do not exist, clean up the referencing code or clarify the actual data source.
