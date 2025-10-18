-- Create ministers table
CREATE TABLE public.ministers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL,
  location TEXT,
  date_joined DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ministers ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admins)
CREATE POLICY "Authenticated users can view all ministers" 
ON public.ministers 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create ministers" 
ON public.ministers 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update ministers" 
ON public.ministers 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete ministers" 
ON public.ministers 
FOR DELETE 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ministers_updated_at
BEFORE UPDATE ON public.ministers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();