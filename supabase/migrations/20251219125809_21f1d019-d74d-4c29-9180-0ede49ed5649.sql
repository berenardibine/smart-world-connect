-- Create function to update product views count
CREATE OR REPLACE FUNCTION public.sync_product_views()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'view' THEN
    UPDATE products
    SET views = COALESCE(views, 0) + 1
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to sync views
DROP TRIGGER IF EXISTS trigger_sync_product_views ON product_analytics;
CREATE TRIGGER trigger_sync_product_views
AFTER INSERT ON product_analytics
FOR EACH ROW
EXECUTE FUNCTION sync_product_views();

-- Enable realtime for products table
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;