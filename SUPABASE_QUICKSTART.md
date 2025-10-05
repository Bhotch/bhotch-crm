# Supabase Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### 1. Create Supabase Project

Visit https://supabase.com:
1. Sign up/Login
2. Create new project: `bhotch-crm-production`
3. Region: `us-west-1`
4. Save password securely

### 2. Run Database Schema

1. Go to SQL Editor in Supabase Dashboard
2. Copy all content from `supabase/migrations/001_initial_schema.sql`
3. Paste and click "Run"
4. Verify 8 tables created

### 3. Get API Credentials

Settings → API → Copy:
- Project URL
- anon/public key
- service_role key

### 4. Configure Environment

Create `.env.local`:
```bash
REACT_APP_SUPABASE_URL=https://[YOUR-PROJECT].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
REACT_APP_SUPABASE_SERVICE_KEY=[YOUR-SERVICE-KEY]
```

### 5. Migrate Data

```bash
# Export from Google Sheets
REACT_APP_GAS_WEB_APP_URL="[YOUR-URL]" node scripts/export-sheets-data.js

# Migrate to Supabase
node scripts/migrate-to-supabase.js
```

### 6. Test

```bash
npm start
```

Check Database Health Monitor (bottom right corner).

### 7. Deploy

```bash
# Add env vars to Vercel
vercel env add REACT_APP_SUPABASE_URL production
vercel env add REACT_APP_SUPABASE_ANON_KEY production
vercel env add REACT_APP_SUPABASE_SERVICE_KEY production

# Deploy
vercel --prod
```

## ✅ Verification Checklist

- [ ] 8 tables visible in Supabase Table Editor
- [ ] Leads data migrated (check count)
- [ ] Job counts migrated
- [ ] App loads without errors
- [ ] Can create/update/delete leads
- [ ] Real-time updates work (test with 2 browser tabs)
- [ ] Database Health Monitor shows "Connected"
- [ ] Production deployment successful

## 🔧 Key Files

| File | Purpose |
|------|---------|
| `supabase/migrations/001_initial_schema.sql` | Complete database schema |
| `scripts/export-sheets-data.js` | Export from Google Sheets |
| `scripts/migrate-to-supabase.js` | Migrate to Supabase |
| `src/lib/supabase.js` | Supabase client |
| `src/api/supabaseService.js` | Service layer (CRUD operations) |
| `SUPABASE_MIGRATION_GUIDE.md` | Full documentation |

## 🆘 Troubleshooting

**Can't connect to Supabase?**
- Check credentials in `.env.local`
- Verify project is not paused (Supabase Dashboard)

**Migration fails?**
- Ensure `data-export/leads.json` exists
- Check service key permissions

**Slow queries?**
- Verify indexes created (run schema again)
- Check query in Supabase Logs

## 📊 What's Different

**Before (Google Sheets):**
- 2-5 second load times
- No real-time updates
- Linear search

**After (Supabase):**
- <200ms queries
- Real-time WebSocket updates
- Indexed search & filters
- PostgreSQL power

## 🎯 Benefits

✅ **10-100x faster** queries
✅ **Real-time** updates across users
✅ **Zero cost** (free tier: 500MB DB)
✅ **PostgreSQL** features (JOINs, views, functions)
✅ **Scalable** architecture
✅ **Backup & recovery** built-in

---

For detailed documentation, see [SUPABASE_MIGRATION_GUIDE.md](./SUPABASE_MIGRATION_GUIDE.md)
