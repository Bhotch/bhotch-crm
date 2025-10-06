# Bhotch CRM - Comprehensive System Guide

**Version:** 2.0.0
**Last Updated:** 2025-10-05
**Status:** Production Ready

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technical Architecture](#technical-architecture)
3. [System Requirements](#system-requirements)
4. [Installation & Setup](#installation--setup)
5. [Database Structure](#database-structure)
6. [API & Services](#api--services)
7. [Security](#security)
8. [Deployment](#deployment)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

### Purpose
Bhotch CRM is a modern, real-time customer relationship management system designed for roofing and construction businesses. It provides comprehensive lead tracking, job counting, canvassing management, and customer communications.

### Key Features
- ✅ **Real-Time Data Sync** - Changes appear instantly across all sessions
- ✅ **Comprehensive Lead Management** - Track customers from contact to close
- ✅ **Job Count Calculator** - Detailed measurements and specifications
- ✅ **Canvassing Management** - Territory tracking and property visits
- ✅ **Communications Hub** - Track all customer interactions
- ✅ **Calendar Integration** - Schedule and track appointments
- ✅ **Dashboard Analytics** - Real-time metrics and conversion rates
- ✅ **Mobile Responsive** - Works on all devices
- ✅ **Progressive Web App** - Install on mobile devices

### Technology Stack

**Frontend:**
- React 18.x
- TailwindCSS 3.x
- Lucide Icons
- React Router
- Service Workers (PWA)

**Backend:**
- Supabase (PostgreSQL)
- Real-time Subscriptions
- Row Level Security (RLS)
- RESTful API

**Deployment:**
- Vercel (Frontend hosting)
- GitHub (Version control)
- Supabase Cloud (Database)

**Development Tools:**
- Node.js 18+
- npm/yarn
- Git
- VS Code (recommended)

---

## Technical Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐         │
│  │  Browser   │  │   Mobile    │  │    PWA       │         │
│  │   (Web)    │  │  (Web App)  │  │  (Installed) │         │
│  └─────┬──────┘  └──────┬──────┘  └──────┬───────┘         │
└────────┼─────────────────┼─────────────────┼────────────────┘
         │                 │                 │
         └────────────────┬┴─────────────────┘
                          │
                          │ HTTPS
                          │
         ┌────────────────▼───────────────────┐
         │       VERCEL CDN/HOSTING           │
         │  ┌──────────────────────────────┐  │
         │  │    React Application         │  │
         │  │  - Components                │  │
         │  │  - State Management          │  │
         │  │  - Service Worker            │  │
         │  └──────────────────────────────┘  │
         └────────────────┬───────────────────┘
                          │
                          │ WebSocket + REST
                          │
         ┌────────────────▼───────────────────┐
         │         SUPABASE CLOUD             │
         │  ┌──────────────────────────────┐  │
         │  │    PostgreSQL Database       │  │
         │  │  - Tables                    │  │
         │  │  - Views                     │  │
         │  │  - Indexes                   │  │
         │  │  - RLS Policies              │  │
         │  └──────────────────────────────┘  │
         │  ┌──────────────────────────────┐  │
         │  │    Real-time Engine          │  │
         │  │  - WebSocket Server          │  │
         │  │  - Change Notifications      │  │
         │  └──────────────────────────────┘  │
         │  ┌──────────────────────────────┐  │
         │  │    REST API                  │  │
         │  │  - Auto-generated endpoints  │  │
         │  │  - Authentication            │  │
         │  └──────────────────────────────┘  │
         └────────────────────────────────────┘
```

### Data Flow

**CREATE Operation:**
```
User Input → React Component → Supabase Service → INSERT Query
→ Database Write → Real-time Notification → All Connected Clients Update
```

**READ Operation:**
```
Component Mount → useEffect Hook → Supabase Service → SELECT Query
→ Database Read → Process Data → Update State → Render UI
```

**UPDATE Operation:**
```
User Edit → Form Submit → Supabase Service → UPDATE Query
→ Database Write → Real-time Notification → All Connected Clients Update
```

**DELETE Operation:**
```
User Confirm → Supabase Service → Soft Delete (UPDATE deleted_at)
→ Database Write → Real-time Notification → UI Updates
```

### State Management Architecture

```javascript
// App-level State (src/App.jsx)
├── Leads State (useLeads hook)
│   ├── Data: Array of lead objects
│   ├── Loading state
│   └── Real-time subscription
│
├── Communications State
│   └── Data: Array of communications
│
├── Canvassing State
│   ├── Territories
│   ├── Properties
│   └── Visits
│
└── Notifications State
    └── Toast messages
```

---

## System Requirements

### Server Requirements

**Production Environment:**
- None (fully serverless - Vercel + Supabase)

**Development Environment:**
- Node.js >= 18.0.0
- npm >= 9.0.0 or yarn >= 1.22.0
- Git >= 2.30.0

### Client Requirements

**Supported Browsers:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Chrome/Safari (latest)

**Minimum Device Specifications:**
- RAM: 2GB+
- Screen: 320px width minimum
- Internet: Stable connection required
- JavaScript: Enabled (required)

### Network Requirements

**Bandwidth:**
- Minimum: 1 Mbps
- Recommended: 5 Mbps+
- Real-time updates use ~100KB/min

**Latency:**
- Ideal: <100ms
- Acceptable: <500ms
- Real-time may be delayed >500ms

**Ports:**
- 443 (HTTPS) - Required
- 80 (HTTP) - Redirect to 443

---

## Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/Bhotch/bhotch-crm.git
cd bhotch-crm
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create `.env` file:

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://[your-project].supabase.co
REACT_APP_SUPABASE_ANON_KEY=[your-anon-key]

# Google Maps API (optional)
REACT_APP_GOOGLE_MAPS_API_KEY=[your-api-key]

# Firebase (optional - for auth)
REACT_APP_FIREBASE_API_KEY=[your-api-key]
REACT_APP_FIREBASE_AUTH_DOMAIN=[your-domain]
REACT_APP_FIREBASE_PROJECT_ID=[your-project-id]
```

### 4. Set Up Database

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref [your-project-ref]

# Run migrations
supabase db push
```

### 5. Start Development Server

```bash
npm start
```

App opens at `http://localhost:3000`

### 6. Build for Production

```bash
npm run build
```

Output in `build/` directory

---

## Database Structure

### Tables Overview

| Table | Purpose | Records | Real-time |
|-------|---------|---------|-----------|
| `leads` | Customer information | Primary data | ✅ Active |
| `communications` | Contact history | Per lead | ⚪ Available |
| `canvassing_territories` | Service areas | Organizational | ⚪ Available |
| `canvassing_properties` | Properties in territories | Per territory | ⚪ Available |
| `property_visits` | Visit logs | Per property | ⚪ Available |
| `property_designs` | 360° designs | Per lead | ⚪ Available |
| `calendar_events` | Appointments | Scheduled | ⚪ Available |

### Leads Table Schema

```sql
CREATE TABLE leads (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- Soft delete

    -- Basic Information
    date_added DATE DEFAULT CURRENT_DATE,
    customer_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    email TEXT,
    address TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),

    -- Classification
    quality TEXT CHECK (quality IN ('Hot', 'Warm', 'Cold')),
    disposition TEXT,
    lead_source TEXT,
    status TEXT,

    -- Property Info
    roof_age INTEGER,
    roof_type TEXT,

    -- Measurements
    sqft NUMERIC(10, 2),
    ridge_lf NUMERIC(10, 2),
    valley_lf NUMERIC(10, 2),
    eaves_lf NUMERIC(10, 2),

    -- Ventilation
    ridge_vents INTEGER DEFAULT 0,
    turbine_vents INTEGER DEFAULT 0,
    rime_flow NUMERIC(10, 2),

    -- Pipes (Simplified in migration 004)
    pipes_12 INTEGER DEFAULT 0, -- 1"-2" combined
    pipes_34 INTEGER DEFAULT 0, -- 3"-4" combined

    -- Features
    gables INTEGER DEFAULT 0,
    turtle_backs INTEGER DEFAULT 0,
    satellite BOOLEAN DEFAULT FALSE,
    chimney BOOLEAN DEFAULT FALSE,
    solar BOOLEAN DEFAULT FALSE,
    swamp_cooler BOOLEAN DEFAULT FALSE,

    -- Gutters
    gutter_lf NUMERIC(10, 2),
    downspouts INTEGER DEFAULT 0,
    gutter_guard_lf NUMERIC(10, 2),

    -- Financial
    dabella_quote NUMERIC(12, 2),
    quote_amount NUMERIC(12, 2),
    quote_notes TEXT,
    permanent_lighting TEXT,

    -- Additional
    notes TEXT,
    last_contact_date DATE
);
```

### Views

**dashboard_stats:**
```sql
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_leads,
    COUNT(*) FILTER (WHERE quality = 'Hot' AND deleted_at IS NULL) AS hot_leads,
    COUNT(*) FILTER (WHERE disposition = 'Quoted' AND deleted_at IS NULL) AS quoted_leads,
    SUM(dabella_quote) FILTER (WHERE deleted_at IS NULL) AS total_quote_value,
    COUNT(*) FILTER (WHERE disposition = 'Scheduled' AND deleted_at IS NULL) AS scheduled_count,
    COUNT(*) FILTER (WHERE disposition = 'Follow Up' AND deleted_at IS NULL) AS follow_up_count,
    COUNT(*) FILTER (WHERE disposition = 'Insurance' AND deleted_at IS NULL) AS insurance_count,
    COUNT(*) FILTER (WHERE disposition = 'Closed Sold' AND deleted_at IS NULL) AS closed_sold_count,
    ROUND(
        (COUNT(*) FILTER (WHERE disposition = 'Closed Sold' AND deleted_at IS NULL)::numeric /
        NULLIF(COUNT(*) FILTER (WHERE deleted_at IS NULL), 0)) * 100, 2
    ) AS conversion_rate
FROM leads;
```

### Indexes

**Performance Indexes:**
```sql
-- Leads table
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_sqft ON leads(sqft) WHERE sqft IS NOT NULL;
CREATE INDEX idx_leads_quote_amount ON leads(quote_amount) WHERE quote_amount IS NOT NULL;

-- Foreign key indexes (all tables)
CREATE INDEX idx_communications_lead_id ON communications(lead_id);
CREATE INDEX idx_calendar_events_lead_id ON calendar_events(lead_id);
CREATE INDEX idx_property_designs_lead_id ON property_designs(lead_id);
CREATE INDEX idx_canvassing_properties_territory ON canvassing_properties(territory_id);
CREATE INDEX idx_property_visits_property_id ON property_visits(property_id);
```

---

## API & Services

### Supabase Client Configuration

**File:** `src/lib/supabase.js`

```javascript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
);
```

### Service Layer Architecture

**File:** `src/api/supabaseService.js`

**Leads Service:**
```javascript
export const leadsService = {
  // Read
  async getAll(filters = {}) { /* ... */ },
  async getById(id) { /* ... */ },

  // Write
  async create(leadData) { /* ... */ },
  async update(id, updates) { /* ... */ },
  async delete(id) { /* Soft delete */ },

  // Real-time
  subscribeToChanges(callback) { /* ... */ }
};
```

**Usage Example:**
```javascript
// Get all leads
const leads = await leadsService.getAll();

// Create lead
const newLead = await leadsService.create({
  customer_name: 'John Doe',
  phone_number: '555-1234',
  quality: 'Hot'
});

// Subscribe to changes
const subscription = leadsService.subscribeToChanges((payload) => {
  console.log('Lead changed:', payload);
});

// Cleanup
subscription.unsubscribe();
```

### Real-Time Subscriptions

**Setup in Hook:**
```javascript
useEffect(() => {
  const subscription = leadsService.subscribeToChanges((payload) => {
    if (payload.eventType === 'INSERT') {
      setLeads(prev => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setLeads(prev => prev.map(lead =>
        lead.id === payload.new.id ? payload.new : lead
      ));
    } else if (payload.eventType === 'DELETE') {
      setLeads(prev => prev.filter(lead => lead.id !== payload.old.id));
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

---

## Security

### Row Level Security (RLS)

**Status:** DISABLED for development
**Reason:** Single-user application, authentication managed by Firebase

**When to Enable:**
```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users"
ON leads
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

### Data Security

**Soft Deletes:**
- Records never permanently deleted
- `deleted_at` timestamp marks deletion
- Allows recovery and audit trails

**Field Validation:**
- Client-side: React form validation
- Database: CHECK constraints on enums

**API Security:**
- HTTPS only (enforced by Vercel)
- CORS configured for specific domains
- Rate limiting via Supabase

### Environment Variables

**Never commit:**
- `.env`
- `.env.local`
- API keys
- Database credentials

**Use:**
- `.env.example` for templates
- Vercel environment variables for production

---

## Deployment

### Vercel Deployment

**1. Connect Repository:**
```bash
vercel login
vercel link
```

**2. Set Environment Variables:**
```bash
vercel env add REACT_APP_SUPABASE_URL
vercel env add REACT_APP_SUPABASE_ANON_KEY
```

**3. Deploy:**
```bash
# Preview
vercel

# Production
vercel --prod
```

**4. Auto-Deploy:**
- Pushes to `main` branch auto-deploy to production
- Pull requests create preview deployments

### Build Configuration

**File:** `package.json`
```json
{
  "scripts": {
    "build": "react-scripts build",
    "prebuild": "chmod +x ./node_modules/.bin/react-scripts"
  }
}
```

**Vercel Configuration:** `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app"
}
```

### Deployment Checklist

- [ ] All tests passing
- [ ] Build successful locally
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] No console errors
- [ ] Mobile responsive verified
- [ ] Real-time sync tested
- [ ] Performance acceptable

---

## Monitoring & Maintenance

### Performance Monitoring

**Vercel Analytics:**
- Page load times
- Real User Metrics (RUM)
- Core Web Vitals

**Browser Console:**
```javascript
// Real-time connection status
import { testSupabaseConnection } from './utils/testSupabaseConnection';
testSupabaseConnection();
```

### Database Maintenance

**Monthly Tasks:**
```sql
-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Vacuum tables
VACUUM ANALYZE leads;
VACUUM ANALYZE communications;

-- Check unused indexes
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY tablename;
```

### Backup Strategy

**Supabase:**
- Automatic daily backups
- Point-in-time recovery (7 days)
- Manual backups before migrations

**Export Data:**
```bash
# Export to CSV
supabase db dump --data-only > backup.sql
```

---

## Troubleshooting

### Common Issues

**Issue: Real-time not working**
```javascript
// Check connection
import { isSupabaseEnabled } from './lib/supabase';
console.log('Supabase enabled:', isSupabaseEnabled());

// Check subscription
const subscription = leadsService.subscribeToChanges((payload) => {
  console.log('Received:', payload); // Should log on changes
});
```

**Issue: Build fails**
```bash
# Clear cache
rm -rf node_modules
rm package-lock.json
npm install

# Rebuild
npm run build
```

**Issue: Field not saving**
```javascript
// Check field mapping in src/hooks/useLeads.js
// Verify database column exists
// Check browser console for errors
```

### Logs & Debugging

**Browser Console:**
- F12 → Console tab
- Look for errors (red text)
- Check network tab for API failures

**Vercel Logs:**
```bash
vercel logs [deployment-url]
```

**Supabase Logs:**
- Dashboard → Logs
- Filter by severity
- Check slow queries

### Support Resources

- **Documentation:** `/docs` folder
- **Field Mapping:** [FIELD_MAPPING_REFERENCE.md](../FIELD_MAPPING_REFERENCE.md)
- **Testing Guide:** [HOW_TO_TEST_REALTIME_SYNC.md](../HOW_TO_TEST_REALTIME_SYNC.md)
- **Migration Guide:** [MIGRATION_FIXES_SUMMARY.md](../MIGRATION_FIXES_SUMMARY.md)

---

## Appendix

### File Structure

```
bhotch-crm/
├── public/               # Static files
├── src/
│   ├── api/             # API services
│   ├── components/      # Shared components
│   ├── features/        # Feature modules
│   │   ├── leads/       # Leads management
│   │   ├── dashboard/   # Dashboard view
│   │   ├── jobcount/    # Job count form
│   │   ├── canvassing/  # Canvassing tools
│   │   └── calendar/    # Calendar view
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities
│   └── utils/           # Helper functions
├── supabase/
│   └── migrations/      # Database migrations
├── build/               # Production build
└── docs/                # Documentation
```

### Version History

- **2.0.0** (2025-10-05) - Supabase migration, real-time sync
- **1.0.0** (2024) - Initial Google Sheets version

---

**END OF COMPREHENSIVE SYSTEM GUIDE**

---

*This document is maintained as part of the Bhotch CRM project.*
*For the latest version, see: https://github.com/Bhotch/bhotch-crm*
