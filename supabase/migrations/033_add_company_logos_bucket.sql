-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy for company-logos bucket
-- Public read access
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Allow anyone to upload (we'll control via API, but this is a fallback effectively)
-- Actually, since we use service_role in API, we don't strictly need an INSERT policy for the identity, 
-- but if we used client-side upload we would. 
-- For now, we will NOT allow public insert via RLS. The API with service role will bypass RLS.
