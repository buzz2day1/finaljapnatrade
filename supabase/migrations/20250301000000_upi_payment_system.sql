-- =====================================================
-- UPI PAYMENT SYSTEM MIGRATION
-- Adds UTR/screenshot columns + QR code storage
-- =====================================================

-- 1. Add columns to transactions table for UPI deposits
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS utr_number TEXT,
ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

-- 2. Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('screenshots', 'screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for screenshots
DROP POLICY IF EXISTS "Screenshots are publicly accessible" ON storage.objects;
CREATE POLICY "Screenshots are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'screenshots');

DROP POLICY IF EXISTS "Users can upload screenshots" ON storage.objects;
CREATE POLICY "Users can upload screenshots"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'screenshots' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own screenshots" ON storage.objects;
CREATE POLICY "Users can update own screenshots"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'screenshots' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own screenshots" ON storage.objects;
CREATE POLICY "Users can delete own screenshots"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'screenshots' AND auth.role() = 'authenticated');

-- 3. Create table for admin QR codes
CREATE TABLE IF NOT EXISTS public.admin_qr_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    qr_url TEXT NOT NULL,
    upi_id TEXT NOT NULL DEFAULT 'admin@apnatrade',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_qr_codes ENABLE ROW LEVEL SECURITY;

-- Admins can manage QR codes
DROP POLICY IF EXISTS "Admins can manage QR codes" ON public.admin_qr_codes;
CREATE POLICY "Admins can manage QR codes"
    ON public.admin_qr_codes FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can read active QR codes
DROP POLICY IF EXISTS "Users can read active QR codes" ON public.admin_qr_codes;
CREATE POLICY "Users can read active QR codes"
    ON public.admin_qr_codes FOR SELECT
    USING (is_active = true);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_admin_qr_codes_active ON public.admin_qr_codes(is_active);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_admin_qr_codes_updated_at ON public.admin_qr_codes;
CREATE TRIGGER update_admin_qr_codes_updated_at
    BEFORE UPDATE ON public.admin_qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Insert default admin UPI ID setting if not exists
INSERT INTO public.platform_settings (key, value) 
VALUES ('admin_upi_id', 'admin@apnatrade')
ON CONFLICT (key) DO NOTHING;

-- Enable realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
