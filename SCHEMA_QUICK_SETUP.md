# Database Schema - Quick Setup Guide

## ⚡ 5-Minute Setup

### Step 1: Copy SQL File
```bash
# File location: decision_engine_schema.sql
# Copy content from the file
```

### Step 2: Open Supabase SQL Editor

1. Go to Supabase Dashboard
2. Click "SQL Editor"
3. Click "New Query"
4. Paste entire SQL file content
5. Click "Run"

### Step 3: Verify Tables
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check indexes
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public';
```

### Step 4: Done! ✅

---

## 📋 Tables Created

| # | Table | Purpose | Rows |
|---|-------|---------|------|
| 1 | user_profiles | User data & preferences | 100/day |
| 2 | decision_logs | Decision outputs & analytics | 10K/day |
| 3 | recommendations | Recommendation catalog | 100 |
| 4 | market_data | Commodity pricing | 5K/day |
| 5 | user_behavior | User interactions | 50K/day |

**Total Indexes:** 43  
**Total Size:** ~2GB (at scale)

---

## 🗂️ Table Schemas (Quick Reference)

### user_profiles
```
user_id (UUID)          ← Primary key
email (VARCHAR)         ← Indexed, unique
role (VARCHAR)          ← farmer, trader, supplier, admin
region (VARCHAR)        ← Indexed
interests (TEXT[])      ← Array, indexed
farm_size_hectares      ← Numeric
farm_location (POINT)   ← Geographic, indexed
risk_tolerance          ← low, medium, high
metadata (JSONB)        ← Flexible, indexed
is_active (BOOLEAN)     ← Indexed
created_at, updated_at  ← Timestamps
```

### decision_logs
```
id (UUID)               ← Primary key
user_id (UUID)          ← FK to user_profiles, indexed
session_id (VARCHAR)    ← Unique session ID
insights (JSONB)        ← Array of insights, indexed
recommendations (JSONB) ← Array of recommendations, indexed
confidence_score        ← 0.0-1.0, indexed
execution_time_ms       ← Performance metric
rules_triggered (TEXT[])← Array, indexed
user_feedback           ← positive, negative, neutral
created_at              ← Timestamp, indexed
metadata (JSONB)        ← Flexible
```

### recommendations
```
id (UUID)               ← Primary key
title (VARCHAR)         ← Required
type (VARCHAR)          ← product, action, affiliate, alert
category (VARCHAR)      ← Category, indexed
content (JSONB)         ← Details, indexed
region_applicable (TEXT[])  ← Array, indexed
crop_applicable (TEXT[])    ← Array, indexed
target_audience         ← seller, buyer, both
times_shown             ← Impression counter
times_clicked           ← Click counter
conversion_count        ← Conversion counter
is_active (BOOLEAN)     ← Status filter
created_at, updated_at  ← Timestamps
expires_at              ← Expiry date
metadata (JSONB)        ← Flexible
```

### market_data
```
id (UUID)               ← Primary key
commodity_id (VARCHAR)  ← Commodity key
commodity_name (VARCHAR)← Name (rice, coffee, etc.)
region (VARCHAR)        ← Market region
current_price           ← Latest price
price_unit              ← Unit (VND/kg, USD/kg)
price_change_24h        ← Raw change
price_change_percentage_24h ← % change
demand_level            ← low, medium, high
supply_level            ← low, medium, high
trend_direction         ← uptrend, downtrend, sideways
volatility_index        ← 0-100
timestamp               ← Data timestamp
is_verified (BOOLEAN)   ← Quality flag
```

### user_behavior
```
id (UUID)               ← Primary key
user_id (UUID)          ← FK to user_profiles
event_type (VARCHAR)    ← Event classification
event_data (JSONB)      ← Event details
decision_log_id (UUID)  ← Reference
recommendation_id (UUID)← Reference
created_at              ← Timestamp
metadata (JSONB)        ← Flexible
```

---

## 🔍 Index Overview

### 43 Indexes Total

**user_profiles (8 indexes):**
- Single: email, region, role, is_active, created_at
- Array GIN: interests
- Spatial GIST: farm_location
- JSONB GIN: metadata

**decision_logs (10 indexes):**
- Single: user_id, created_at, session_id, confidence_score
- Composite: user_id+created_at
- Array GIN: rules_triggered
- JSONB GIN: insights, recommendations

**recommendations (11 indexes):**
- Single: type, is_active, created_at, category, target_audience
- Array GIN: region_applicable, crop_applicable
- JSONB GIN: content
- Full-text: title+description
- Popularity: times_shown DESC

**market_data (7 indexes):**
- Single: commodity_id, timestamp, trend_direction
- Composite: commodity_id+region, commodity_id+timestamp
- Filtered: verified only

**user_behavior (7 indexes):**
- Single: user_id, created_at, event_type
- Composite: user_id+event_type, user_id+created_at
- Foreign keys: decision_log_id, recommendation_id

---

## 📊 Common Queries

### Get User
```sql
SELECT * FROM user_profiles WHERE email = 'duc@farm.vn';
```

### Store Decision
```sql
INSERT INTO decision_logs 
(user_id, session_id, insights, recommendations, confidence_score)
VALUES 
($1, $2, $3, $4, 0.92);
```

### Get User's Decisions
```sql
SELECT * FROM decision_logs 
WHERE user_id = $1 
ORDER BY created_at DESC 
LIMIT 10;
```

### Get Active Recommendations
```sql
SELECT * FROM recommendations 
WHERE is_active = true 
  AND crop_applicable @> ARRAY['rice']
ORDER BY times_shown DESC 
LIMIT 5;
```

### Get Latest Market Data
```sql
SELECT * FROM market_data 
WHERE commodity_id = 'rice' 
  AND region = 'Mekong Delta'
ORDER BY timestamp DESC 
LIMIT 1;
```

### Track User Action
```sql
INSERT INTO user_behavior 
(user_id, event_type, decision_log_id, recommendation_id)
VALUES ($1, 'recommendation_clicked', $2, $3);
```

---

## ✅ Verification Checklist

After creating schema:

- [ ] All 5 tables exist
- [ ] All 43 indexes created
- [ ] No errors in SQL execution
- [ ] Row Level Security enabled (optional)
- [ ] Sample data inserted
- [ ] Queries execute <100ms
- [ ] Backup configured
- [ ] Monitoring alerts set

---

## 🚀 Usage in Applications

### Node.js/Supabase Client
```typescript
// Get user profile
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

// Insert decision
const { data } = await supabase
  .from('decision_logs')
  .insert([{
    user_id: userId,
    session_id: generateId(),
    insights: insights,
    recommendations: recommendations,
    confidence_score: 0.92
  }]);

// Get recommendations
const { data } = await supabase
  .from('recommendations')
  .select('*')
  .eq('is_active', true)
  .contains('crop_applicable', ['rice'])
  .limit(5);
```

### Python
```python
# Get recommendations
response = supabase.table("recommendations") \
  .select("*") \
  .eq("is_active", True) \
  .contains("crop_applicable", ["rice"]) \
  .limit(5) \
  .execute()

# Insert decision log
response = supabase.table("decision_logs") \
  .insert({
    "user_id": user_id,
    "session_id": session_id,
    "insights": insights,
    "recommendations": recommendations,
    "confidence_score": 0.92
  }) \
  .execute()
```

---

## 📈 Performance Expectations

| Operation | Time | Notes |
|-----------|------|-------|
| Get user by email | <5ms | Indexed |
| Get recent decisions | 10-50ms | 10 rows, indexed |
| List recommendations | 20-100ms | With filtering |
| Insert decision | <10ms | Single row |
| Batch insert (1K) | <1s | user_behavior |
| Aggregation query | 100-500ms | Full scan with GROUP BY |

---

## 🔧 Maintenance

### Daily
```sql
-- Refresh statistics
ANALYZE user_profiles;
ANALYZE decision_logs;
```

### Weekly
```sql
-- Vacuum for cleanup
VACUUM user_profiles;

-- Check index health
SELECT * FROM pg_stat_user_indexes;
```

### Monthly
```sql
-- Reindex if needed
REINDEX TABLE decision_logs;

-- Archive old data
DELETE FROM decision_logs 
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## ⚙️ Supabase Configuration

### In Supabase Dashboard

1. **SQL Editor**
   - Paste SQL file
   - Run query

2. **Database Settings**
   - Enable backups (daily)
   - Enable Point-in-Time Recovery

3. **Connection Pooling** (optional)
   - Enable PgBouncer
   - Mode: Transaction
   - Pool size: 10-25

4. **Monitoring**
   - Enable slow query log
   - Set threshold: 1000ms

---

## 🐛 Troubleshooting

### "Table already exists"
```sql
-- Drop and recreate
DROP TABLE IF EXISTS decision_logs CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
-- Re-run SQL file
```

### "Index not found"
```sql
-- Check if index exists
SELECT * FROM pg_stat_user_indexes 
WHERE tablename = 'decision_logs';
```

### "Query slow"
```sql
-- Check execution plan
EXPLAIN ANALYZE 
SELECT * FROM decision_logs 
WHERE user_id = $1 
ORDER BY created_at DESC LIMIT 10;
```

### "Connection timeout"
- Enable connection pooling in Supabase
- Use transaction mode
- Increase pool size

---

## 📚 Documentation Files

| File | Purpose | Size |
|------|---------|------|
| decision_engine_schema.sql | Complete SQL schema | 19 KB |
| DATABASE_SCHEMA_GUIDE.md | This guide | 14 KB |
| SCHEMA_QUICK_SETUP.md | Quick reference | 7 KB |

---

## 🎯 Next Steps

1. ✅ Copy & run SQL file in Supabase
2. ✅ Verify all tables created
3. ✅ Test with sample queries
4. ✅ Enable RLS (optional)
5. ⏳ Connect from application
6. ⏳ Monitor performance
7. ⏳ Set up backups

---

## 📞 Support

- **Schema Issues:** Check DATABASE_SCHEMA_GUIDE.md
- **Query Help:** See common queries above
- **Performance:** Review index strategy section
- **Supabase Docs:** https://supabase.com/docs

---

**Status:** ✅ Production Ready  
**Indexes:** 43  
**Tables:** 5  
**Scalable to:** 10M+ rows  

**Ready to use!** 🚀
