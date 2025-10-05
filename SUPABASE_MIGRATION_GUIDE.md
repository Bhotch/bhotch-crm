# Supabase Migration Guide

## Overview

This guide documents the complete migration from Google Sheets to Supabase PostgreSQL for the Bhotch CRM system.

## Prerequisites

- [ ] Supabase account (free tier available at https://supabase.com)
- [ ] Node.js 22.x installed
- [ ] Access to current Google Sheets data
- [ ] Vercel account for deployment

## Environment Variables

### Required Supabase Environment Variables

Add these to both `.env.local` (local development) and Vercel (production):

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
REACT_APP_SUPABASE_SERVICE_KEY=[YOUR-SERVICE-KEY]
```

### How to Get Supabase Credentials

1. Visit https://supabase.com and sign up/login
2. Create a new project named `bhotch-crm-production`
3. Select region: `us-west-1` (closest to deployment)
4. Navigate to Settings → API
5. Copy the following:
   - Project URL → `REACT_APP_SUPABASE_URL`
   - anon/public key → `REACT_APP_SUPABASE_ANON_KEY`
   - service_role key → `REACT_APP_SUPABASE_SERVICE_KEY` (keep secure!)

### Add to Vercel

```bash
vercel env add REACT_APP_SUPABASE_URL production
vercel env add REACT_APP_SUPABASE_ANON_KEY production
vercel env add REACT_APP_SUPABASE_SERVICE_KEY production
```

## Migration Steps

### Step 1: Database Schema Setup

1. Navigate to your Supabase project → SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste into SQL Editor and click "Run"
4. Verify all tables are created in the Table Editor:
   - ✅ leads
   - ✅ job_counts
   - ✅ communications
   - ✅ canvassing_territories
   - ✅ canvassing_properties
   - ✅ property_visits
   - ✅ property_designs
   - ✅ calendar_events

### Step 2: Export Current Data

```bash
# Export data from Google Sheets
REACT_APP_GAS_WEB_APP_URL="[YOUR-APPS-SCRIPT-URL]" node scripts/export-sheets-data.js
```

This creates:
- `data-export/leads.json`
- `data-export/jobcounts.json`
- `data-export/metadata.json`

### Step 3: Run Migration

```bash
# Migrate data to Supabase
node scripts/migrate-to-supabase.js
```

Expected output:
```
✅ Migrated leads successfully
✅ Migrated job counts successfully
✅ Validation PASSED
```

### Step 4: Verify Migration

1. Open Supabase Dashboard → Table Editor → `leads`
2. Verify record count matches exported data
3. Check sample records for data integrity
4. Verify `job_counts` table has correct foreign key relationships

### Step 5: Enable Supabase in Application

Update your `.env.local`:

```bash
# Add Supabase credentials (from Step 1)
REACT_APP_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
REACT_APP_SUPABASE_SERVICE_KEY=[YOUR-SERVICE-KEY]

# Keep Google Sheets URL as backup
REACT_APP_GAS_WEB_APP_URL=[EXISTING-URL]
```

### Step 6: Test Locally

```bash
npm start
```

Verify:
- ✅ Dashboard loads with correct stats
- ✅ Leads tab shows all records
- ✅ Job Count tab displays data
- ✅ Can create new leads
- ✅ Can update existing leads
- ✅ Real-time updates work (open two browser tabs)
- ✅ Database Health Monitor shows "Connected" (bottom right)

### Step 7: Deploy to Production

```bash
# Create feature branch
git checkout -b feature/supabase-migration

# Add all changes
git add .

# Commit
git commit -m "feat: migrate to Supabase PostgreSQL

- Add complete database schema with 8 tables
- Implement Supabase service layer with real-time
- Update hooks to support Supabase
- Add database health monitoring
- Maintain Google Sheets fallback"

# Push to GitHub
git push origin feature/supabase-migration

# Deploy to Vercel preview
vercel

# After testing preview, merge to main
git checkout main
git merge feature/supabase-migration
git push origin main

# Deploy to production
vercel --prod
```

## Architecture

### Database Schema

**8 Core Tables:**

1. **leads** - Primary customer data (replaces Bhotchleads sheet)
2. **job_counts** - Measurement data (replaces Job Count sheet)
3. **communications** - Call/SMS/Email logs (Google Voice integration)
4. **canvassing_territories** - Territory management
5. **canvassing_properties** - Door-to-door tracking
6. **property_visits** - Visit history and analytics
7. **property_designs** - 360° visualization data
8. **calendar_events** - Google Calendar sync

### Service Layer

**File: `src/api/supabaseService.js`**

Services:
- `leadsService` - CRUD + real-time subscriptions
- `jobCountsService` - CRUD with joins to leads
- `communicationsService` - Communication logging
- `canvassingService` - Territory and property management
- `propertyDesignsService` - Design storage
- `calendarEventsService` - Event management
- `dashboardService` - Aggregated statistics

### Updated Hooks

**Files:**
- `src/hooks/useLeads.js` - Dual-mode (Supabase + Google Sheets)
- `src/hooks/useJobCounts.js` - Dual-mode
- `src/hooks/useCommunications.js` - Supabase support added
- `src/hooks/useDashboardStats.js` - NEW: Dashboard statistics

### Real-Time Features

Supabase provides real-time subscriptions for:
- ✅ Lead updates across all users
- ✅ Instant notification when leads are added/updated/deleted
- ✅ Live dashboard statistics

Example:
```javascript
// Real-time subscription in useLeads hook
leadsService.subscribeToChanges((payload) => {
  if (payload.eventType === 'INSERT') {
    // Add new lead to state
  }
});
```

## Performance Improvements

### Before (Google Sheets)
- ⏱️ Lead fetch: ~2-5 seconds
- ⏱️ Search: Linear scan through all records
- ❌ No real-time updates
- ❌ No relational queries

### After (Supabase PostgreSQL)
- ⚡ Lead fetch: <200ms (indexed queries)
- ⚡ Search: <50ms (full-text search with GIN index)
- ✅ Real-time updates via WebSocket
- ✅ Efficient JOINs for related data
- ✅ Computed views for dashboard stats

## Database Indexes

Critical performance indexes created:

```sql
-- Full-text search
CREATE INDEX idx_leads_search ON leads USING GIN (
  to_tsvector('english', customer_name || ' ' || email || ' ' || address)
);

-- Geospatial queries
CREATE INDEX idx_leads_location ON leads(latitude, longitude);

-- Common filters
CREATE INDEX idx_leads_quality ON leads(quality);
CREATE INDEX idx_leads_disposition ON leads(disposition);
```

## Fallback Mechanism

The system automatically falls back to Google Sheets if:
- Supabase environment variables are not configured
- Supabase connection fails
- `isSupabaseEnabled()` returns false

Check current mode in Database Health Monitor (dev mode only).

## Monitoring

### Database Health Monitor

**Component: `src/components/DatabaseHealthMonitor.jsx`**

Displays (dev mode only):
- ✅ Connection status
- ✅ Database type (Supabase vs Google Sheets)
- ✅ Response time
- ✅ Record counts
- ✅ Performance rating

### Production Monitoring

```bash
# View Vercel logs
vercel logs --follow

# Check Supabase metrics
# Visit: https://supabase.com/dashboard/project/[PROJECT-ID]/reports
```

## Rollback Plan

If issues occur:

### 1. Emergency Rollback (Immediate)

```bash
# Revert to previous deployment
vercel rollback

# Remove Supabase env vars to force Google Sheets fallback
vercel env rm REACT_APP_SUPABASE_URL production
vercel env rm REACT_APP_SUPABASE_ANON_KEY production
vercel env rm REACT_APP_SUPABASE_SERVICE_KEY production
```

### 2. Code Rollback

```bash
git revert [migration-commit-hash]
git push origin main
vercel --prod
```

### 3. Data Recovery

Google Sheets data remains intact. No data loss occurs during migration.

## Troubleshooting

### Issue: "Failed to fetch leads"

**Solution:**
1. Check Supabase credentials in Vercel environment variables
2. Verify Supabase project is not paused (free tier pauses after 7 days inactivity)
3. Check Row Level Security policies in Supabase Dashboard

### Issue: "Real-time updates not working"

**Solution:**
1. Verify WebSocket connections in browser DevTools (Network tab)
2. Check Supabase Realtime is enabled: Settings → API → Realtime
3. Ensure RLS policies allow SELECT operations

### Issue: "Migration script fails"

**Solution:**
1. Verify `data-export/leads.json` exists
2. Check Supabase service key has write permissions
3. Run migration in batches:
   ```javascript
   // In migrate-to-supabase.js, reduce BATCH_SIZE to 50
   const BATCH_SIZE = 50;
   ```

### Issue: "Slow queries"

**Solution:**
1. Verify indexes are created (check SQL Editor)
2. Use EXPLAIN in Supabase to analyze query plans
3. Consider upgrading Supabase tier if on free tier

## Cost Analysis

### Supabase Free Tier Limits
- ✅ 500MB database storage
- ✅ 5GB bandwidth per month
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests
- ⚠️ Database pauses after 7 days inactivity

**Current Usage Estimate:**
- ~500 leads × 2KB = 1MB
- ~200 job counts × 1KB = 200KB
- Total: ~2-5MB (well within free tier)

### Future Scaling

If you exceed free tier:
- **Pro Plan**: $25/month (8GB database, 250GB bandwidth)
- **Team Plan**: $599/month (unlimited)

## Security

### Row Level Security (RLS)

Current policies (permissive for migration):
```sql
CREATE POLICY "Enable all for authenticated users" ON leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Future: Tighten Security

```sql
-- Example: User-specific access
CREATE POLICY "Users can only see their own leads" ON leads
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
```

## Next Steps Post-Migration

1. **Monitor for 1 week**: Check logs, error rates, performance
2. **Deprecate Google Sheets**: After 2 weeks of stable operation
3. **Add advanced features**:
   - Full-text search on all fields
   - Advanced analytics queries
   - Custom functions for business logic
4. **Optimize queries**: Use Supabase EXPLAIN to improve slow queries
5. **Set up backups**: Configure Point-in-Time Recovery (PITR)

## Support

### Resources
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Migration Scripts: `scripts/export-sheets-data.js`, `scripts/migrate-to-supabase.js`

### Common Commands

```bash
# Check Supabase connection
node -e "const { checkSupabaseConnection } = require('./src/lib/supabase'); checkSupabaseConnection().then(console.log)"

# Re-run migration
node scripts/migrate-to-supabase.js

# Export latest data
REACT_APP_GAS_WEB_APP_URL="[URL]" node scripts/export-sheets-data.js

# View database stats
# Visit: https://supabase.com/dashboard/project/[PROJECT-ID]/database/tables
```

## Success Criteria

✅ Migration complete when:
- All 8 tables created in Supabase
- All leads migrated (95%+ match rate)
- All job counts migrated (90%+ match rate)
- Application loads without errors
- CRUD operations work on all tabs
- Real-time updates functional
- Dashboard stats display correctly
- Production deployment successful
- Performance <500ms for all queries

**Congratulations! You've successfully migrated to Supabase PostgreSQL! 🎉**
