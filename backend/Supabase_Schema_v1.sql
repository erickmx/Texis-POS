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