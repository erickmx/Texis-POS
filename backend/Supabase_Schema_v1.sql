-- 1. PRODUCTS (Inventory Core)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  clave_sat TEXT NOT NULL, -- e.g., '44120000'
  unit_sat TEXT DEFAULT 'H87', -- H87 is 'Piece'
  buy_price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  stock_level INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 5,
  image_url TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ORDERS (The Transaction Shell)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio SERIAL, -- Auto-incrementing human-readable ID
  customer_wa TEXT, -- WhatsApp Number
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'done', 'completed', 'cancelled'
  payment_method TEXT, -- '01' (Cash), '03' (Transfer), '04/28' (Card)
  is_special_request BOOLEAN DEFAULT FALSE,
  total_amount DECIMAL(10,2) DEFAULT 0,
  fiscal_uuid UUID, -- The SAT Folio after stamping
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ORDER_ITEMS (Links Products to Orders)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL
);

-- 4. SPECIAL_REQUESTS_DETAILS (Extended info for Custom Work)
CREATE TABLE special_requests_details (
  order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  task_description TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  gasto_terceros DECIMAL(10,2) DEFAULT 0, -- Non-taxable government fees
  service_fee DECIMAL(10,2) DEFAULT 0, -- Taxable labor
  attachments TEXT[] -- Array of image URLs
);

-- RLS & SECURITY
-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_requests_details ENABLE ROW LEVEL SECURITY;

-- POLICIES
-- Products: Read for everyone, Write for authenticated (or backend via service_role)
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Products are insertable by authenticated users" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Products are updatable by authenticated users" ON products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Products are deletable by authenticated users" ON products FOR DELETE USING (auth.role() = 'authenticated');

-- Orders & Details: Restrict to authenticated only (backend)
CREATE POLICY "Orders are viewable by authenticated users" ON orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Orders are insertable by authenticated users" ON orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Order items are viewable by authenticated users" ON order_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Order items are insertable by authenticated users" ON order_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Special requests are viewable by authenticated users" ON special_requests_details FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Special requests are insertable by authenticated users" ON special_requests_details FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- STORAGE POLICIES
-- Note: These apply to the 'objects' table in the 'storage' schema
-- We assume the bucket 'inventory-images' is created.
-- Allow public read access to the inventory-images bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'inventory-images' );

-- Allow authenticated users (backend) to upload to the inventory-images bucket
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'inventory-images' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'inventory-images' AND auth.role() = 'authenticated' );