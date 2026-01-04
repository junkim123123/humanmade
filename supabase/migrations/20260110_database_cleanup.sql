-- ============================================================================
-- Database Cleanup and Optimization
-- ============================================================================
-- This migration cleans up and optimizes the database structure
-- Created: 2025-01-10
-- ============================================================================

-- 1. Clean up orphaned records (if any exist)
-- Delete reports without valid users
DELETE FROM reports 
WHERE user_id IS NOT NULL 
  AND user_id NOT IN (SELECT id FROM profiles);

-- Delete orders without valid users
DELETE FROM orders 
WHERE user_id IS NOT NULL 
  AND user_id NOT IN (SELECT id FROM profiles);

-- Delete verifications without valid users or reports
DELETE FROM verifications 
WHERE (user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM profiles))
   OR (report_id IS NOT NULL AND report_id NOT IN (SELECT id FROM reports));

-- Delete leads without valid reports
DELETE FROM leads 
WHERE report_id IS NOT NULL 
  AND report_id NOT IN (SELECT id FROM reports);

-- Delete product_supplier_matches without valid reports or analyses
DELETE FROM product_supplier_matches 
WHERE (report_id IS NOT NULL AND report_id NOT IN (SELECT id FROM reports))
   OR (analysis_id IS NOT NULL AND analysis_id NOT IN (SELECT id FROM product_analyses));

-- Delete files without valid users
DELETE FROM files 
WHERE user_id IS NOT NULL 
  AND user_id NOT IN (SELECT id FROM profiles);

-- Delete messages without valid users
DELETE FROM messages 
WHERE user_id IS NOT NULL 
  AND user_id NOT IN (SELECT id FROM profiles);

-- 2. Remove duplicate input_keys in reports (keep the most recent)
DELETE FROM reports r1
WHERE EXISTS (
  SELECT 1 FROM reports r2
  WHERE r2.input_key = r1.input_key
    AND r2.input_key IS NOT NULL
    AND r2.id != r1.id
    AND r2.created_at > r1.created_at
);

-- 3. Remove duplicate order_numbers in orders (keep the most recent)
DELETE FROM orders o1
WHERE EXISTS (
  SELECT 1 FROM orders o2
  WHERE o2.order_number = o1.order_number
    AND o2.order_number IS NOT NULL
    AND o2.id != o1.id
    AND o2.created_at > o1.created_at
);

-- 4. Add missing indexes for foreign keys (performance optimization)
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_input_key ON reports(input_key) WHERE input_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_report_id ON orders(report_id) WHERE report_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number) WHERE order_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_verifications_user_id ON verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_report_id ON verifications(report_id);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications(status);

CREATE INDEX IF NOT EXISTS idx_leads_report_id ON leads(report_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

CREATE INDEX IF NOT EXISTS idx_product_supplier_matches_report_id ON product_supplier_matches(report_id) WHERE report_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_supplier_matches_analysis_id ON product_supplier_matches(analysis_id) WHERE analysis_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_supplier_matches_supplier_id ON product_supplier_matches(supplier_id);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_related ON files(related_type, related_id) WHERE related_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_quotes_order_id ON order_quotes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_rfqs_order_id ON order_rfqs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_uploads_order_id ON order_uploads(order_id);
CREATE INDEX IF NOT EXISTS idx_order_cost_models_order_id ON order_cost_models(order_id);
CREATE INDEX IF NOT EXISTS idx_order_partner_assignments_order_id ON order_partner_assignments(order_id);

CREATE INDEX IF NOT EXISTS idx_report_assumptions_report_id ON report_assumptions(report_id);

-- 5. Analyze tables for better query planning (VACUUM must be run separately)
ANALYZE reports;
ANALYZE orders;
ANALYZE verifications;
ANALYZE leads;
ANALYZE product_supplier_matches;
ANALYZE files;
ANALYZE messages;
ANALYZE profiles;

-- 6. Add comments for documentation
COMMENT ON TABLE reports IS 'User-owned analysis reports with complete pipeline results';
COMMENT ON TABLE orders IS 'Production orders with tracking from quote to delivery';
COMMENT ON TABLE verifications IS 'Sample requests, inspections, and audits';
COMMENT ON TABLE leads IS 'Sourcing candidates generated from intelligence pipeline';
COMMENT ON TABLE product_supplier_matches IS 'Scored matches between products and suppliers';
COMMENT ON TABLE supplier_products IS 'Supplier/factory products for matching';
COMMENT ON TABLE product_analyses IS 'Gemini AI analysis results for product images';
COMMENT ON TABLE profiles IS 'User profiles linked to auth.users with role-based access control';
COMMENT ON TABLE files IS 'File attachments for reports, orders, verifications';
COMMENT ON TABLE messages IS 'User-admin communication inbox';
COMMENT ON TABLE user_credits IS 'User credit balances for verification deposits';

