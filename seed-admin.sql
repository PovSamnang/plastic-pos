INSERT INTO companies (name, legal_name, email, currency_code, timezone, language) VALUES ('PETCUP Company', 'PETCUP Company', 'admin@example.com', 'USD', 'Asia/Phnom_Penh', 'en');
SET @company_id = LAST_INSERT_ID();
INSERT INTO roles (company_id, name, permissions, is_system) VALUES (@company_id, 'admin', JSON_ARRAY('*'), 1);
SET @role_id = LAST_INSERT_ID();
INSERT INTO branches (company_id, name, code, email, currency_code, timezone, is_hq, is_active) VALUES (@company_id, 'Main Branch', 'MAIN', 'main@example.com', 'USD', 'Asia/Phnom_Penh', 1, 1);
SET @branch_id = LAST_INSERT_ID();
INSERT INTO warehouses (branch_id, name, code, is_default, is_active) VALUES (@branch_id, 'Main Warehouse', 'WH-MAIN', 1, 1);
INSERT INTO staff (company_id, branch_id, role_id, first_name, last_name, email, password_hash, is_active) VALUES (@company_id, @branch_id, @role_id, 'Admin', 'User', 'admin@example.com', 'PASTE_BCRYPT_HASH_HERE', 1);
INSERT INTO units_of_measure (company_id, name, abbreviation, conversion_factor) VALUES (@company_id, 'Piece', 'pcs', 1), (@company_id, 'Kilogram', 'kg', 1), (@company_id, 'Box', 'box', 1);
INSERT INTO categories (company_id, name, slug, is_active) VALUES (@company_id, 'PET Cups', 'pet-cups', 1), (@company_id, 'Lids', 'lids', 1), (@company_id, 'Packaging', 'packaging', 1);
INSERT INTO tax_rates (company_id, name, rate, tax_type, is_default, is_active) VALUES (@company_id, 'VAT 10%', 0.1000, 'VAT', 1, 1);

-- USE plastic_pos;

-- -- Replace this value with a real bcrypt hash for password admin123.
-- -- Generate it in backend folder:
-- -- node -e "import('bcrypt').then(async bcrypt => console.log(await bcrypt.default.hash('admin123', 10)))"
-- SET @admin_hash = 'PASTE_BCRYPT_HASH_HERE';

-- START TRANSACTION;

-- INSERT INTO companies (name, legal_name, email, phone, currency_code, timezone, language, is_active)
-- VALUES ('PETCUP POS Company', 'PETCUP POS Company', 'admin@example.com', '012345678', 'USD', 'Asia/Phnom_Penh', 'en', 1);
-- SET @company_id = LAST_INSERT_ID();

-- INSERT INTO branches (company_id, name, code, address, phone, email, currency_code, timezone, is_hq, is_active)
-- VALUES (@company_id, 'Main Branch', 'MAIN', 'Phnom Penh', '012345678', 'main@example.com', 'USD', 'Asia/Phnom_Penh', 1, 1);
-- SET @branch_id = LAST_INSERT_ID();

-- INSERT INTO roles (company_id, name, permissions, is_system)
-- VALUES
-- (@company_id, 'admin', JSON_ARRAY('*'), 1),
-- (@company_id, 'manager', JSON_ARRAY(
--   'dashboard:read',
--   'products:read','products:create','products:update',
--   'inventory:read','inventory:create','inventory:update',
--   'sales:read','sales:create','sales:update',
--   'customers:read','customers:create','customers:update',
--   'suppliers:read','suppliers:create','suppliers:update',
--   'purchases:read','purchases:create','purchases:update',
--   'payments:read','reports:read'
-- ), 1),
-- (@company_id, 'cashier', JSON_ARRAY(
--   'dashboard:read',
--   'products:read',
--   'sales:read','sales:create',
--   'customers:read','customers:create','customers:update',
--   'payments:read','payments:create'
-- ), 1),
-- (@company_id, 'warehouse', JSON_ARRAY(
--   'dashboard:read',
--   'products:read',
--   'inventory:read','inventory:create','inventory:update',
--   'suppliers:read','purchases:read','purchases:create','purchases:update'
-- ), 1);

-- SET @admin_role_id = (SELECT id FROM roles WHERE company_id = @company_id AND name = 'admin' LIMIT 1);

-- INSERT INTO staff (
--   company_id, branch_id, role_id, first_name, last_name, email, phone,
--   password_hash, commission_rate, base_salary, hire_date, is_active
-- )
-- VALUES (
--   @company_id, @branch_id, @admin_role_id, 'Admin', 'User', 'admin@example.com', '012345678',
--   @admin_hash, 0.0000, 0.00, CURRENT_DATE, 1
-- );
-- SET @staff_id = LAST_INSERT_ID();

-- UPDATE branches SET manager_id = @staff_id WHERE id = @branch_id;

-- INSERT INTO currencies (code, name, symbol, decimal_places, exchange_rate, is_active)
-- VALUES ('USD', 'US Dollar', '$', 2, 1.00000000, 1)
-- ON DUPLICATE KEY UPDATE is_active = 1;

-- INSERT INTO tax_rates (company_id, name, rate, tax_type, applies_to, is_default, is_active)
-- VALUES (@company_id, 'VAT 10%', 0.1000, 'VAT', 'all', 1, 1);

-- INSERT INTO units_of_measure (company_id, name, abbreviation, conversion_factor)
-- VALUES
-- (@company_id, 'Piece', 'pcs', 1.000000),
-- (@company_id, 'Kilogram', 'kg', 1.000000),
-- (@company_id, 'Box', 'box', 1.000000);

-- INSERT INTO warehouses (branch_id, name, code, is_default, is_active)
-- VALUES (@branch_id, 'Main Warehouse', 'MAIN-WH', 1, 1);

-- INSERT INTO payment_methods (company_id, name, type, is_active, sort_order)
-- VALUES
-- (@company_id, 'Cash', 'cash', 1, 1),
-- (@company_id, 'Card', 'card', 1, 2),
-- (@company_id, 'QR Payment', 'ewallet', 1, 3);

-- COMMIT;
