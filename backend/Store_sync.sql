CREATE OR REPLACE FUNCTION update_stock_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE products
    SET stock_level = stock_level - items.quantity
    FROM (SELECT product_id, quantity FROM order_items WHERE order_id = NEW.id) AS items
    WHERE products.id = items.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_stock
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_stock_on_completion();