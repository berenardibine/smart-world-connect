-- Add CHECK constraint to ensure ratings are between 1 and 5
ALTER TABLE product_ratings 
ADD CONSTRAINT rating_range 
CHECK (rating >= 1 AND rating <= 5);