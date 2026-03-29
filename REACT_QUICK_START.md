# React Integration - Quick Setup (15 Minutes)

## 📦 Files to Copy

```bash
useDecision.ts              → project root
InsightFeed.tsx             → components/
RecommendationPanel.tsx     → components/
DecisionDashboardExample.tsx → components/ (optional - for reference)
```

## 🔧 Prerequisites

1. Next.js 13+ with App Router
2. React 18+
3. TypeScript
4. Tailwind CSS

Install lucide-react if not already installed:
```bash
npm install lucide-react
```

## ⚡ 5-Minute Setup

### Step 1: Use the Hook (2 min)

```typescript
'use client'

import { useDecision } from '@/useDecision'

export function MyPage() {
  const { insights, recommendations, loading, error } = useDecision('user_001')

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Insights: {insights.length}</h1>
      <h1>Recommendations: {recommendations.length}</h1>
    </div>
  )
}
```

### Step 2: Add Components (3 min)

```typescript
'use client'

import { useDecision } from '@/useDecision'
import { InsightFeed, InsightFeedHeader } from '@/InsightFeed'
import { RecommendationPanel, RecommendationPanelHeader } from '@/RecommendationPanel'

export default function Dashboard() {
  const { insights, recommendations, loading, error, executionTime, summary } = useDecision('user_001')

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Insights */}
      <div>
        <InsightFeedHeader count={insights.length} executionTime={executionTime} />
        <InsightFeed insights={insights} loading={loading} error={error} />
      </div>

      {/* Recommendations */}
      <div>
        <RecommendationPanelHeader count={recommendations.length} />
        <RecommendationPanel recommendations={recommendations} loading={loading} error={error} />
      </div>
    </div>
  )
}
```

## ✅ Verification Checklist

- [ ] `useDecision.ts` exists in project root
- [ ] `InsightFeed.tsx` exists in components folder
- [ ] `RecommendationPanel.tsx` exists in components folder
- [ ] `lucide-react` installed: `npm install lucide-react`
- [ ] Tailwind CSS configured
- [ ] Path alias `@` configured in `tsconfig.json`
- [ ] Server started: `npm run dev`
- [ ] Components render without errors

## 🧪 Test It

### Test 1: Basic Rendering
```typescript
// In your page.tsx
import { DecisionDashboard } from '@/DecisionDashboardExample'

export default function Page() {
  return <DecisionDashboard userId="user_001" />
}
```

### Test 2: With Error Handling
```typescript
const { insights, recommendations, loading, error, refetch } = useDecision(userId)

if (error) {
  return (
    <div className="p-4 bg-red-100 rounded">
      <p>{error}</p>
      <button onClick={refetch}>Try Again</button>
    </div>
  )
}
```

### Test 3: Manual Refresh
```typescript
const { refetch } = useDecision('user_001')

return (
  <button onClick={refetch} className="px-4 py-2 bg-blue-600 text-white rounded">
    Refresh
  </button>
)
```

## 📱 Common Layouts

### Full Width Dashboard
```typescript
<div className="min-h-screen bg-gray-50 p-6">
  <div className="max-w-7xl mx-auto">
    <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InsightFeed insights={insights} loading={loading} error={error} />
      <RecommendationPanel recommendations={recommendations} loading={loading} error={error} />
    </div>
  </div>
</div>
```

### Sidebar Widget
```typescript
<aside className="w-80 bg-white rounded-lg shadow p-4">
  <h3 className="font-bold mb-4">Quick Insights</h3>
  <div className="space-y-3">
    {insights.slice(0, 3).map(insight => (
      <div key={insight.id} className="p-2 bg-blue-50 rounded">
        <p className="text-sm font-semibold">{insight.title}</p>
      </div>
    ))}
  </div>
</aside>
```

### Tabs Layout
```typescript
import { useState } from 'react'

export function Dashboard({ userId }) {
  const [tab, setTab] = useState<'insights' | 'recommendations'>('insights')
  const { insights, recommendations, loading, error } = useDecision(userId)

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab('insights')}
          className={tab === 'insights' ? 'font-bold' : 'text-gray-600'}
        >
          Insights
        </button>
        <button
          onClick={() => setTab('recommendations')}
          className={tab === 'recommendations' ? 'font-bold' : 'text-gray-600'}
        >
          Recommendations
        </button>
      </div>

      {tab === 'insights' && <InsightFeed insights={insights} loading={loading} error={error} />}
      {tab === 'recommendations' && (
        <RecommendationPanel recommendations={recommendations} loading={loading} error={error} />
      )}
    </div>
  )
}
```

## 🎨 Customization

### Change Colors

In `InsightFeed.tsx`:
```typescript
// Change border color
border-l-4 border-blue-500  // Change to: border-purple-500, border-green-500, etc.
```

In `RecommendationPanel.tsx`:
```typescript
// Change priority colors
critical: 'bg-red-100 text-red-800'     // Change to your colors
high: 'bg-orange-100 text-orange-800'   // etc.
```

### Change Layout

Modify Tailwind classes in components:
```typescript
// Change grid columns
grid grid-cols-1 lg:grid-cols-2  // Change to: grid-cols-3, grid-cols-12, etc.

// Change spacing
gap-6  // Change to: gap-3, gap-12, etc.
p-6    // Change to: p-2, p-8, etc.
```

### Disable Caching

In `useDecision.ts`:
```typescript
// Change cache duration to 0
const CACHE_DURATION = 0 // Always fetch fresh data
```

## 🐛 Troubleshooting

### "Cannot find module"
```bash
# Clear cache and restart
rm -rf .next
npm run dev
```

### "Icons not showing"
```bash
npm install lucide-react
npm run dev
```

### "Tailwind not working"
Ensure `tailwind.config.ts` includes:
```typescript
content: [
  './app/**/*.{js,ts,jsx,tsx}',
  './components/**/*.{js,ts,jsx,tsx}',
]
```

### "API returns 404"
Check that API routes exist:
- `app/api/decision/route.ts`
- `app/api/recommendation/route.ts`

### "Data not updating"
Call refetch manually:
```typescript
const { refetch } = useDecision(userId)
refetch()
```

## 📊 Performance Tips

1. **Memoize components** to prevent unnecessary re-renders
```typescript
import { memo } from 'react'

export const MemoizedInsightFeed = memo(InsightFeed)
```

2. **Use React.lazy** for code splitting
```typescript
const InsightFeed = lazy(() => import('@/InsightFeed'))
```

3. **Implement pagination** for large lists
```typescript
const [page, setPage] = useState(0)
const itemsPerPage = 10
const paginatedInsights = insights.slice(page * itemsPerPage, (page + 1) * itemsPerPage)
```

## 🎯 Next Steps

1. ✅ Copy files
2. ✅ Install dependencies
3. ✅ Create test page
4. ✅ Verify API connection
5. ⏳ Customize styling
6. ⏳ Deploy to production

---

## 📚 Full Documentation

See `REACT_COMPONENTS_GUIDE.md` for:
- Complete API reference
- Advanced usage patterns
- Testing guide
- TypeScript details
- Accessibility notes

---

**Status:** ✅ Ready to use  
**Time to setup:** 15 minutes  
**Difficulty:** Easy  

**Let's build!** 🚀
