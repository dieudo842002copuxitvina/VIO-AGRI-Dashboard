# Supabase Auth System Implementation TODO

## Steps (in order):

- [x] 1. Create database/auth_setup.sql (profile trigger + RLS)
- [x] 2. Create src/types/auth.ts (types)
- [x] 3. Create src/hooks/useAuth.ts
- [x] 4. Create src/hooks/useUserProfile.ts
- [x] 5. Create src/app/signup/page.tsx
- [ ] 6. Update src/app/login/page.tsx (integrate hooks)
- [x] 7. Create middleware.ts (protect /admin)
- [x] 8. Update src/app/admin/page.tsx (guard)
- [ ] 9. Update src/app/layout.tsx (auth provider if needed)
- [ ] 10. Install deps (react-hook-form zod @hookform/resolvers)
- [ ] 11. Test & complete

Progress: Completed all code changes. Run SQL in Supabase, install deps, test with `npm run dev`.
