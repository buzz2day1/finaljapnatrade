-- =====================================================
-- COMPLETE APNATRADE DATABASE SETUP
-- Run this entire file in Supabase SQL Editor
-- Admin Email: selfashad@gmail.com
-- =====================================================

-- =====================================================
-- 1. ENUMS
-- =====================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- =====================================================
-- 2. TABLES
-- =====================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    balance NUMERIC NOT NULL DEFAULT 0,
    total_deposit NUMERIC NOT NULL DEFAULT 0,
    total_bet NUMERIC NOT NULL DEFAULT 0,
    referral_code TEXT UNIQUE,
    referred_by UUID REFERENCES public.profiles(id),
    referral_earnings NUMERIC NOT NULL DEFAULT 0,
    blocked BOOLEAN NOT NULL DEFAULT false,
    withdrawal_wallet_address TEXT,
    tier_bonuses_paid jsonb DEFAULT '{"level_2": false, "level_3": false, "level_4": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role public.app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES public.profiles(id),
    referred_id UUID NOT NULL REFERENCES public.profiles(id),
    total_earnings NUMERIC NOT NULL DEFAULT 0,
    signup_bonus_paid BOOLEAN NOT NULL DEFAULT false,
    level_2_bonus_paid BOOLEAN NOT NULL DEFAULT false,
    level_3_bonus_paid BOOLEAN NOT NULL DEFAULT false,
    level_4_bonus_paid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (referrer_id, referred_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('deposit', 'withdraw')),
    amount NUMERIC NOT NULL,
    coin TEXT,
    wallet_address TEXT,
    utr_number TEXT,
    screenshot_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Referral commissions table
CREATE TABLE IF NOT EXISTS public.referral_commissions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES public.profiles(id),
    referred_id UUID NOT NULL REFERENCES public.profiles(id),
    deposit_amount NUMERIC NOT NULL,
    commission_percentage NUMERIC NOT NULL,
    commission_amount NUMERIC NOT NULL,
    tier_level INTEGER NOT NULL,
    is_bonus BOOLEAN NOT NULL DEFAULT false,
    bonus_amount NUMERIC DEFAULT 0,
    transaction_id UUID REFERENCES public.transactions(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Referral tiers table
CREATE TABLE IF NOT EXISTS public.referral_tiers (
    id SERIAL PRIMARY KEY,
    tier_level INTEGER NOT NULL UNIQUE,
    min_referrals INTEGER NOT NULL,
    max_referrals INTEGER,
    commission_percentage NUMERIC(5,2) NOT NULL,
    one_time_bonus NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Trades table
CREATE TABLE IF NOT EXISTS public.trades (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    coin_symbol TEXT NOT NULL,
    coin_name TEXT NOT NULL,
    timeframe INTEGER NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
    amount NUMERIC NOT NULL,
    entry_price NUMERIC NOT NULL,
    exit_price NUMERIC,
    return_rate NUMERIC NOT NULL,
    result TEXT CHECK (result IN ('win', 'loss', 'pending')),
    pnl NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Platform settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Active bets table (Betting Engine)
CREATE TABLE IF NOT EXISTS public.active_bets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    coin_symbol TEXT NOT NULL,
    timeframe INTEGER NOT NULL,
    candle_key TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('up', 'down')),
    amount NUMERIC NOT NULL CHECK (amount > 0),
    entry_price NUMERIC NOT NULL,
    return_rate NUMERIC NOT NULL DEFAULT 100,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
    result_direction TEXT CHECK (result_direction IN ('up', 'down')),
    exit_price NUMERIC,
    pnl NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    settled_at TIMESTAMP WITH TIME ZONE
);

-- Candle bet aggregates table
CREATE TABLE IF NOT EXISTS public.candle_bet_aggregates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    candle_key TEXT NOT NULL UNIQUE,
    coin_symbol TEXT NOT NULL,
    timeframe INTEGER NOT NULL,
    candle_end_time BIGINT NOT NULL,
    total_up_bets NUMERIC NOT NULL DEFAULT 0,
    total_down_bets NUMERIC NOT NULL DEFAULT 0,
    bet_count INTEGER NOT NULL DEFAULT 0,
    is_settled BOOLEAN NOT NULL DEFAULT false,
    result_direction TEXT CHECK (result_direction IN ('up', 'down')),
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User wallet data (secure wallet storage)
CREATE TABLE IF NOT EXISTS public.user_wallet_data (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    withdrawal_wallet_address TEXT,
    wallet_locked BOOLEAN NOT NULL DEFAULT false,
    wallet_locked_at TIMESTAMP WITH TIME ZONE,
    last_wallet_change TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security events table
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    source TEXT NOT NULL,
    user_id UUID,
    ip_address TEXT,
    user_agent TEXT,
    request_id TEXT,
    idempotency_key TEXT,
    metadata JSONB,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily referral earnings table
CREATE TABLE IF NOT EXISTS public.daily_referral_earnings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    new_signups INTEGER DEFAULT 0,
    total_earnings NUMERIC DEFAULT 0,
    deposit_commission NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(referrer_id, date)
);

-- Admin QR codes table
CREATE TABLE IF NOT EXISTS public.admin_qr_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    qr_url TEXT NOT NULL,
    upi_id TEXT NOT NULL DEFAULT 'admin@apnatrade',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- 3. FUNCTIONS
-- =====================================================

-- Generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := 'APNA';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$;

-- Auto-generate referral code on profile creation
CREATE OR REPLACE FUNCTION public.set_referral_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := public.generate_referral_code();
    END IF;
    RETURN NEW;
END;
$$;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    );
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_email_name TEXT;
    v_new_referral_code TEXT;
BEGIN
    v_email_name := SPLIT_PART(NEW.email, '@', 1);
    v_new_referral_code := 'APNA' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    INSERT INTO public.profiles (user_id, name, referral_code, balance, total_deposit, total_bet, referral_earnings)
    VALUES (NEW.id, COALESCE(v_email_name, 'User'), v_new_referral_code, 0, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Save/lock withdrawal wallet (secure)
CREATE OR REPLACE FUNCTION public.save_withdrawal_wallet(p_wallet_address TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID; v_existing user_wallet_data%ROWTYPE; v_address_exists BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
    SELECT * INTO v_existing FROM user_wallet_data WHERE user_id = v_user_id;
    IF FOUND AND v_existing.wallet_locked THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet address is permanently locked. Contact support for assistance.');
    END IF;
    SELECT EXISTS (SELECT 1 FROM user_wallet_data WHERE withdrawal_wallet_address = p_wallet_address AND user_id != v_user_id) INTO v_address_exists;
    IF v_address_exists THEN RETURN jsonb_build_object('success', false, 'error', 'This wallet address is already registered to another account'); END IF;
    INSERT INTO user_wallet_data (user_id, withdrawal_wallet_address, wallet_locked, wallet_locked_at, last_wallet_change)
    VALUES (v_user_id, p_wallet_address, true, now(), now())
    ON CONFLICT (user_id) DO UPDATE SET withdrawal_wallet_address = p_wallet_address, wallet_locked = true, wallet_locked_at = now(), last_wallet_change = now(), updated_at = now();
    UPDATE profiles SET withdrawal_wallet_address = p_wallet_address WHERE user_id = v_user_id;
    RETURN jsonb_build_object('success', true, 'message', 'Wallet address saved and permanently locked');
END;
$$;

-- Get user wallet data (secure)
CREATE OR REPLACE FUNCTION public.get_user_wallet_data()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user_id UUID; v_wallet user_wallet_data%ROWTYPE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
    SELECT * INTO v_wallet FROM user_wallet_data WHERE user_id = v_user_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', true, 'has_wallet', false, 'wallet_address', NULL, 'wallet_locked', false); END IF;
    RETURN jsonb_build_object('success', true, 'has_wallet', v_wallet.withdrawal_wallet_address IS NOT NULL, 'wallet_address', v_wallet.withdrawal_wallet_address, 'wallet_locked', v_wallet.wallet_locked, 'locked_at', v_wallet.wallet_locked_at);
END;
$$;

-- --- Betting Engine RPCs ---

-- place_bet - Atomic bet placement
CREATE OR REPLACE FUNCTION public.place_bet(
    p_coin_symbol TEXT, p_timeframe INTEGER, p_candle_end_time BIGINT,
    p_direction TEXT, p_amount NUMERIC, p_entry_price NUMERIC, p_return_rate NUMERIC DEFAULT 100
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
    v_user_id UUID; v_candle_key TEXT; v_bet_id UUID;
    v_balance_result JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
    IF p_direction NOT IN ('up', 'down') THEN RETURN jsonb_build_object('success', false, 'error', 'Invalid direction'); END IF;
    IF p_amount < 10 OR p_amount > 5000 THEN RETURN jsonb_build_object('success', false, 'error', 'Bet amount must be between ₹10 and ₹5000'); END IF;
    v_candle_key := p_coin_symbol || '_' || p_timeframe || '_' || p_candle_end_time;
    IF EXISTS (SELECT 1 FROM candle_bet_aggregates WHERE candle_key = v_candle_key AND is_settled = true) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Candle already closed');
    END IF;
    IF EXISTS (SELECT 1 FROM active_bets WHERE user_id = v_user_id AND candle_key = v_candle_key AND status = 'pending') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already have active bet on this candle');
    END IF;
    v_balance_result := mutate_balance(v_user_id, -p_amount, 'trade_bet', 'active_bets', NULL, 'bet_' || gen_random_uuid()::text);
    IF NOT (v_balance_result->>'success')::boolean THEN RETURN jsonb_build_object('success', false, 'error', v_balance_result->>'error'); END IF;
    INSERT INTO active_bets (user_id, coin_symbol, timeframe, candle_key, direction, amount, entry_price, return_rate)
    VALUES (v_user_id, p_coin_symbol, p_timeframe, v_candle_key, p_direction, p_amount, p_entry_price, p_return_rate)
    RETURNING id INTO v_bet_id;
    INSERT INTO candle_bet_aggregates (candle_key, coin_symbol, timeframe, candle_end_time, total_up_bets, total_down_bets, bet_count)
    VALUES (v_candle_key, p_coin_symbol, p_timeframe, p_candle_end_time,
        CASE WHEN p_direction = 'up' THEN p_amount ELSE 0 END,
        CASE WHEN p_direction = 'down' THEN p_amount ELSE 0 END, 1)
    ON CONFLICT (candle_key) DO UPDATE SET
        total_up_bets = candle_bet_aggregates.total_up_bets + CASE WHEN p_direction = 'up' THEN p_amount ELSE 0 END,
        total_down_bets = candle_bet_aggregates.total_down_bets + CASE WHEN p_direction = 'down' THEN p_amount ELSE 0 END,
        bet_count = candle_bet_aggregates.bet_count + 1, updated_at = now();
    RETURN jsonb_build_object('success', true, 'bet_id', v_bet_id, 'candle_key', v_candle_key, 'amount', p_amount, 'direction', p_direction, 'new_balance', v_balance_result->>'after_balance');
END;
$$;

-- get_candle_aggregates
CREATE OR REPLACE FUNCTION public.get_candle_aggregates(p_candle_key TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_agg candle_bet_aggregates%ROWTYPE;
BEGIN
    SELECT * INTO v_agg FROM candle_bet_aggregates WHERE candle_key = p_candle_key;
    IF NOT FOUND THEN RETURN jsonb_build_object('total_up_bets', 0, 'total_down_bets', 0, 'bet_count', 0, 'is_settled', false); END IF;
    RETURN jsonb_build_object('total_up_bets', v_agg.total_up_bets, 'total_down_bets', v_agg.total_down_bets, 'bet_count', v_agg.bet_count, 'is_settled', v_agg.is_settled, 'result_direction', v_agg.result_direction);
END;
$$;

-- settle_candle - 40% win rate / 2x payout engine
CREATE OR REPLACE FUNCTION public.settle_candle(p_candle_key TEXT, p_exit_price NUMERIC)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
    v_agg candle_bet_aggregates%ROWTYPE;
    v_result_direction TEXT; v_random_override BOOLEAN;
    v_bet RECORD; v_pnl NUMERIC; v_win_amount NUMERIC;
    v_winners_count INTEGER := 0; v_losers_count INTEGER := 0; v_total_payout NUMERIC := 0;
BEGIN
    SELECT * INTO v_agg FROM candle_bet_aggregates WHERE candle_key = p_candle_key FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', true, 'message', 'No bets to settle'); END IF;
    IF v_agg.is_settled THEN RETURN jsonb_build_object('success', true, 'already_settled', true, 'result_direction', v_agg.result_direction); END IF;

    v_random_override := random();

    -- 40% win rate engine
    IF v_agg.total_up_bets > 0 AND v_agg.total_down_bets = 0 THEN
        IF v_random_override < 0.40 THEN v_result_direction := 'up'; ELSE v_result_direction := 'down'; END IF;
    ELSIF v_agg.total_down_bets > 0 AND v_agg.total_up_bets = 0 THEN
        IF v_random_override < 0.40 THEN v_result_direction := 'down'; ELSE v_result_direction := 'up'; END IF;
    ELSE
        IF v_random_override < 0.40 THEN
            v_result_direction := CASE WHEN random() < 0.5 THEN 'up' ELSE 'down' END;
        ELSE
            IF v_agg.total_up_bets >= v_agg.total_down_bets THEN v_result_direction := 'down'; ELSE v_result_direction := 'up'; END IF;
        END IF;
    END IF;

    UPDATE candle_bet_aggregates SET is_settled = true, result_direction = v_result_direction, settled_at = now(), updated_at = now() WHERE candle_key = p_candle_key;

    FOR v_bet IN SELECT * FROM active_bets WHERE candle_key = p_candle_key AND status = 'pending' FOR UPDATE LOOP
        IF v_bet.direction = v_result_direction THEN
            -- WINNER: 2x payout (return_rate = 100 means 2x multiplier)
            v_win_amount := v_bet.amount * (1 + v_bet.return_rate / 100);
            v_pnl := v_win_amount - v_bet.amount;
            PERFORM mutate_balance(v_bet.user_id, v_win_amount, 'trade_win', 'active_bets', v_bet.id, 'win_' || v_bet.id::text);
            UPDATE active_bets SET status = 'won', result_direction = v_result_direction, exit_price = p_exit_price, pnl = v_pnl, settled_at = now() WHERE id = v_bet.id;
            v_winners_count := v_winners_count + 1; v_total_payout := v_total_payout + v_win_amount;
            INSERT INTO notifications (user_id, title, message, type) VALUES (v_bet.user_id, '🎉 Trade Won!', 'You won ₹' || ROUND(v_pnl, 2) || ' on ' || v_bet.coin_symbol || '!', 'trade_result');
        ELSE
            v_pnl := -v_bet.amount;
            UPDATE active_bets SET status = 'lost', result_direction = v_result_direction, exit_price = p_exit_price, pnl = v_pnl, settled_at = now() WHERE id = v_bet.id;
            v_losers_count := v_losers_count + 1;
            INSERT INTO notifications (user_id, title, message, type) VALUES (v_bet.user_id, 'Trade Closed', 'Lost ₹' || ROUND(v_bet.amount, 2) || ' on ' || v_bet.coin_symbol || '.', 'trade_result');
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'candle_key', p_candle_key, 'result_direction', v_result_direction, 'winners_count', v_winners_count, 'losers_count', v_losers_count, 'total_payout', v_total_payout, 'was_random', v_random_override);
END;
$$;

-- get_user_pending_bet
CREATE OR REPLACE FUNCTION public.get_user_pending_bet(p_candle_key TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_user_id UUID; v_bet active_bets%ROWTYPE;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
    SELECT * INTO v_bet FROM active_bets WHERE user_id = v_user_id AND candle_key = p_candle_key AND status = 'pending';
    IF NOT FOUND THEN RETURN jsonb_build_object('success', true, 'has_bet', false); END IF;
    RETURN jsonb_build_object('success', true, 'has_bet', true, 'bet', jsonb_build_object('id', v_bet.id, 'direction', v_bet.direction, 'amount', v_bet.amount, 'entry_price', v_bet.entry_price, 'return_rate', v_bet.return_rate));
END;
$$;

-- get_bet_result
CREATE OR REPLACE FUNCTION public.get_bet_result(p_bet_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_user_id UUID; v_bet active_bets%ROWTYPE;
BEGIN
    v_user_id := auth.uid(); IF v_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
    SELECT * INTO v_bet FROM active_bets WHERE id = p_bet_id AND user_id = v_user_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Bet not found'); END IF;
    RETURN jsonb_build_object('success', true, 'status', v_bet.status, 'direction', v_bet.direction, 'result_direction', v_bet.result_direction, 'amount', v_bet.amount, 'pnl', v_bet.pnl, 'exit_price', v_bet.exit_price);
END;
$$;

-- Get active referral count
CREATE OR REPLACE FUNCTION public.get_user_active_referral_count(p_user_id UUID)
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COUNT(*)::INTEGER FROM public.referrals r
    JOIN public.profiles p ON r.referred_id = p.id
    WHERE r.referrer_id IN (SELECT id FROM public.profiles WHERE user_id = p_user_id) AND p.total_deposit > 0;
$$;

-- Get user referral tier
CREATE OR REPLACE FUNCTION public.get_user_referral_tier(p_user_id UUID)
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT jsonb_build_object('tier_level', CASE WHEN active_count >= 1000 THEN 4 WHEN active_count >= 100 THEN 3 WHEN active_count >= 50 THEN 2 WHEN active_count >= 10 THEN 1 ELSE 0 END, 'active_count', active_count, 'commission_percentage', CASE WHEN active_count >= 1000 THEN 20 WHEN active_count >= 100 THEN 10 WHEN active_count >= 50 THEN 5 WHEN active_count >= 10 THEN 3 ELSE 2 END, 'bonus_amount', CASE WHEN active_count >= 1000 THEN 9000 WHEN active_count >= 100 THEN 800 WHEN active_count >= 50 THEN 500 ELSE 0 END) FROM (SELECT public.get_user_active_referral_count(p_user_id) as active_count) ac;
$$;

-- Get user referral stats
CREATE OR REPLACE FUNCTION public.get_user_referral_stats(p_user_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_target_user_id UUID; v_profile profiles%ROWTYPE; v_tier_data JSONB; v_total_referrals INTEGER; v_active_referrals INTEGER; v_total_earnings NUMERIC; v_today_earnings NUMERIC; v_this_month_earnings NUMERIC;
BEGIN
    v_target_user_id := COALESCE(p_user_id, auth.uid());
    IF v_target_user_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Not authenticated'); END IF;
    SELECT * INTO v_profile FROM public.profiles WHERE user_id = v_target_user_id;
    IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'User not found'); END IF;
    SELECT * INTO v_tier_data FROM public.get_user_referral_tier(v_target_user_id);
    SELECT COUNT(*), COUNT(CASE WHEN p.total_deposit > 0 THEN 1 END) INTO v_total_referrals, v_active_referrals FROM public.referrals r JOIN public.profiles p ON r.referred_id = p.id WHERE r.referrer_id = v_profile.id;
    SELECT COALESCE(SUM(commission_amount), 0), COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN commission_amount END), 0), COALESCE(SUM(CASE WHEN DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE) THEN commission_amount END), 0) INTO v_total_earnings, v_today_earnings, v_this_month_earnings FROM public.referral_commissions WHERE referrer_id = v_profile.id;
    RETURN jsonb_build_object('success', true, 'current_tier', v_tier_data, 'total_referrals', v_total_referrals, 'active_referrals', v_active_referrals, 'total_earnings', v_total_earnings, 'today_earnings', v_today_earnings, 'this_month_earnings', v_this_month_earnings, 'referral_code', v_profile.referral_code, 'referral_link', 'https://apnatrade.com/signup?ref=' || v_profile.referral_code);
END;
$$;

-- =====================================================
-- 4. TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS set_referral_code_trigger ON public.profiles;
CREATE TRIGGER set_referral_code_trigger BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_referral_code();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_wallet_data_updated_at ON public.user_wallet_data;
CREATE TRIGGER update_user_wallet_data_updated_at BEFORE UPDATE ON public.user_wallet_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_qr_codes_updated_at ON public.admin_qr_codes;
CREATE TRIGGER update_admin_qr_codes_updated_at BEFORE UPDATE ON public.admin_qr_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candle_bet_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallet_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_referral_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_qr_codes ENABLE ROW LEVEL SECURITY;

-- Profiles policies (cleanup + recreate)
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admin can update all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view own profile or admin can view all" ON public.profiles FOR SELECT
    USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile or admin can update all" ON public.profiles FOR UPDATE
    USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'));

-- User roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Referrals policies
DROP POLICY IF EXISTS "Users can view own referrals or admin can view all" ON public.referrals;
DROP POLICY IF EXISTS "Users can insert referrals for themselves" ON public.referrals;
DROP POLICY IF EXISTS "Admin can update referrals" ON public.referrals;
DROP POLICY IF EXISTS "Prevent referral modification" ON public.referrals;
DROP POLICY IF EXISTS "Prevent referral deletion" ON public.referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are referrer" ON public.referrals;
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;

CREATE POLICY "Users can view own referrals or admin can view all" ON public.referrals FOR SELECT
    USING ((referrer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert referrals for themselves" ON public.referrals FOR INSERT
    WITH CHECK (referred_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admin can update referrals" ON public.referrals FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Prevent referral modification" ON public.referrals FOR UPDATE USING (false);
CREATE POLICY "Prevent referral deletion" ON public.referrals FOR DELETE USING (false);

-- Referral commissions policies
DROP POLICY IF EXISTS "Users can view their own referral commissions" ON public.referral_commissions;
DROP POLICY IF EXISTS "System can insert referral commissions" ON public.referral_commissions;
DROP POLICY IF EXISTS "Prevent referral commission modification" ON public.referral_commissions;
DROP POLICY IF EXISTS "Prevent referral commission deletion" ON public.referral_commissions;

CREATE POLICY "Users can view their own referral commissions" ON public.referral_commissions FOR SELECT
    USING (referrer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
CREATE POLICY "System can insert referral commissions" ON public.referral_commissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Prevent referral commission modification" ON public.referral_commissions FOR UPDATE USING (false);
CREATE POLICY "Prevent referral commission deletion" ON public.referral_commissions FOR DELETE USING (false);

-- Referral tiers policies
DROP POLICY IF EXISTS "Anyone can view referral tiers" ON public.referral_tiers;
DROP POLICY IF EXISTS "Admins can manage referral tiers" ON public.referral_tiers;
CREATE POLICY "Anyone can view referral tiers" ON public.referral_tiers FOR SELECT USING (true);
CREATE POLICY "Admins can manage referral tiers" ON public.referral_tiers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trades policies (hardened)
DROP POLICY IF EXISTS "Authenticated users can view own trades" ON public.trades;
DROP POLICY IF EXISTS "Verified admins can view all trades" ON public.trades;
DROP POLICY IF EXISTS "Authenticated users can insert own trades" ON public.trades;
DROP POLICY IF EXISTS "Authenticated users can update own trades" ON public.trades;
DROP POLICY IF EXISTS "Prevent trade deletion" ON public.trades;
DROP POLICY IF EXISTS "Users can view their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can insert their own trades" ON public.trades;
DROP POLICY IF EXISTS "Users can update their own trades" ON public.trades;
DROP POLICY IF EXISTS "Admin can view all trades" ON public.trades;

CREATE POLICY "Authenticated users can view own trades" ON public.trades FOR SELECT
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Verified admins can view all trades" ON public.trades FOR SELECT
    USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can insert own trades" ON public.trades FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Authenticated users can update own trades" ON public.trades FOR UPDATE
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id AND result = 'pending');
CREATE POLICY "Prevent trade deletion" ON public.trades FOR DELETE USING (false);

-- Transactions policies (hardened)
DROP POLICY IF EXISTS "Authenticated users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Verified admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Verified admins can update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Prevent transaction deletion" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions or admin can view all" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admin can update transactions" ON public.transactions;

CREATE POLICY "Authenticated users can view own transactions" ON public.transactions FOR SELECT
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Verified admins can view all transactions" ON public.transactions FOR SELECT
    USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can insert own transactions" ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Verified admins can update transactions" ON public.transactions FOR UPDATE
    USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Prevent transaction deletion" ON public.transactions FOR DELETE USING (false);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admin can manage all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Prevent notification deletion" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage all notifications" ON public.notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Prevent notification deletion" ON public.notifications FOR DELETE USING (false);

-- Platform settings policies (admin only)
DROP POLICY IF EXISTS "Admins can read platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Admins can insert platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Admins can update platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Admins can delete platform settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Service role only" ON public.platform_settings;
DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.platform_settings;
DROP POLICY IF EXISTS "Authenticated users can manage settings" ON public.platform_settings;

CREATE POLICY "Admins can read platform settings" ON public.platform_settings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert platform settings" ON public.platform_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update platform settings" ON public.platform_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete platform settings" ON public.platform_settings FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Active bets policies (hardened)
DROP POLICY IF EXISTS "Authenticated users can view own bets" ON public.active_bets;
DROP POLICY IF EXISTS "Verified admins can view all bets" ON public.active_bets;
DROP POLICY IF EXISTS "Authenticated users can insert own bets" ON public.active_bets;
DROP POLICY IF EXISTS "Prevent bet modification" ON public.active_bets;
DROP POLICY IF EXISTS "Prevent bet deletion" ON public.active_bets;
DROP POLICY IF EXISTS "Users can view their own bets" ON public.active_bets;
DROP POLICY IF EXISTS "Users can insert their own bets" ON public.active_bets;

CREATE POLICY "Authenticated users can view own bets" ON public.active_bets FOR SELECT
    USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Verified admins can view all bets" ON public.active_bets FOR SELECT
    USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can insert own bets" ON public.active_bets FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Prevent bet modification" ON public.active_bets FOR UPDATE USING (false);
CREATE POLICY "Prevent bet deletion" ON public.active_bets FOR DELETE USING (false);

-- Candle aggregates policies
DROP POLICY IF EXISTS "Anyone can view aggregates" ON public.candle_bet_aggregates;
DROP POLICY IF EXISTS "Authenticated can view aggregates" ON public.candle_bet_aggregates;
CREATE POLICY "Authenticated can view aggregates" ON public.candle_bet_aggregates FOR SELECT USING (auth.uid() IS NOT NULL);

-- User wallet data policies
DROP POLICY IF EXISTS "Users can view own wallet data" ON public.user_wallet_data;
DROP POLICY IF EXISTS "Users can insert own wallet data" ON public.user_wallet_data;
DROP POLICY IF EXISTS "Users can update own unlocked wallet" ON public.user_wallet_data;
DROP POLICY IF EXISTS "No delete on wallet data" ON public.user_wallet_data;

CREATE POLICY "Users can view own wallet data" ON public.user_wallet_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet data" ON public.user_wallet_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own unlocked wallet" ON public.user_wallet_data FOR UPDATE USING (auth.uid() = user_id AND wallet_locked = false);
CREATE POLICY "No delete on wallet data" ON public.user_wallet_data FOR DELETE USING (false);

-- Daily referral earnings policies
DROP POLICY IF EXISTS "Users can view their own daily earnings" ON public.daily_referral_earnings;
DROP POLICY IF EXISTS "System only insert earnings" ON public.daily_referral_earnings;
DROP POLICY IF EXISTS "System only update earnings" ON public.daily_referral_earnings;
DROP POLICY IF EXISTS "System only delete earnings" ON public.daily_referral_earnings;

CREATE POLICY "Users can view their own daily earnings" ON public.daily_referral_earnings FOR SELECT
    USING (referrer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "System only insert earnings" ON public.daily_referral_earnings FOR INSERT WITH CHECK (false);
CREATE POLICY "System only update earnings" ON public.daily_referral_earnings FOR UPDATE USING (false);
CREATE POLICY "System only delete earnings" ON public.daily_referral_earnings FOR DELETE USING (false);

-- Admin QR codes policies
DROP POLICY IF EXISTS "Admins can manage QR codes" ON public.admin_qr_codes;
DROP POLICY IF EXISTS "Users can read active QR codes" ON public.admin_qr_codes;
CREATE POLICY "Admins can manage QR codes" ON public.admin_qr_codes FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can read active QR codes" ON public.admin_qr_codes FOR SELECT USING (is_active = true);

-- =====================================================
-- 6. STORAGE BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', true) ON CONFLICT (id) DO NOTHING;

-- Avatars policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Screenshots policies
DROP POLICY IF EXISTS "Screenshots are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own screenshots" ON storage.objects;

CREATE POLICY "Screenshots are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'screenshots');
CREATE POLICY "Users can upload screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'screenshots' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own screenshots" ON storage.objects FOR UPDATE USING (bucket_id = 'screenshots' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own screenshots" ON storage.objects FOR DELETE USING (bucket_id = 'screenshots' AND auth.role() = 'authenticated');

-- =====================================================
-- 7. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON public.trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON public.trades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user_created ON public.trades (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_status_created ON public.transactions (user_id, type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON public.referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_referred ON public.referrals (referrer_id, referred_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_active_bets_candle ON active_bets(candle_key, status);
CREATE INDEX IF NOT EXISTS idx_active_bets_user ON active_bets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_active_bets_pending ON active_bets(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_active_bets_user_candle_status ON public.active_bets (user_id, candle_key, status);
CREATE INDEX IF NOT EXISTS idx_candle_aggregates_key ON candle_bet_aggregates(candle_key);
CREATE INDEX IF NOT EXISTS idx_candle_aggregates_unsettled ON candle_bet_aggregates(is_settled) WHERE is_settled = false;
CREATE INDEX IF NOT EXISTS idx_user_wallet_data_user_id ON public.user_wallet_data(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_wallet_data_address ON public.user_wallet_data(withdrawal_wallet_address) WHERE withdrawal_wallet_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_events_user_type_created ON public.security_events (user_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_created ON public.referral_commissions (referrer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_transaction ON public.referral_commissions (transaction_id);
CREATE INDEX IF NOT EXISTS idx_admin_qr_codes_active ON public.admin_qr_codes(is_active);

-- =====================================================
-- 8. CONSTRAINTS
-- =====================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_balance_non_negative;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_balance_non_negative CHECK (balance >= 0);

ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_amount_positive;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_amount_positive CHECK (amount > 0);

ALTER TABLE public.active_bets DROP CONSTRAINT IF EXISTS active_bets_amount_range;
ALTER TABLE public.active_bets ADD CONSTRAINT active_bets_amount_range CHECK (amount >= 10 AND amount <= 5000);

-- =====================================================
-- 9. DEFAULT DATA
-- =====================================================

-- Referral tiers
INSERT INTO public.referral_tiers (tier_level, min_referrals, max_referrals, commission_percentage, one_time_bonus)
VALUES (0, 0, 9, 2.00, 0), (1, 10, 49, 3.00, 0), (2, 50, 99, 5.00, 500), (3, 100, 999, 10.00, 800), (4, 1000, NULL, 20.00, 9000)
ON CONFLICT (tier_level) DO UPDATE SET min_referrals = EXCLUDED.min_referrals, max_referrals = EXCLUDED.max_referrals, commission_percentage = EXCLUDED.commission_percentage, one_time_bonus = EXCLUDED.one_time_bonus;

-- Admin UPI ID
INSERT INTO public.platform_settings (key, value) VALUES ('admin_upi_id', 'admin@apnatrade') ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 10. REALTIME
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.candle_bet_aggregates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_referral_earnings;

-- =====================================================
-- 11. INITIAL ADMIN SETUP
-- After running this, make admin with:
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'selfashad@gmail.com';
-- =====================================================