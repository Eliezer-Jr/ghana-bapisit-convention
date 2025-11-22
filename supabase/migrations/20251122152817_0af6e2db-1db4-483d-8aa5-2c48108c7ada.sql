-- Create storage bucket for signature images
INSERT INTO storage.buckets (id, name, public)
VALUES ('signature-images', 'signature-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create signatures table
CREATE TABLE IF NOT EXISTS public.letter_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.letter_signatures ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read signatures
CREATE POLICY "Anyone can view signatures"
  ON public.letter_signatures
  FOR SELECT
  USING (true);

-- Only super_admins can manage signatures
CREATE POLICY "Super admins can manage signatures"
  ON public.letter_signatures
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Create RLS policies for signature-images bucket
CREATE POLICY "Public can view signature images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'signature-images');

CREATE POLICY "Super admins can upload signature images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'signature-images' AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can delete signature images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'signature-images' AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_letter_signatures_updated_at
  BEFORE UPDATE ON public.letter_signatures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default signatures
INSERT INTO public.letter_signatures (name, role, image_url, display_order)
VALUES 
  ('Convention Secretary', 'secretary', '/assets/signature-secretary.png', 1),
  ('Vice President', 'vice_president', '/assets/signature-vp.png', 2)
ON CONFLICT DO NOTHING;