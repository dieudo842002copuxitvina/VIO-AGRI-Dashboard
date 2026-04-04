# Admin Feature Flag Guide

## Quick Start: Toggle Payment System

### Current Status
- **Feature Flag**: `is_payment_enabled` (default: **FALSE** = Manual Payments)
- **Location**: `system_settings` table, row `id=1`

---

## Scenario 1: Activate Automated Payments (PayOS/VNPay)

### Via Supabase Dashboard (Easiest)
1. Open Supabase Console → Your Project
2. Go to **Data Editor** → Select `system_settings` table
3. Find row with `id = 1`
4. Click the `is_payment_enabled` toggle → Turn **ON**
5. Save

✅ **Result**: All new deals will show "Thanh toán cọc qua PayOS/VNPay" button

### Via SQL
```sql
UPDATE system_settings SET is_payment_enabled = true WHERE id = 1;
```

Check:
```sql
SELECT * FROM system_settings WHERE id = 1;
```

---

## Scenario 2: Revert to Manual Bank Transfers

### Via Supabase Dashboard
1. Open Supabase Console → Your Project
2. Go to **Data Editor** → Select `system_settings` table
3. Find row with `id = 1`
4. Click the `is_payment_enabled` toggle → Turn **OFF**
5. Save

✅ **Result**: All new deals will show manual bank transfer instructions

### Via SQL
```sql
UPDATE system_settings SET is_payment_enabled = false WHERE id = 1;
```

---

## What Users See

### When is_payment_enabled = FALSE (Current)
```
📋 Payment Section for Accepted Deals:

  🏦 Manual Bank Transfer Instructions
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Transfer to: VietComBank (VCB)
  Account: 0123456789
  Content: Ky_quy_[dealId]

  [📋 Copy Transfer Content Button]
```

### When is_payment_enabled = TRUE (Future)
```
⚡ Automated Payment Processing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Fast & Safe

[💳 Pay via PayOS/VNPay Button]
```

---

## Monitoring Transactions

### View All Transactions
1. Go to Supabase → **Data Editor** → `transactions` table
2. Columns visible:
   - `deal_id`: Which deal
   - `user_id`: Who paid
   - `amount`: How much
   - `type`: 'deposit', 'payout', 'refund'
   - `status`: 'pending', 'success', 'failed'
   - `reference_code`: Transaction ID
   - `created_at`: When

### Query Example: Failed Transactions
```sql
SELECT * FROM transactions
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Query Example: Total Escrow Locked
```sql
SELECT SUM(amount) as total_locked
FROM transactions
WHERE status = 'success' AND type = 'deposit';
```

---

## Rollout Plan (Recommended)

### Phase 1: Manual Only ✅ CURRENT
- `is_payment_enabled = FALSE`
- System operates with manual bank transfers
- Team familiarizes with VIO AGRI B2B flows
- **Duration**: 2-3 weeks

### Phase 2: Testing (Week 3-4)
- `is_payment_enabled = TRUE`
- Enable for 5-10 test users
- Monitor transactions closely
- Gather feedback
- **Action**: Update feature flag

### Phase 3: Full Rollout (Week 5+)
- `is_payment_enabled = TRUE`
- All users see automated payment option
- Keep monitoring transactions
- **Action**: Activate completely

---

## Troubleshooting

### Q: Changed flag but users still see old state
**A**: Users' browsers might be caching. Ask them to hard refresh (Ctrl+Shift+R)

### Q: How do I know if PayOS integration is working?
**A**:
1. Check `transactions` table for entries
2. Verify `status` = 'success'
3. Monitor `reference_code` against PayOS dashboard

### Q: Can I toggle mid-day?
**A**: Yes! Changes are instant. Existing deals keep their payment methods, new deals use current setting.

### Q: What if I enable PayOS but it fails?
**A**:
1. Quickly set `is_payment_enabled = FALSE`
2. Users will see manual bank transfer option
3. No data loss - system is graceful

---

## Important Security Notes

⚠️ **RLS Policies Active**
- Users can ONLY view their own transactions
- Admin can view all (via service role)
- Never expose `transactions` table directly to frontend without filters

⚠️ **Payment Status Fields**
- `payment_status` values: 'unpaid', 'locked', 'released', 'refunded'
- Only system/admin should update these
- Add backend validation before releasing funds

---

## Contact Support

For issues with:
- **Supabase access**: Check project API keys in Settings
- **Payment provider**: Contact PayOS/VNPay support
- **VIO AGRI app**: Check application logs and error messages
