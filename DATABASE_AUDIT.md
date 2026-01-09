# NexSupply Database Usage Analysis Report

## 📊 List of Tables Actually in Use (Based on Code Analysis)

### ✅ Core Tables (Essential - Never Delete)

1. **`profiles`** ✅
   - Usage Frequency: Very High
   - Purpose: User authentication, permission management
   - Code Location: `src/server/actions/profile.ts`, `src/app/api/analyze/route.ts`

2. **`reports`** ✅
   - Usage Frequency: Very High (42 references)
   - Purpose: Report creation, retrieval, update
   - Code Location: Almost all report-related files

3. **`supplier_products`** ✅
   - Usage Frequency: Very High (20 references)
   - Purpose: Intelligence Pipeline, factory matching
   - Code Location: `src/lib/intelligence-pipeline.ts` (core)

4. **`product_supplier_matches`** ✅
   - Usage Frequency: High (5 references)
   - Purpose: Caching matching results
   - Code Location: `src/lib/intelligence-pipeline.ts`, `src/app/api/reports/[reportId]/route.ts`

5. **`product_analyses`** ✅
   - Usage Frequency: Medium (4 references)
   - Purpose: Storing AI analysis results
   - Code Location: `src/lib/intelligence-pipeline.ts`

6. **`credits`** ✅
   - Usage Frequency: High (7 references)
   - Purpose: Managing credit balance
   - Code Location: `src/server/actions/credits.ts`

7. **`credit_transactions`** ✅
   - Usage Frequency: Medium (2 references)
   - Purpose: Credit transaction history
   - Code Location: `src/server/actions/credits.ts`

8. **`orders`** ✅
   - Usage Frequency: Very High (24 references)
   - Purpose: Order management
   - Code Location: `src/server/actions/orders.ts`, `src/app/admin/page.tsx`

### ⚠️ Order Workflow Tables (Complex but Necessary)

9. **`order_messages`** ✅ (6 references)
10. **`order_events`** ✅ (10 references)
11. **`order_quotes`** ✅ (4 references)
12. **`order_uploads`** ✅ (3 references)
13. **`order_milestones`** ✅ (3 references)
14. **`order_documents`** ✅ (1 reference)
15. **`order_cost_models`** ✅ (3 references)
16. **`order_partner_assignments`** ✅ (2 references)
17. **`order_rfqs`** ✅ (2 references)

### 📋 Other Tables in Use

18. **`verification_requests`** ✅ (4 references) - Separate from `verifications` table
19. **`leads`** ✅ (3 references)
20. **`invoices`** ✅ (6 references)
21. **`admin_users`** ✅ (1 reference)
22. **`report_importkey_companies`** ✅ (2 references)
23. **`supplier_enrichment`** ✅ (3 references)
24. **`suppliers`** ✅ (3 references)
25. **`supplier_import_stats`** ✅ (1 reference)
26. **`user_credits`** ✅ (2 references) - Used separately from `credits`

### ❌ Unused Tables (Can be Cleaned Up)

27. **`verifications`** ❌
   - Defined in schema.sql but not used in code
   - `verification_requests` is used instead
   - **Can be deleted**: No code references

28. **`messages`** ❌
   - Defined in schema.sql but not used in code
   - `order_messages` is used instead
   - **Can be deleted**: No code references

29. **`files`** ❌
   - Defined in schema.sql but not used in code
   - Supabase Storage is used directly instead
   - **Can be deleted**: No code references

## 🔍 RPC Function Usage Status

### ❌ Unused Functions
- `add_user_credits` - Already replaced by direct SQL (fixed recently)

### ✅ Functions in Use
- None (all use direct SQL queries)

## 💡 Cleanup Proposal and Execution Plan

### 🟢 Immediately Deletable (Safe)
The following 3 tables are not used in the code and can be safely deleted:
```sql
-- 1. Delete verifications table (verification_requests is in use)
DROP TABLE IF EXISTS verifications;

-- 2. Delete messages table (order_messages is in use)
DROP TABLE IF EXISTS messages;

-- 3. Delete files table (Storage used directly)
DROP TABLE IF EXISTS files;
```

### 🟡 Review Required (Carefully)
- **9 Order-related tables**: All may be necessary due to complex workflow
- Some can be integrated into JSONB fields, but data integrity and query performance must be considered

### 🔴 Absolutely Do Not Delete
- 8 core tables (`profiles`, `reports`, `supplier_products`, `product_supplier_matches`, `product_analyses`, `credits`, `credit_transactions`, `orders`)
- 9 Order workflow tables
- 9 other tables in use

## 📝 Executable Cleanup Script
The following SQL can be executed to safely delete unused tables:
```sql
-- Delete unused tables (safe)
-- 1. Delete verifications (verification_requests is in use)
DROP TABLE IF EXISTS verifications CASCADE;

-- 2. Delete messages (order_messages is in use)  
DROP TABLE IF EXISTS messages CASCADE;

-- 3. Delete files (Storage used directly)
DROP TABLE IF EXISTS files CASCADE;

-- Related indexes will also be automatically deleted (CASCADE)
```

## 📈 Expected Effects After Cleanup
- **Number of Tables**: 27 → 24 (3 reduced)
- **Complexity**: Medium reduction
- **Maintenance**: Clearer structure
- **Performance**: No impact (as unused tables)

## ⚠️ Caution
1. **Backup Required**: Always back up the database before deletion
2. **Run in Test Environment First**: Test before applying to production
3. **Check RLS Policies**: Policies related to deleted tables will also be deleted (CASCADE)
