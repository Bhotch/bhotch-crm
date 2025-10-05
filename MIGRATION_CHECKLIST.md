# Supabase Migration Checklist

Use this checklist to track your migration progress.

## ☐ Pre-Migration Setup

### 1. Create Supabase Project
- [ ] Visit https://supabase.com
- [ ] Sign up or log in
- [ ] Click "New Project"
- [ ] Project name: `bhotch-crm-production`
- [ ] Database password: _____________ (save securely!)
- [ ] Region: `us-west-1`
- [ ] Click "Create new project"
- [ ] Wait for provisioning (2-3 minutes)

### 2. Get Supabase Credentials
- [ ] Navigate to: Settings → API
- [ ] Copy **Project URL** → Save as `REACT_APP_SUPABASE_URL`
- [ ] Copy **anon public** key → Save as `REACT_APP_SUPABASE_ANON_KEY`
- [ ] Copy **service_role** key → Save as `REACT_APP_SUPABASE_SERVICE_KEY`

### 3. Create Database Schema
- [ ] Go to: SQL Editor in Supabase Dashboard
- [ ] Open file: `supabase/migrations/001_initial_schema.sql`
- [ ] Copy all content (Ctrl+A, Ctrl+C)
- [ ] Paste into SQL Editor
- [ ] Click "Run"
- [ ] Verify success message

### 4. Verify Tables Created
- [ ] Go to: Table Editor in Supabase Dashboard
- [ ] Confirm these 8 tables exist:
  - [ ] leads
  - [ ] job_counts
  - [ ] communications
  - [ ] canvassing_territories
  - [ ] canvassing_properties
  - [ ] property_visits
  - [ ] property_designs
  - [ ] calendar_events

## ☐ Local Environment Setup

### 5. Configure Environment Variables
- [ ] Copy `.env.example` to `.env.local`:
  ```bash
  cp .env.example .env.local
  ```
- [ ] Edit `.env.local` and add your Supabase credentials:
  - [ ] `REACT_APP_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co`
  - [ ] `REACT_APP_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]`
  - [ ] `REACT_APP_SUPABASE_SERVICE_KEY=[YOUR-SERVICE-KEY]`
- [ ] Verify Google Apps Script URL is present:
  - [ ] `REACT_APP_GAS_WEB_APP_URL=[EXISTING-URL]`

### 6. Install Dependencies (if needed)
- [ ] Run: `npm install`
- [ ] Verify `@supabase/supabase-js` is installed

## ☐ Data Migration

### 7. Export Data from Google Sheets
**Option A: Use Helper Script (Recommended)**
- [ ] Windows: Double-click `scripts/run-migration.bat`
- [ ] Mac/Linux: Run `bash scripts/run-migration.sh`

**Option B: Manual Export**
- [ ] Run export script:
  ```bash
  node scripts/export-sheets-data.js
  ```
- [ ] Verify files created in `data-export/`:
  - [ ] `leads.json`
  - [ ] `jobcounts.json`
  - [ ] `metadata.json`
- [ ] Check leads count: _____________

### 8. Migrate to Supabase
**If using helper script, this is done automatically. Otherwise:**
- [ ] Run migration script:
  ```bash
  node scripts/migrate-to-supabase.js
  ```
- [ ] Watch for success messages
- [ ] Note any errors or warnings
- [ ] Verify migration summary shows correct counts

### 9. Verify Migration in Supabase
- [ ] Go to: Table Editor → `leads`
- [ ] Check record count matches export
- [ ] View a few sample records for data integrity
- [ ] Go to: Table Editor → `job_counts`
- [ ] Verify records exist
- [ ] Check that `lead_id` foreign keys are populated

## ☐ Local Testing

### 10. Test Application Locally
- [ ] Start dev server: `npm start`
- [ ] Wait for app to load
- [ ] Check Database Health Monitor (bottom right corner)
  - [ ] Should show "Connected"
  - [ ] Should show "Supabase" as database type
  - [ ] Response time should be < 500ms

### 11. Test Dashboard Tab
- [ ] Navigate to Dashboard
- [ ] Verify stats display correctly:
  - [ ] Total Leads: _____________
  - [ ] Hot Leads: _____________
  - [ ] Quoted Leads: _____________
  - [ ] Total Quote Value: $____________
- [ ] Check recent leads section loads
- [ ] Verify job counts section displays

### 12. Test Leads Tab
- [ ] Navigate to Leads tab
- [ ] Verify all leads display
- [ ] Test search functionality
- [ ] Test filter by Quality (Hot/Warm/Cold)
- [ ] Test filter by Disposition
- [ ] **Create new lead**:
  - [ ] Fill out form
  - [ ] Click Save
  - [ ] Verify appears in list
- [ ] **Edit existing lead**:
  - [ ] Click on a lead
  - [ ] Modify a field
  - [ ] Save changes
  - [ ] Verify update persists
- [ ] **Test real-time** (open 2 browser tabs):
  - [ ] Create lead in Tab 1
  - [ ] Verify appears instantly in Tab 2

### 13. Test Job Count Tab
- [ ] Navigate to Job Count tab
- [ ] Verify job counts display
- [ ] Check that customer names show (from JOIN query)
- [ ] Create new job count
- [ ] Verify it appears in list

### 14. Test Other Tabs
- [ ] Map: Leads display on map
- [ ] Calendar: Events load (if any exist)
- [ ] Communications: Interface loads correctly
- [ ] 360° Designer: Interface loads correctly
- [ ] Canvassing: Map initializes properly

## ☐ Production Deployment

### 15. Configure Vercel Environment Variables
- [ ] Run these commands:
  ```bash
  vercel env add REACT_APP_SUPABASE_URL production
  vercel env add REACT_APP_SUPABASE_ANON_KEY production
  vercel env add REACT_APP_SUPABASE_SERVICE_KEY production
  ```
- [ ] Enter the same values from `.env.local`
- [ ] Verify all 3 variables added successfully

### 16. Deploy to Vercel
- [ ] Commit migration changes (if not already done):
  ```bash
  git add .
  git commit -m "feat: add Supabase migration"
  git push origin main
  ```
- [ ] Deploy to production:
  ```bash
  vercel --prod
  ```
- [ ] Wait for deployment to complete
- [ ] Note deployment URL: _____________________________

### 17. Test Production Deployment
- [ ] Visit production URL
- [ ] Verify app loads without errors
- [ ] Check browser console for errors (F12)
- [ ] Test Dashboard loads
- [ ] Test Leads tab CRUD operations
- [ ] Verify real-time updates work

## ☐ Post-Migration Monitoring

### 18. Week 1 Monitoring
- [ ] **Day 1**: Check Vercel logs for errors
- [ ] **Day 1**: Monitor Supabase Dashboard metrics
- [ ] **Day 3**: Verify data consistency
- [ ] **Day 7**: Review performance metrics
- [ ] **Day 7**: Check for user-reported issues

### 19. Performance Verification
- [ ] Dashboard loads in < 1 second
- [ ] Lead search returns results in < 500ms
- [ ] Create/update operations complete in < 1 second
- [ ] No console errors in browser
- [ ] Database Health Monitor shows "Excellent" or "Good" performance

### 20. Data Consistency Check
- [ ] Compare lead count: Supabase vs Google Sheets
- [ ] Spot-check 5-10 random leads for data accuracy
- [ ] Verify all custom fields migrated correctly
- [ ] Check that recent leads (last 7 days) all present

## ☐ Cleanup & Optimization

### 21. Google Sheets Backup Strategy
- [ ] **Keep Google Sheets active** for 2 weeks minimum
- [ ] Set reminder to deprecate after stable operation
- [ ] Document backup procedure for future reference

### 22. Optional Enhancements
- [ ] Set up automated Supabase backups (Point-in-Time Recovery)
- [ ] Configure Supabase alerts for errors
- [ ] Add custom PostgreSQL functions for complex queries
- [ ] Implement advanced search features
- [ ] Add user authentication (Supabase Auth)

## ☐ Success Criteria

### Migration is successful when:
- [x] All 8 tables created in Supabase
- [ ] 95%+ of leads migrated successfully
- [ ] 90%+ of job counts migrated successfully
- [ ] Application loads without errors
- [ ] All CRUD operations work correctly
- [ ] Real-time updates functional
- [ ] Dashboard statistics display correctly
- [ ] Production deployment successful
- [ ] Performance metrics acceptable (< 500ms queries)
- [ ] No critical errors in 7 days

---

## 📞 Support & Troubleshooting

If you encounter issues:

1. **Check Documentation**:
   - [SUPABASE_QUICKSTART.md](./SUPABASE_QUICKSTART.md)
   - [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md)

2. **Common Issues**:
   - Connection errors → Verify credentials in `.env.local`
   - Migration fails → Check `data-export/` files exist
   - Slow queries → Verify indexes created (re-run schema)

3. **Rollback if Needed**:
   ```bash
   # Remove Supabase env vars to revert to Google Sheets
   vercel env rm REACT_APP_SUPABASE_URL production
   vercel env rm REACT_APP_SUPABASE_ANON_KEY production
   vercel env rm REACT_APP_SUPABASE_SERVICE_KEY production
   ```

---

## 🎉 Completion

**Congratulations!** You've successfully migrated Bhotch CRM to Supabase PostgreSQL!

**Date Completed**: _______________
**Migration Time**: _______________
**Final Lead Count**: _______________
**Performance Rating**: _______________

**Next Steps**:
1. Monitor for 1 week
2. Gather user feedback
3. Plan Phase 2 enhancements
4. Celebrate! 🎊
