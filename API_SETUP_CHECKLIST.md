# API Setup Checklist

## ✅ Step-by-Step Setup (10 minutes)

### Step 1: Copy Mock Data File (1 min)
```bash
# Copy mock-data.ts to project root
cp mock-data.ts d:\VIO AGRI\vio-agri-dashboard\
```

**File:** `mock-data.ts` (already created in project root)

---

### Step 2: Create Decision API Route (2 min)

**File Path:** `app/api/decision/route.ts`

**Steps:**
1. Create directory: `app/api/decision/`
2. Create file: `route.ts`
3. Copy content from: `api-decision-route.ts`

**Quick Create:**
```bash
mkdir -p app\api\decision
# Copy api-decision-route.ts content into app\api\decision\route.ts
```

---

### Step 3: Create Recommendation API Route (2 min)

**File Path:** `app/api/recommendation/route.ts`

**Steps:**
1. Create directory: `app/api/recommendation/`
2. Create file: `route.ts`
3. Copy content from: `api-recommendation-route.ts`

**Quick Create:**
```bash
mkdir -p app\api\recommendation
# Copy api-recommendation-route.ts content into app\api\recommendation\route.ts
```

---

### Step 4: Verify Imports (3 min)

Check these files exist in project root:
- ✅ `decision.engine.ts`
- ✅ `decision.types.ts`
- ✅ `recommendation.engine.ts`
- ✅ `recommendation.types.ts`
- ✅ `mock-data.ts` (just created)

---

### Step 5: Start Server (2 min)

```bash
npm run dev
```

**Test Health Check:**
```bash
curl http://localhost:3000/api/decision
# Should return: { status: 'ok', service: 'decision-engine-api', ... }
```

---

## 🧪 Test Endpoints

### Test Decision API

**Request:**
```bash
curl -X POST http://localhost:3000/api/decision \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_001"}'
```

**Expected Response:**
```json
{
  "userId": "user_001",
  "insights": [...],
  "recommendations": [...],
  "summary": "Analyzed 3 commodity market(s)...",
  "executionTime": 245
}
```

---

### Test Recommendation API

**Request:**
```bash
curl -X POST http://localhost:3000/api/recommendation/generate \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_001"}'
```

**Expected Response:**
```json
{
  "userId": "user_001",
  "recommendations": [...],
  "summary": "Generated 5 recommendations...",
  "executionTime": 312
}
```

---

### Test with Filters

```bash
curl -X POST http://localhost:3000/api/recommendation/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId":"user_001",
    "filter":{
      "types":["product"],
      "minScore":70,
      "maxResults":5
    }
  }'
```

---

## 📝 File Contents Checklist

### ✅ mock-data.ts
- [ ] Contains `getMockUserProfile()`
- [ ] Contains `getMockMarketData()`
- [ ] Contains `getMockUserBehavior()`
- [ ] Contains `MOCK_USER_IDS` array
- [ ] Imports from `./decision.types`

### ✅ app/api/decision/route.ts
- [ ] Imports `DecisionEngine` from decision.engine
- [ ] Imports types from decision.types
- [ ] Imports mock data generators
- [ ] Has `POST` handler
- [ ] Has `GET` handler (health check)
- [ ] Fetches user profile
- [ ] Fetches market data
- [ ] Fetches user behavior
- [ ] Calls `engine.runDecisionEngine()`
- [ ] Returns aggregated results

### ✅ app/api/recommendation/route.ts
- [ ] Imports `getRecommendationEngine` from recommendation.engine
- [ ] Imports types from recommendation.types
- [ ] Imports mock data generators
- [ ] Has `POST` handler
- [ ] Has `GET` handler (health check)
- [ ] Builds recommendation context
- [ ] Calls `engine.generateRecommendations()`
- [ ] Supports filtering
- [ ] Returns recommendations with scores

---

## 🐛 Troubleshooting

### Issue: "Cannot find module"

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue: "404 Not Found"

**Check:**
1. File at `app/api/decision/route.ts` (not `app/api/decision.ts`)
2. Filename is exactly `route.ts`
3. Server restarted after file creation

### Issue: "Unexpected token"

**Check:**
1. TypeScript syntax correct
2. No trailing commas in JSON
3. Import paths use `/` not `\`

### Issue: "Mock data not found"

**Check:**
1. `mock-data.ts` exists in project root
2. Import path in API: `from '@/mock-data'`
3. Run `npm run dev` after file creation

### Issue: "Decision Engine not found"

**Check:**
1. `decision.engine.ts` exists in project root
2. Import path: `from '@/decision.engine'`
3. `tsconfig.json` has path alias `@`

---

## 📊 Expected Mock Data

### User Profiles (3 pre-configured)
- `user_001`: Mekong Delta, rice/vegetables, intermediate
- `user_002`: Red River Delta, rice/corn, beginner
- `user_003`: Central Highlands, coffee/cocoa/pepper, advanced

### Market Data (7 commodities)
- Rice: 7,500 VND/kg, uptrend, high demand
- Vegetables: 15,000 VND/kg, sideways, high demand
- Shrimp: 250,000 VND/kg, uptrend, low supply
- Corn: 4,500 VND/kg, downtrend
- Coffee: 35,000 VND/kg, uptrend
- Cocoa: 45,000 VND/kg, uptrend
- Pepper: 120,000 VND/kg, uptrend

---

## 🚀 Next: Production Setup

After testing, replace mock data:

### 1. Install Supabase
```bash
npm install @supabase/supabase-js
```

### 2. Update Decision API
```typescript
// OLD
const userProfile = getMockUserProfile(userId)

// NEW
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId)
  .single()

if (error) throw error
const userProfile = data as UserProfile
```

### 3. Update Recommendation API
```typescript
// Same pattern as above for Supabase queries
```

### 4. Add Auth
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

const { data: { session } } = await supabase.auth.getSession()
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

---

## ✨ Files Created

- ✅ `mock-data.ts` (8.9 KB) - Mock data generators
- ✅ `api-decision-route.ts` (6.5 KB) - Decision API code
- ✅ `api-recommendation-route.ts` (4.7 KB) - Recommendation API code
- ✅ `API_INTEGRATION_GUIDE.md` (12.2 KB) - Full guide
- ✅ `API_SETUP_CHECKLIST.md` (This file) - Quick setup

---

## 📞 Quick Reference

| Action | Command |
|--------|---------|
| Test Decision API | `curl -X POST http://localhost:3000/api/decision -H "Content-Type: application/json" -d '{"userId":"user_001"}'` |
| Test Recommendation API | `curl -X POST http://localhost:3000/api/recommendation/generate -H "Content-Type: application/json" -d '{"userId":"user_001"}'` |
| Clear cache | `rm -rf .next` |
| Start dev server | `npm run dev` |

---

**Status:** ✅ Ready to Setup  
**Time to Complete:** 10 minutes  
**Difficulty:** Easy  

**You've got this!** 🚀
