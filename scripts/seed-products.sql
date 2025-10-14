-- Database Seeding Script
-- Seeds the database with initial product data

-- EG4 18kPV Hybrid Inverter
INSERT INTO products (id, name, sku, vendor, category, unit, price, currency, url, last_updated, is_active)
VALUES (
  'eg4-18kpv',
  'EG4 18kPV Hybrid Inverter',
  'EG4-18KPV',
  'SignatureSolar',
  'Inverters',
  'ea',
  3299,
  'USD',
  'https://signaturesolar.com/products/eg4-18kpv',
  NOW(),
  'true'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sku = EXCLUDED.sku,
  price = EXCLUDED.price,
  last_updated = NOW();

-- EG4 BrightMount 4-Panel Roof Racking Kit
INSERT INTO products (id, name, sku, vendor, category, unit, price, currency, url, last_updated, is_active)
VALUES (
  'brightmount-4',
  'EG4 BrightMount 4-Panel Roof Racking Kit',
  'BM-4',
  'SignatureSolar',
  'Racking',
  'pack',
  499,
  'USD',
  'https://signaturesolar.com/products/brightmount-4',
  NOW(),
  'true'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sku = EXCLUDED.sku,
  price = EXCLUDED.price,
  last_updated = NOW();

-- EG4 LL-S-V2 48V 280Ah Server Rack Battery
INSERT INTO products (id, name, sku, vendor, category, unit, price, currency, url, last_updated, is_active)
VALUES (
  'eg4-ll-s-v2-48v-280ah',
  'EG4 LL-S-V2 48V 280Ah Server Rack Battery',
  'LL-S-V2-280',
  'SignatureSolar',
  'Batteries',
  'ea',
  1899,
  'USD',
  'https://signaturesolar.com/products/eg4-ll-s-v2-48v-280ah',
  NOW(),
  'true'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sku = EXCLUDED.sku,
  price = EXCLUDED.price,
  last_updated = NOW();

-- MC4 Extension Cable 12 AWG - 50ft
INSERT INTO products (id, name, sku, vendor, category, unit, price, currency, url, last_updated, is_active)
VALUES (
  '12awg-mc4-extension',
  'MC4 Extension Cable 12 AWG - 50ft',
  'MC4-12-50',
  'SignatureSolar',
  'Wiring',
  'ft',
  89,
  'USD',
  'https://signaturesolar.com/products/mc4-extension-12awg-50ft',
  NOW(),
  'true'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  sku = EXCLUDED.sku,
  price = EXCLUDED.price,
  last_updated = NOW();

-- Insert default company settings if not exists
INSERT INTO company_settings (
  company_name,
  company_phone,
  company_email,
  company_website,
  default_terms,
  default_lead_time,
  quote_prefix
)
SELECT
  'Your Company Name',
  '(555) 123-4567',
  'quotes@yourcompany.com',
  'https://yourcompany.com',
  'Payment due within 30 days. All sales are final.',
  '2-4 weeks',
  'Q'
WHERE NOT EXISTS (SELECT 1 FROM company_settings LIMIT 1);

-- Show results
SELECT 'Products seeded successfully!' as status;
SELECT COUNT(*) as total_products FROM products;
SELECT id, name, price, category FROM products ORDER BY name;
