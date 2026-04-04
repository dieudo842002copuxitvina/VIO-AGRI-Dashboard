# Escrow Payment System Implementation Guide

## Overview
This document outlines the Escrow (Ký quỹ) payment system built for B2B deals with a feature flag to toggle between automated and manual payment processing.

---

## Part 1: Database Schema

### What Was Created

**File**: `database/escrow_schema.sql`

This SQL script implements:

1. **system_settings Table**
   - `id`: Auto-increment primary key (default=1)
   - `is_payment_enabled`: Boolean flag to toggle payment system on/off (default=false)
   - Used for feature flagging when the startupis ready to enable automated payments

2. **deals Table Updates**
   - `deposit_amount`: Numeric field to store the required escrow amount
   - `payment_status`: Text field with values: `'unpaid'`, `'locked'`, `'released'`, `'refunded'`
   - Tracks the lifecycle of money in each deal

3. **transactions Table** (New)
   - `id`: UUID primary key
   - `deal_id`: Foreign key to deals
   - `user_id`: Foreign key to auth.users (who made the transaction)
   - `amount`: Numeric value of the transaction
   - `type`: Transaction type ('deposit', 'payout', 'refund')
   - `status`: Transaction status ('pending', 'success', 'failed')
   - `payment_method`: Optional (e.g., 'vimomo', 'bank_transfer')
   - `reference_code`: Unique reference for tracking
   - `error_message`: Optional error details for failed transactions
   - `created_at`, `updated_at`: Timestamps

4. **Row Level Security (RLS)**
   - Users can only view their own transactions
   - Service role can insert and update transactions
   - Secure by default

### How to Apply

1. Go to Supabase dashboard → SQL Editor
2. Copy entire contents of `database/escrow_schema.sql`
3. Execute the script
4. Verify tables created and RLS policies applied

**Note**: The default `is_payment_enabled` is `false`, so the system starts with manual bank transfers until admin enables automated payments.

---

## Part 2: Deal Room UI Updates

### File Updated
`src/app/b2b/deal/[id]/page.tsx`

### Key Changes

#### 1. **New Types**
```tsx
type Deal = {
  // ... existing fields
  deposit_amount?: number | null
  payment_status?: 'unpaid' | 'locked' | 'released' | 'refunded'
}

type SystemSettings = {
  id: number
  is_payment_enabled: boolean
}
```

#### 2. **Component State**
- `systemSettings`: Holds the feature flag from database
- `currentUser`: Current authenticated user
- `isProcessingPayment`: Loading state for payment button

#### 3. **Data Fetching**
- Fetches `system_settings` table to get the feature flag
- Stores current user info for permission checks

#### 4. **Payment CTA Section** (Conditional Rendering)

Only displays when:
- `deal.status === 'accepted'` (both parties agreed)
- `deal.payment_status === 'unpaid'` (payment not made yet)
- `currentUser?.id === deal.buyer_id` (only buyer can pay)

#### 5. **Feature Flag Logic**

**If `is_payment_enabled === true`:**
```
Automated Payment Option
├─ Icon: Zap (Lightning bolt)
├─ Badge: "Nhanh & An toàn" (Fast & Safe)
├─ Description: "Pay via PayOS/VNPay"
└─ Button: "Thanh toán cọc qua PayOS/VNPay"
   └─ Mocked to alert (ready for integration)
```

**If `is_payment_enabled === false`:**
```
Manual Bank Transfer Option
├─ Icon: Gold background (Amber)
├─ Badge: "Thanh toán Thủ công" (Manual)
├─ Information Box with:
│  ├─ Bank: VietComBank (VCB)
│  ├─ Account: 0123456789 (placeholder)
│  ├─ Transfer Content: Ky_quy_[dealIdFirst8Chars]
│  └─ Auto-confirmation message
└─ Button: "Sao chép nội dung chuyển khoản"
   └─ Copies transfer note to clipboard
```

#### 6. **Security Notice**
Always displayed: Explains escrow protection (money only released after buyer confirms receipt)

---

## Part 3: UI/UX Flow

### State Diagram

```
Deal Created (status: pending)
        ↓
Both Agree on Price (status: accepted)
        ↓
[PAYMENT SECTION APPEARS]
        ↓
    ┌──────┴──────┐
    ↓             ↓
[Automated]   [Manual]
 PayOS/VNPay  Bank Transfer
    ↓             ↓
payment_status: locked (upon confirmation)
    ↓
[Negotiation/Chat]
    ↓
Buyer confirms receipt → payment_status: released
    ↓
Seller receives payment
```

### User Flows

#### 1. Automated Payment Flow (Future)
1. Deal accepted
2. Buyer clicks "Thanh toán cọc qua PayOS/VNPay"
3. Redirected to PayOS/VNPay gateway (mocked now)
4. Payment confirmed
5. `payment_status` → 'locked'
6. Chat/negotiation can now occur
7. Buyer confirms receipt → `payment_status` → 'released'

#### 2. Manual Payment Flow (Current Default)
1. Deal accepted
2. Payment section shows bank transfer instructions
3. Buyer clicks "Sao chép nội dung chuyển khoản"
4. Content copied: `Ky_quy_[dealId]`
5. Buyer transfers to VCB Account
6. Admin system monitors account for incoming transfers
7. On match, `payment_status` → 'locked' (manual)
8. Chat can occur
9. Buyer confirms receipt → `payment_status` → 'released'

---

## Part 4: Admin Feature Flag Management

### How Admin Toggles Feature

1. Go to Supabase dashboard → SQL Editor
2. Run:
```sql
-- Enable automated payments
UPDATE system_settings SET is_payment_enabled = true WHERE id = 1;

-- Disable automated payments (revert to manual)
UPDATE system_settings SET is_payment_enabled = false WHERE id = 1;
```

Or via Supabase UI:
1. Go to `system_settings` table
2. Edit row with `id=1`
3. Toggle `is_payment_enabled` ON/OFF
4. All Deal Rooms immediately reflect the change

### Rollout Strategy

Recommended approach:
1. **Phase 1** (Now): Manual bank transfers only (`is_payment_enabled=false`)
2. **Phase 2** (Week 2-4): Test automated payments with select users
3. **Phase 3** (Week 5+): Full rollout of automated payments

---

## Part 5: Integration Checklist

- [x] Database schema created
- [x] Deal Room UI updated with feature flag logic
- [x] Automated payment button (mock, ready for PayOS/VNPay integration)
- [x] Manual payment instructions with clipboard copy
- [x] RLS policies for transactions table
- [ ] PayOS/VNPay API integration (next phase)
- [ ] Transaction tracking dashboard (future)
- [ ] Automated refund logic (future)

---

## Part 6: Code Snippets for Future Integration

### PayOS Integration Example (Ready to Implement)
```tsx
const handleInitiatePayment = async () => {
  // Replace alert with:
  const response = await fetch('/api/payment/create', {
    method: 'POST',
    body: JSON.stringify({
      dealId: deal.id,
      amount: deal.deposit_amount,
      buyerId: currentUser!.id,
    }),
  })
  const { paymentUrl } = await response.json()
  window.location.href = paymentUrl
}
```

### Transaction Logging
```tsx
// After payment confirmation:
const { error } = await supabase
  .from('transactions')
  .insert({
    deal_id: deal.id,
    user_id: currentUser!.id,
    amount: deal.deposit_amount,
    type: 'deposit',
    status: 'success',
    payment_method: 'payos',
    reference_code: paymentId,
  })
```

---

## Testing

### Test Scenario 1: Automated Payments Enabled
1. Set `is_payment_enabled = true`
2. Accept a deal
3. Verify green "Thanh toán cọc qua PayOS/VNPay" button appears
4. Click → Should see alert (mock)

### Test Scenario 2: Manual Payments Enabled (Default)
1. Set `is_payment_enabled = false`
2. Accept a deal
3. Verify amber bank transfer instructions appear
4. Copy button works
5. Verify content: `Ky_quy_[dealId]`

### Test Scenario 3: Permission Check
1. Seller tries to initiate deal from their own listing
2. Should see error: "Bạn không thể tự thương lượng với lô hàng của chính mình"
3. Verify payment section only shows for buyer

---

## Architecture Benefits

✅ **Feature Flag Pattern**: Toggle payments on/off without redeploying
✅ **RLS Security**: Users only see their own transactions
✅ **Audit Trail**: All transactions logged for compliance
✅ **Flexible**: Easy to swap PayOS/VNPay/Stripe later
✅ **Graceful Fallback**: Works with manual transfers until ready

---

## Next Steps

1. **Deploy SQL schema** to Supabase
2. **Test feature flag toggle** via Supabase UI
3. **Test both payment flows** with test users
4. **Document admin procedures** for your team
5. **Integrate PayOS/VNPay** when APIs ready
6. **Set up transaction webhook** for payment confirmations
