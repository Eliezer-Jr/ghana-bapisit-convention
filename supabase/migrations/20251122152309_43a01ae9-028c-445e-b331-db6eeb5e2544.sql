-- Create letter_templates table to store customization settings
CREATE TABLE IF NOT EXISTS public.letter_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL DEFAULT 'default',
  primary_color TEXT NOT NULL DEFAULT '41,128,185',
  secondary_color TEXT NOT NULL DEFAULT '52,73,94',
  font_family TEXT NOT NULL DEFAULT 'helvetica',
  font_size_title INTEGER NOT NULL DEFAULT 16,
  font_size_body INTEGER NOT NULL DEFAULT 11,
  letterhead_height INTEGER NOT NULL DEFAULT 45,
  logo_width INTEGER NOT NULL DEFAULT 30,
  logo_height INTEGER NOT NULL DEFAULT 30,
  organization_name TEXT NOT NULL DEFAULT 'Ghana Baptist Convention Conference',
  organization_subtitle TEXT NOT NULL DEFAULT 'MINISTERIAL ADMISSION',
  footer_text TEXT NOT NULL DEFAULT 'This is an official document of the Ghana Baptist Convention Conference',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_type)
);

-- Enable RLS
ALTER TABLE public.letter_templates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read templates
CREATE POLICY "Anyone can view letter templates"
  ON public.letter_templates
  FOR SELECT
  USING (true);

-- Only super_admins can insert/update templates
CREATE POLICY "Super admins can manage letter templates"
  ON public.letter_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Insert default template
INSERT INTO public.letter_templates (template_type)
VALUES ('default')
ON CONFLICT (template_type) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_letter_templates_updated_at
  BEFORE UPDATE ON public.letter_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();