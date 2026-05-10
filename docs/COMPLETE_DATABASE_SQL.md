# 📋 ApnaTrade - Complete Database SQL File

Copy and paste this entire SQL into Lovable Cloud → Run SQL to set up everything in one go.

---

## ⚠️ IMPORTANT NOTES

1. This SQL is **IDEMPOTENT** - safe to run multiple times
2. Replace `YOUR_EMAIL@example.com` with your admin email
3. Replace all `YOUR_PLISIO_*` values with actual credentials
4. Run this AFTER signing up with your admin account

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'tumhara_email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;

---

```sql
-- =====================================================
-- APNATRADE COMPLETE DATABASE SETUP
-- Version: 2.0 (Plisio Integration)
-- Last Updated: February 2026
-- =====================================================
-- This SQL is idempotent - safe to run multiple times
-- =====================================================

-- =====================================================
-- SECTION 1: ADMIN SETUP
-- Replace 'YOUR_EMAIL@example.com' with your email
-- =====================================================

-- Create admin role (after you sign up with this email)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Find user by email (replace with your admin email)
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'YOUR_EMAIL@example.com';
    
    IF v_user_id IS NOT NULL THEN
        -- Insert admin role if not exists
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin role assigned to user: %', v_user_id;
    ELSE
        RAISE NOTICE 'User not found. Sign up first, then run this SQL.';
    END IF;
END $$;

-- =====================================================
-- SECTION 2: SECURITY EVENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.security_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    severity text NOT NULL DEFAULT 'info',
    source text NOT NULL,
    user_id uuid NULL,
    ip_address text NULL,
    request_id text NULL,
    event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    handled boolean NOT NULL DEFAULT false,
    handled_by uuid NULL,
    handled_at timestamptz NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage security events" ON public.security_events;
CREATE POLICY "Admins can manage security events"
ON public.security_events
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_security_events_user_type_created
ON public.security_events (user_id, event_type, created_at DESC);

-- =====================================================
-- SECTION 3: PLISIO PAYMENT CONFIGURATION
-- Replace values with your actual Plisio credentials
-- =====================================================

-- Set payment mode to Plisio (change to 'manual' for manual processing)
INSERT INTO platform_settings (key, value)
VALUES ('payment_mode', 'plisio')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Plisio API Key (get from https://plisio.net/account/api)
INSERT INTO platform_settings (key, value)
VALUES ('plisio_api_key', 'YOUR_PLISIO_API_KEY_HERE')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Plisio Secret Key (for webhook signature verification)
INSERT INTO platform_settings (key, value)
VALUES ('plisio_secret_key', 'YOUR_PLISIO_SECRET_KEY_HERE')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- =====================================================
-- SECTION 4: RLS POLICY HARDENING
-- Explicit auth checks on all financial tables
-- =====================================================

-- 4A. TRANSACTIONS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own transactions or admin can view all" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admin can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Verified admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Verified admins can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Prevent transaction deletion" ON public.transactions;

CREATE POLICY "Authenticated users can view own transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Verified admins can view all transactions"
ON public.transactions
FOR SELECT
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authenticated users can insert own transactions"
ON public.transactions
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Verified admins can update transactions"
ON public.transactions
FOR UPDATE
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Prevent transaction deletion"
ON public.transactions
FOR DELETE
USING (false);

-- 4B. TRADES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can insert their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
DROP POLICY IF EXISTS "Admin can view all trades" ON public.trades;
DROP POLICY IF EXISTS "Prevent trade deletion" ON public.trades;
DROP POLICY IF EXISTS "Authenticated users can view own trades" ON public.trades;
DROP POLICY IF EXISTS "Verified admins can view all trades" ON public.trades;
DROP POLICY IF EXISTS "Authenticated users can insert own trades" ON public.trades;
DROP POLICY IF EXISTS "Authenticated users can update own trades" ON public.trades;

CREATE POLICY "Authenticated users can view own trades"
ON public.trades
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Verified admins can view all trades"
ON public.trades
FOR SELECT
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authenticated users can insert own trades"
ON public.trades
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own trades"
ON public.trades
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id AND result = 'pending');

CREATE POLICY "Prevent trade deletion"
ON public.trades
FOR DELETE
USING (false);

-- 4C. ACTIVE_BETS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their own bets" ON public.active_bets;
DROP POLICY IF EXISTS "Users can insert their own bets" ON public.active_bets;
DROP POLICY IF EXISTS "Prevent bet modification" ON public.active_bets;
DROP POLICY IF EXISTS "Prevent bet deletion" ON public.active_bets;
DROP POLICY IF EXISTS "Authenticated users can view own bets" ON public.active_bets;
DROP POLICY IF EXISTS "Verified admins can view all bets" ON public.active_bets;
DROP POLICY IF EXISTS "Authenticated users can insert own bets" ON public.active_bets;

CREATE POLICY "Authenticated users can view own bets"
ON public.active_bets
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Verified admins can view all bets"
ON public.active_bets
FOR SELECT
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authenticated users can insert own bets"
ON public.active_bets
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Prevent bet modification"
ON public.active_bets
FOR UPDATE
USING (false);

CREATE POLICY "Prevent bet deletion"
ON public.active_bets
FOR DELETE
USING (false);

-- =====================================================
-- SECTION 5: NOTIFICATIONS PROTECTION
-- =====================================================

DROP POLICY IF EXISTS "Prevent notification deletion" ON public.notifications;
CREATE POLICY "Prevent notification deletion"
ON public.notifications
FOR DELETE
USING (false);

-- =====================================================
-- SECTION 6: REFERRALS PROTECTION
-- =====================================================

DROP POLICY IF EXISTS "Prevent referral modification" ON public.referrals;
CREATE POLICY "Prevent referral modification"
ON public.referrals
FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Prevent referral deletion" ON public.referrals;
CREATE POLICY "Prevent referral deletion"
ON public.referrals
FOR DELETE
USING (false);

-- =====================================================
-- SECTION 7: DAILY REFERRAL EARNINGS PROTECTION
-- =====================================================

DROP POLICY IF EXISTS "System only insert earnings" ON public.daily_referral_earnings;
CREATE POLICY "System only insert earnings"
ON public.daily_referral_earnings
FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "System only update earnings" ON public.daily_referral_earnings;
CREATE POLICY "System only update earnings"
ON public.daily_referral_earnings
FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "System only delete earnings" ON public.daily_referral_earnings;
CREATE POLICY "System only delete earnings"
ON public.daily_referral_earnings
FOR DELETE
USING (false);

-- =====================================================
-- SECTION 8: CANDLE BET AGGREGATES - AUTH ONLY
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view aggregates" ON public.candle_bet_aggregates;
DROP POLICY IF EXISTS "Authenticated can view aggregates" ON public.candle_bet_aggregates;
CREATE POLICY "Authenticated can view aggregates"
ON public.candle_bet_aggregates
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- =====================================================
-- SECTION 9: PERFORMANCE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_transactions_user_type_status_created
ON public.transactions (user_id, type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trades_user_created
ON public.trades (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_active_bets_user_candle_status
ON public.active_bets (user_id, candle_key, status);

-- =====================================================
-- SECTION 10: DATA INTEGRITY CONSTRAINTS
-- =====================================================

-- Prevent negative balances
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_balance_non_negative;
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_balance_non_negative CHECK (balance >= 0);

-- Prevent zero/negative transaction amounts
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_amount_positive;
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0);

-- Valid bet amount range (₹10 - ₹5000)
ALTER TABLE public.active_bets
DROP CONSTRAINT IF EXISTS active_bets_amount_range;
ALTER TABLE public.active_bets
ADD CONSTRAINT active_bets_amount_range CHECK (amount >= 10 AND amount <= 5000);

-- =====================================================
-- SECTION 11: LOG SETUP COMPLETION
-- =====================================================

DO $$
BEGIN
    IF to_regclass('public.security_events') IS NOT NULL THEN
        INSERT INTO public.security_events (event_type, severity, source, event_data)
        VALUES (
            'database_setup_complete',
            'info',
            'migration',
            jsonb_build_object(
                'version', '2.0',
                'payment_provider', 'plisio',
                'tables_hardened', ARRAY['transactions', 'trades', 'active_bets', 'notifications', 'referrals'],
                'timestamp', now()
            )
        );
    END IF;
END $$;

-- =====================================================
-- SETUP COMPLETE! ✅
-- =====================================================
-- Next Steps:
-- 1. Sign up with your admin email if not done
-- 2. Update 'YOUR_EMAIL@example.com' above and re-run
-- 3. Update Plisio API keys above and re-run
-- 4. Configure Plisio webhook URL in Plisio dashboard:
--    https://avixixwhgifjjnligkuw.supabase.co/functions/v1/plisio-webhook
-- =====================================================
```

---

## 📝 How to Use

1. **Copy the entire SQL** above (everything between the ``` marks)
2. Go to **Lovable Cloud** → **Run SQL**
3. **Paste and run**
4. **Replace placeholders**:
   - `YOUR_EMAIL@example.com` → Your admin email
   - `YOUR_PLISIO_API_KEY_HERE` → Your Plisio API key
   - `YOUR_PLISIO_SECRET_KEY_HERE` → Your Plisio secret key
5. **Run again** after updating the values

---

## 🔄 Switching Payment Providers

### Switch to Manual Mode
```sql
UPDATE platform_settings SET value = 'manual' WHERE key = 'payment_mode';
```

### Switch to Plisio Mode
```sql
UPDATE platform_settings SET value = 'plisio' WHERE key = 'payment_mode';
```

### Check Current Mode
```sql
SELECT key, value FROM platform_settings WHERE key = 'payment_mode';
```

---

*Last updated: February 2026*
