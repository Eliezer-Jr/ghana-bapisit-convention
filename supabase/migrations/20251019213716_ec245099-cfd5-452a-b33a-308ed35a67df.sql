-- Create storage bucket for minister photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('minister-photos', 'minister-photos', true);

-- Create policy for viewing photos (public)
CREATE POLICY "Anyone can view minister photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'minister-photos');

-- Create policy for uploading photos (authenticated users only)
CREATE POLICY "Authenticated users can upload minister photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'minister-photos' AND auth.uid() IS NOT NULL);

-- Create policy for updating photos (authenticated users only)
CREATE POLICY "Authenticated users can update minister photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'minister-photos' AND auth.uid() IS NOT NULL);

-- Create policy for deleting photos (authenticated users only)
CREATE POLICY "Authenticated users can delete minister photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'minister-photos' AND auth.uid() IS NOT NULL);