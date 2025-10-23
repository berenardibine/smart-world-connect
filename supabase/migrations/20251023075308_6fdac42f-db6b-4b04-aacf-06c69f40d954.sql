-- Add RLS policies to protect storage buckets
-- Note: storage.objects already has RLS enabled by Supabase

-- Policy: Anyone can view/download product images and videos (SELECT)
CREATE POLICY "Anyone can view product media"
ON storage.objects
FOR SELECT
USING (bucket_id IN ('product-images', 'product-videos'));

-- Policy: Authenticated users can upload their own files (INSERT)
-- Files must be in a folder named after their user ID
CREATE POLICY "Authenticated users can upload their own media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('product-images', 'product-videos') 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own files only
CREATE POLICY "Users can update their own media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('product-images', 'product-videos')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own files only
CREATE POLICY "Users can delete their own media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('product-images', 'product-videos')
  AND (storage.foldername(name))[1] = auth.uid()::text
);