# Frontend Redesign: Modern SaaS Trading Platform UI
Current progress: 1/12 ✅

## Implementation Steps (Logical Order)

### Phase 1: New Components (1-5)
- [✅] 1. Create `src/components/layout/TopNav.tsx` (enhanced from MainLayout header, Vietnamese menu)
- [✅] 2. Create `src/components/dashboard/AISignalHero.tsx` (top insight hero)
- [ ] 3. Create `src/components/dashboard/LiveOrderFlow.tsx` (row1 right, ticker + orders)
- [ ] 4. Create `src/components/dashboard/B2BListingsTable.tsx` (row2 listings table)
- [ ] 5. Create `src/components/dashboard/ActivityFeed.tsx` (row3 transactions)

### Phase 2: Layout & Page Updates (6-9)
- [ ] 6. Update `src/app/layout.tsx` (remove sidebar/right panel, add TopNav + new main)
- [ ] 7. Update `src/app/page.tsx` (direct DashboardClient)
- [ ] 8. Refactor `src/components/dashboard/DashboardClient.tsx` (new hero + grid layout)
- [ ] 9. Remove Sidebar references (imports/uses in layout)

### Phase 3: Polish & Test (10-12)
- [ ] 10. Update globals.css if needed (scrollbar, custom shadows)
- [ ] 11. Test responsive/dev server: `cd vio-agri-dashboard && npm run dev`
- [ ] 12. Lint & complete: `npm run lint`, mark complete

**Notes:** Keep emerald colors, Vietnamese (Tổng quan, Sàn giao thương B2B, Thị trường, Phân tích, Quản trị). Reuse PriceChart/useDecision. Safe data/fetching.

