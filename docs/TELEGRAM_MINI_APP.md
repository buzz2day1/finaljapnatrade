# 📱 ApnaTrade Telegram Mini App - Complete Deployment Guide

This comprehensive guide covers everything from A to Z for deploying ApnaTrade as a Telegram Mini App.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create Telegram Bot](#step-1-create-telegram-bot)
3. [Step 2: Configure Web App](#step-2-configure-web-app)
4. [Step 3: Publish Website](#step-3-publish-website)
5. [Step 4: Configure Database](#step-4-configure-database)
6. [Step 5: Configure Plisio](#step-5-configure-plisio)
7. [Step 6: Plisio Webhook Setup (IMPORTANT!)](#step-6-plisio-webhook-setup-important)
8. [Step 7: Testing](#step-7-testing)
9. [Step 8: Go Live](#step-8-go-live)
10. [Troubleshooting](#troubleshooting)
11. [Security Checklist](#security-checklist)
12. [Support & Maintenance](#support--maintenance)

---

## Prerequisites

Before starting, ensure you have:

- ✅ Telegram account with a phone number
- ✅ Published ApnaTrade website (Lovable provides this)
- ✅ Plisio account (for crypto deposits/withdrawals)
- ✅ Access to Lovable Cloud backend

---

## Step 1: Create Telegram Bot

### 1.1 Open BotFather

1. Open Telegram app (mobile or desktop)
2. Search for `@BotFather`
3. Click **Start** to begin

### 1.2 Create New Bot

Send the following command:
```
/newbot
```

BotFather will ask:
1. **Bot Name**: `ApnaTrade` (display name, can have spaces)
2. **Username**: `ApnaTradeBot` (unique, must end with `bot`)

### 1.3 Save Your Bot Token

BotFather will give you a token like:
```
7123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
```

⚠️ **IMPORTANT**: Keep this token SECRET! Never share it publicly.

### 1.4 Configure Bot Settings

Send these commands to BotFather:

```
/setdescription
```
Enter description:
```
🚀 ApnaTrade - India's #1 Crypto Trading Platform. Trade with low-fee coins (LTC, TRX, DOGE). Min ₹200 deposit. Near-zero fees!
```

```
/setabouttext
```
Enter about text:
```
Trade crypto with up to 95% returns. Minimum ₹200 deposit. Litecoin withdrawals (lowest fees). Join 10,000+ traders!
```

```
/setuserpic
```
Upload your ApnaTrade logo (512x512 PNG recommended)

---

## Step 2: Configure Web App

### 2.1 Enable Web App Menu Button

Send to BotFather:
```
/setmenubutton
```

1. Select your bot
2. Choose **Web App**
3. Enter button text: `🎯 Open App`
4. Enter URL: `https://candle-king-bet.lovable.app` (your published URL)

### 2.2 Configure Inline Mode (Optional - for sharing)

```
/setinline
```
Enter placeholder text:
```
Share your referral code...
```

### 2.3 Set Bot Commands

```
/setcommands
```
Enter:
```
start - 🚀 Start Trading
help - ❓ Get Help
deposit - 💰 Make a Deposit (Min ₹200)
withdraw - 💸 Withdraw Funds (LTC)
referral - 🎁 Share & Earn
balance - 💵 Check Balance
```

---

## Step 3: Publish Website

### 3.1 Publish from Lovable

1. In Lovable, click **Publish** button
2. Your app will be available at: `https://candle-king-bet.lovable.app`

### 3.2 Verify Website Works

Open the URL in browser and verify:
- ✅ Login/Signup works
- ✅ Trading page loads
- ✅ Wallet page shows correctly
- ✅ Mobile responsive

---

## Step 4: Configure Database

### 4.1 Add Plisio API Credentials to Database

Go to Lovable Cloud → Run SQL and execute:

```sql
-- =====================================================
-- PLISIO API CONFIGURATION (Low-Fee Coins: LTC, TRX, DOGE)
-- Replace values with your actual Plisio credentials
-- =====================================================

-- Set payment mode to Plisio
INSERT INTO platform_settings (key, value)
VALUES ('payment_mode', 'plisio')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add Plisio API Key (get from https://plisio.net/account/api)
INSERT INTO platform_settings (key, value)
VALUES ('plisio_api_key', 'YOUR_PLISIO_API_KEY_HERE')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Add Plisio Secret Key (for webhook verification)
INSERT INTO platform_settings (key, value)
VALUES ('plisio_secret_key', 'YOUR_PLISIO_SECRET_KEY_HERE')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### 4.2 Verify Settings

```sql
SELECT key, 
       CASE WHEN value IS NOT NULL THEN 'SET' ELSE 'NOT SET' END as status
FROM platform_settings 
WHERE key LIKE 'plisio%' OR key = 'payment_mode';
```

---

## Step 5: Configure Plisio

### 5.1 Create Plisio Account

1. Go to [plisio.net](https://plisio.net)
2. Sign up / Login
3. Complete verification (if required for payouts)

### 5.2 Get API Credentials

1. Go to **Account** → **API**
2. Generate API Key (if not already generated)
3. Copy both:
   - **API Key** (for creating payments)
   - **Secret Key** (for webhook verification)

### 5.3 Enable Supported Currencies (LOW-FEE COINS ONLY)

Under **Settings** → **Wallets**, enable ONLY these coins:
- ✅ **LTC (Litecoin)** - PRIMARY/RECOMMENDED (lowest fees!)
- ✅ **TRX (TRON)** - Fast & cheap
- ✅ **DOGE (Dogecoin)** - Very low fees

❌ Do NOT enable: USDT, BTC, ETH, SOL (high fees not suitable for ₹200 min deposits)

---

## Step 6: Plisio Webhook Setup (IMPORTANT!)

### 🔴 This is the MOST CRITICAL step for automatic deposit confirmation!

### 6.1 Find Your Webhook URL

Your webhook URL is:
```
https://avixixwhgifjjnligkuw.supabase.co/functions/v1/plisio-webhook
```

### 6.2 Configure Webhook in Plisio Dashboard

1. Login to [plisio.net](https://plisio.net)
2. Go to **Account** → **Settings**
3. Find **Callback URL** or **Webhook URL** section
4. Paste your webhook URL:
   ```
   https://avixixwhgifjjnligkuw.supabase.co/functions/v1/plisio-webhook
   ```
5. **Save** the settings

### 6.3 Webhook Events

Plisio will send POST requests to your webhook when:
- Payment is **detected** (pending confirmation)
- Payment is **confirming** (waiting for blockchain confirmations)  
- Payment is **confirmed** (deposit successful!)
- Payment **expired** (user didn't pay in time)
- Payment **failed** (error occurred)

### 6.4 Webhook Payload Example

Plisio sends data like this:
```json
{
  "status": "completed",
  "order_number": "deposit_user123_txn456",
  "amount": "15.50",
  "currency": "LTC",
  "source_amount": "1000.00",
  "source_currency": "INR",
  "txn_id": "plisio_transaction_id",
  "verify_hash": "sha256_signature_for_verification"
}
```

### 6.5 Verify Webhook is Working

**Test 1: Check endpoint is reachable**
```bash
curl -X POST https://avixixwhgifjjnligkuw.supabase.co/functions/v1/plisio-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```
Expected: Should return JSON response (any response means endpoint is live)

**Test 2: Check webhook archive table**
After a test deposit, run this SQL:
```sql
SELECT * FROM webhook_archive 
WHERE provider = 'plisio'
ORDER BY created_at DESC
LIMIT 10;
```

### 6.6 What Happens When Deposit is Received

1. User sends LTC/TRX/DOGE to generated address
2. Plisio detects payment on blockchain
3. Plisio sends webhook to your endpoint
4. Edge function verifies signature
5. Edge function updates transaction status to "completed"
6. Edge function adds balance to user's profile
7. If deposit ≥ ₹500, adds 10% welcome bonus
8. If user has referrer, pays 10% referral commission
9. User sees balance update automatically (realtime subscription)

---

## Step 7: Testing

### 7.1 Test Telegram Bot

1. Find your bot in Telegram: `@YourBotUsername`
2. Send `/start`
3. Click the "🎯 Open App" menu button
4. Verify app opens correctly in Telegram WebView

### 7.2 Test User Flow

Complete these tests:

| Test | Expected Result |
|------|-----------------|
| Sign Up | Account created successfully |
| Login | Returns to trading page |
| View Balance | Shows ₹0 for new users |
| Select Deposit Coin | Shows LTC, TRX, DOGE only |
| Generate Deposit Address | Shows payment address |
| Place Trade | Trade executes correctly |
| Win/Loss Animation | Confetti on win |

### 7.3 Test Deposit Flow (Small Amount)

1. Generate deposit address for **LTC** (recommended - lowest fees)
2. Send minimum amount (₹200 worth)
3. Verify:
   - ✅ Webhook receives payment
   - ✅ Balance updates automatically
   - ✅ Success notification appears
   - ✅ 10% bonus applied (if ₹500+)

### 7.4 Transaction Limits

| Type | Minimum | Maximum |
|------|---------|---------|
| Deposit | ₹200 | ₹5,000 per transaction |
| Withdrawal | ₹400 | ₹5,000 per day |

---

## Step 8: Go Live

### 8.1 Pre-Launch Checklist

- [ ] All edge functions deployed (plisio-create-payment, plisio-webhook, plisio-payout)
- [ ] Plisio API key in database
- [ ] Plisio secret key in database  
- [ ] Payment mode set to "plisio"
- [ ] **Webhook URL configured in Plisio dashboard**
- [ ] Bot menu button points to correct URL
- [ ] Website published and accessible
- [ ] Test deposit completed successfully
- [ ] Test withdrawal completed successfully
- [ ] Admin panel accessible

### 8.2 Announce Bot

Share your bot with users:
- Telegram link: `https://t.me/YourBotUsername`
- With referral: `https://t.me/YourBotUsername?start=ref_APNAXXXXXX`

### 8.3 Enable Referral Deep Links

Users can share referral links like:
```
https://t.me/YourBotUsername?start=ref_APNAXXXXXX
```

When users click, they'll:
1. Open Telegram
2. See your bot
3. Click Start
4. Web app opens with referral code pre-filled

---

## Troubleshooting

### Problem: Web App doesn't open

**Solution:**
1. Verify published URL is correct
2. Ensure HTTPS is used (required by Telegram)
3. Check URL responds with 200 status

### Problem: Deposits not crediting

**Solution:**
1. ⚠️ **FIRST: Verify webhook URL is configured in Plisio dashboard!**
2. Check edge function logs in Lovable Cloud
3. Verify secret key matches in database
4. Check `webhook_archive` table for received webhooks:
   ```sql
   SELECT * FROM webhook_archive 
   WHERE provider = 'plisio' 
   ORDER BY created_at DESC LIMIT 10;
   ```

### Problem: "Payment service unavailable"

**Solution:**
1. Verify `plisio_api_key` is set in `platform_settings`
2. Check if API key is valid on Plisio dashboard
3. Verify `payment_mode` is set to `plisio`
4. Look at edge function logs for errors

### Problem: Webhook signature verification failed

**Solution:**
1. Verify `plisio_secret_key` in database matches Plisio dashboard
2. Check webhook_archive for the payload
3. Ensure no extra spaces in secret key

### Problem: Telegram Web App shows white screen

**Solution:**
1. Clear Telegram cache
2. Check browser console for JS errors
3. Verify all routes are working

---

## Security Checklist

### Before Going Live

- [ ] **Bot Token**: Stored securely, not in code
- [ ] **API Keys**: In database `platform_settings`, not in code
- [ ] **RLS Policies**: All tables have row-level security
- [ ] **Webhook Signature**: Secret key configured
- [ ] **Rate Limiting**: Enabled on all RPCs
- [ ] **Password Protection**: Leaked password check enabled (Supabase Auth)
- [ ] **HTTPS Only**: Website uses HTTPS

### Ongoing Security

- [ ] Monitor `security_events` table daily
- [ ] Review `admin_audit_log` weekly
- [ ] Check `login_history` for suspicious activity
- [ ] Review withdrawal requests before processing

---

## Support & Maintenance

### Daily Tasks

1. Check pending withdrawals
2. Monitor deposit confirmations
3. Review security events

### Weekly Tasks

1. Backup database
2. Review user feedback
3. Check Plisio balance

### Useful SQL Queries

**Check pending withdrawals:**
```sql
SELECT * FROM transactions 
WHERE type = 'withdraw' AND status = 'pending'
ORDER BY created_at DESC;
```

**Check recent deposits:**
```sql
SELECT * FROM transactions 
WHERE type = 'deposit' AND status = 'completed'
ORDER BY created_at DESC
LIMIT 20;
```

**Check active users (24h):**
```sql
SELECT COUNT(DISTINCT user_id) FROM trades 
WHERE created_at > NOW() - INTERVAL '24 hours';
```

**Check platform revenue:**
```sql
SELECT 
  SUM(CASE WHEN pnl < 0 THEN ABS(pnl) ELSE 0 END) as platform_profit,
  SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END) as user_winnings,
  COUNT(*) as total_trades
FROM active_bets 
WHERE status IN ('won', 'lost');
```

**Check webhook history:**
```sql
SELECT id, event_type, processing_status, created_at, payload->>'order_number' as order_id
FROM webhook_archive
WHERE provider = 'plisio'
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🎉 Congratulations!

Your ApnaTrade Telegram Mini App is now live with LOW-FEE coins!

### Supported Coins

| Coin | Network | Fees | Recommended |
|------|---------|------|-------------|
| **LTC** | Litecoin | ~₹2 | ⭐ PRIMARY |
| **TRX** | TRON TRC-20 | ~₹1 | ✅ Fast |
| **DOGE** | Dogecoin | ~₹3 | ✅ Popular |

### Quick Links

- **Bot**: `https://t.me/YourBotUsername`
- **Web App**: `https://candle-king-bet.lovable.app`
- **Admin Panel**: `https://candle-king-bet.lovable.app/apnadradeadmin/auth`

### Contact Support

For any issues, check:
1. Lovable documentation
2. Plisio support (https://plisio.net/contact)
3. Telegram Bot API documentation

---

*Last updated: February 2026*
