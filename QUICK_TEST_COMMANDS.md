# Quick Test Commands

## Setup (First Time Only)

```bash
# 1. In Supabase SQL Editor, execute:
# → Copy entire content of decision_engine_schema.sql
# → Paste in Supabase SQL Editor
# → Click "Run"

# 2. Verify tables created:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
# Should list: market_data, user_profiles, decision_logs, user_behavior, recommendations
```

---

## Test 1: Ingest Real Data

```bash
# Option A: cURL
curl -X POST http://localhost:3000/api/commodities/ingest

# Option B: JavaScript
fetch('http://localhost:3000/api/commodities/ingest', {
  method: 'POST'
}).then(r => r.json()).then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Commodity prices ingested successfully",
  "timestamp": "2026-03-28T17:24:30Z"
}
```

---

## Test 2: Verify Data in Database

```sql
-- In Supabase SQL Editor

-- Check commodity prices
SELECT COUNT(*) as count FROM market_data;
-- Should be > 0

-- View latest prices
SELECT commodity_name, current_price, price_unit, timestamp 
FROM market_data 
ORDER BY timestamp DESC 
LIMIT 10;
```

---

## Test 3: Get Live Prices from API

```bash
# Option A: cURL
curl http://localhost:3000/api/commodities

# Option B: JavaScript
fetch('/api/commodities')
  .then(r => r.json())
  .then(console.log)

# Option C: Browser
# Go to http://localhost:3000/api/commodities
```

**Expected Response:**
```json
[
  {
    "id": "rice",
    "name": "Rice (5% Broken)",
    "symbol": "RICE5",
    "unit": "USD/MT",
    "current_price": 485.3,
    "change_24h": 2.5,
    "change_percent_24h": 0.52,
    "trend": "up",
    "demand_level": "high",
    "supply_level": "low",
    "volatility_index": 42,
    "timestamp": "2026-03-28T17:24:30Z",
    "source": "Supabase"
  },
  ...
]
```

---

## Test 4: Run Decision Engine

```bash
# Option A: cURL
curl -X POST http://localhost:3000/api/decision \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_001"}'

# Option B: JavaScript
fetch('http://localhost:3000/api/decision', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: 'user_001' })
}).then(r => r.json()).then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "userId": "user_001",
  "insights": [
    {
      "id": "insight_001",
      "category": "opportunity",
      "title": "Favorable market conditions for rice",
      "description": "Rice prices trending up with high demand",
      "confidence": 0.92,
      "priority": "high",
      "actionable": true,
      "recommendation": "List rice now before prices stabilize"
    }
  ],
  "recommendations": [
    {
      "id": "rec_001",
      "type": "product",
      "title": "Soil Moisture Sensor Pro",
      "priority": "high",
      "confidence": 0.85,
      "score": 82
    }
  ],
  "summary": "Market analysis complete with 8 commodities analyzed",
  "executionTime": 234,
  "rulesExecuted": 5,
  "dataPoints": {
    "commodities": 8,
    "userAccountAge": 450,
    "qualityScore": 88
  }
}
```

---

## Test 5: Check Decision Engine Results

```sql
-- In Supabase SQL Editor

-- View latest decision results
SELECT user_id, session_id, insights, recommendations, created_at
FROM decision_logs
ORDER BY created_at DESC
LIMIT 5;

-- Count decisions by user
SELECT user_id, COUNT(*) as decision_count
FROM decision_logs
GROUP BY user_id;
```

---

## Test 6: Full End-to-End

```bash
# Step 1: Ingest data
curl -X POST http://localhost:3000/api/commodities/ingest
# Wait 2 seconds

# Step 2: Get prices
curl http://localhost:3000/api/commodities | head -20

# Step 3: Run decision engine
curl -X POST http://localhost:3000/api/decision \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_001"}' | jq '.insights[0]'

# Step 4: Check database
# (In Supabase SQL Editor)
SELECT * FROM decision_logs ORDER BY created_at DESC LIMIT 1;
```

---

## Troubleshooting

### Problem: "No commodity data"

**Solution:**
```bash
# 1. Trigger ingestion
curl -X POST http://localhost:3000/api/commodities/ingest

# 2. Wait a few seconds

# 3. Check if data exists
curl http://localhost:3000/api/commodities

# 4. If still empty, check Supabase table
# SELECT COUNT(*) FROM market_data;
```

### Problem: Decision Engine returns 404

**Solution:**
```bash
# 1. Ensure user_001 profile exists
# SELECT * FROM user_profiles WHERE user_id = 'user_001';

# 2. Or create test user:
INSERT INTO user_profiles (user_id, email, region, interests, created_at)
VALUES ('user_001', 'test@farm.vn', 'Mekong Delta', '{"rice", "vegetables"}', NOW());

# 3. Try again
curl -X POST http://localhost:3000/api/decision \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_001"}'
```

### Problem: API returns 500 error

**Solution:**
1. Check browser console for errors
2. Check server logs: `npm run dev` output
3. Verify Supabase credentials in `.env.local`
4. Check database connection: Can you query `SELECT 1;` in SQL Editor?
5. Ensure tables exist: `SELECT table_name FROM information_schema.tables`

---

## Performance Check

```bash
# Measure Decision Engine response time
time curl -X POST http://localhost:3000/api/decision \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_001"}' > /dev/null

# Should be < 1 second total
# Decision Engine: 50-150ms
# Data fetch: 50-200ms
# Storage: <50ms
# Total: <500ms
```

---

## Data Sources Check

```bash
# Test World Bank API
curl https://api.worldbank.org/v2/country/commodity/price?mrnev=5&format=json | head -20

# Test CoinGecko API
curl https://api.coingecko.com/api/v3/simple/price?ids=agriculture&vs_currencies=usd

# Test QUANDL API (if key set)
curl "https://www.quandl.com/api/v3/datasets/FRED/PRICEDMD/data.json?api_key=YOUR_KEY&rows=1"
```

---

## Database Schema Check

```sql
-- Verify all tables exist
SELECT table_name, column_count 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify indexes
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Should see ~43 indexes total
```

---

## Sample Test Users

```sql
-- Create test user if not exists
INSERT INTO user_profiles (
  user_id, email, region, interests, created_at
) VALUES (
  'user_001', 
  'duc@farm.vn', 
  'Mekong Delta', 
  ARRAY['rice', 'vegetables'],
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Query to verify
SELECT * FROM user_profiles WHERE user_id = 'user_001';
```

---

## Quick Commands Summary

```bash
# Start ingestion
curl -X POST http://localhost:3000/api/commodities/ingest

# Get prices
curl http://localhost:3000/api/commodities

# Run decision engine
curl -X POST http://localhost:3000/api/decision \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_001"}'

# Health check
curl http://localhost:3000/api/commodities
curl http://localhost:3000/api/decision (GET)
```

---

## Expected Results

✅ **Ingestion succeeds** → market_data table has prices  
✅ **Prices API returns data** → Real commodity prices from Supabase  
✅ **Decision Engine runs** → Insights based on real market data  
✅ **Results stored** → decision_logs table has entries  
✅ **Performance < 500ms** → Fast end-to-end execution  

---

**All tests passing? You have a working real data pipeline!** 🚀
