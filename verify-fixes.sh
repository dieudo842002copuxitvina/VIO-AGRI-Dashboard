#!/bin/bash
# Build verification script

cd "$(dirname "$0")"

echo "=========================================="
echo "🔍 Module Fix Verification"
echo "=========================================="
echo ""

echo "✓ Checking tsconfig.json..."
if grep -q '"@/\*": \["\./\*"\]' tsconfig.json; then
  echo "  ✅ Path alias configured correctly"
else
  echo "  ❌ Path alias not found"
fi

echo ""
echo "✓ Checking components exist..."
if [ -f "components/InsightFeed.tsx" ]; then
  echo "  ✅ components/InsightFeed.tsx exists"
else
  echo "  ❌ components/InsightFeed.tsx NOT found"
fi

if [ -f "components/RecommendationPanel.tsx" ]; then
  echo "  ✅ components/RecommendationPanel.tsx exists"
else
  echo "  ❌ components/RecommendationPanel.tsx NOT found"
fi

echo ""
echo "✓ Checking useDecision hook..."
if [ -f "useDecision.ts" ]; then
  echo "  ✅ useDecision.ts exists"
else
  echo "  ❌ useDecision.ts NOT found"
fi

echo ""
echo "✓ Checking app/page.tsx imports..."
if grep -q "import InsightFeed from '../components/InsightFeed'" app/page.tsx; then
  echo "  ✅ InsightFeed import correct"
else
  echo "  ❌ InsightFeed import wrong"
fi

if grep -q "import RecommendationPanel from '../components/RecommendationPanel'" app/page.tsx; then
  echo "  ✅ RecommendationPanel import correct"
else
  echo "  ❌ RecommendationPanel import wrong"
fi

if grep -q "import { useDecision } from '../useDecision'" app/page.tsx; then
  echo "  ✅ useDecision import correct"
else
  echo "  ❌ useDecision import wrong"
fi

echo ""
echo "=========================================="
echo "✅ Pre-build verification complete"
echo "=========================================="
echo ""
echo "Next: Run 'npm run build' to test compilation"
