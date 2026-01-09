# Intelligence Pipeline Table Schemas

This document defines the Supabase table schemas required for `lib/intelligence-pipeline.ts` to function.

## 1. `product_analyses`
This table caches image analysis results.

```sql
CREATE TABLE product_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url TEXT NOT NULL,
  analysis_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_product_analyses_image_url ON product_analyses(image_url);
```

## 2. `product_supplier_matches`
This table caches supplier matching results.

```sql
CREATE TABLE product_supplier_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  matches_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_supplier_matches_report_id ON product_supplier_matches(report_id);
```

## 3. `supplier_products`
This table stores supplier product data. (Synchronized from ImportKey or other sources)

```sql
CREATE TABLE supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id TEXT,
  supplier_name TEXT,
  product_name TEXT,
  product_description TEXT,
  category TEXT,
  import_key_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Full text search index for matching
CREATE INDEX idx_supplier_products_search ON supplier_products USING gin(to_tsvector('english', product_name || ' ' || product_description));
```

## Security (RLS)
Set RLS policies as needed:

```sql
-- Example: All users can read, only owner can write
ALTER TABLE product_supplier_matches ENABLE ROW LEVEL SECURITY;

-- Read policy (example)
CREATE POLICY "Allow authenticated read" ON product_supplier_matches
  FOR SELECT TO authenticated USING (true);
```
