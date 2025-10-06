# CRM ↔ Supabase Field Mapping Reference

## Complete Field Mapping for All Tabs

### ✅ Leads Tab - All Fields

| CRM Frontend Field | Database Column | Type | Notes |
|-------------------|-----------------|------|-------|
| **Basic Information** ||||
| `id` | `id` | UUID | Auto-generated |
| `date` / `dateAdded` | `date_added` | DATE | Default: today |
| `createdDate` | `created_at` | TIMESTAMPTZ | Auto-set |
| `modifiedDate` | `updated_at` | TIMESTAMPTZ | Auto-updated |
| `customerName` | `customer_name` | TEXT | **Required** |
| `firstName` | `first_name` | TEXT | Optional |
| `lastName` | `last_name` | TEXT | Optional |
| `phoneNumber` | `phone_number` | TEXT | Optional |
| `email` | `email` | TEXT | Optional |
| `address` | `address` | TEXT | Optional |
| `latitude` | `latitude` | NUMERIC(10,8) | For map display |
| `longitude` | `longitude` | NUMERIC(11,8) | For map display |
| **Lead Classification** ||||
| `quality` | `quality` | TEXT | Hot/Warm/Cold |
| `disposition` | `disposition` | TEXT | Any value allowed |
| `leadSource` | `lead_source` | TEXT | Source tracking |
| `status` | `status` | TEXT | Lead status |
| **Property Information** ||||
| `roofAge` | `roof_age` | INTEGER | Years |
| `roofType` | `roof_type` | TEXT | Material type |
| **Measurements** ||||
| `sqft` / `sqFt` | `sqft` | NUMERIC(10,2) | Square footage |
| `ridgeLf` | `ridge_lf` | NUMERIC(10,2) | Ridge linear feet |
| `valleyLf` | `valley_lf` | NUMERIC(10,2) | Valley linear feet |
| `eavesLf` | `eaves_lf` | NUMERIC(10,2) | Eaves linear feet |
| **Ventilation** ||||
| `ridgeVents` | `ridge_vents` | INTEGER | Count |
| `turbineVents` / `turbine` | `turbine_vents` | INTEGER | Count |
| `rimeFlow` | `rime_flow` | NUMERIC(10,2) | Linear feet |
| **Pipes - ⚠️ UPDATED FIELDS** ||||
| `pipes12` | `pipes_12` | INTEGER | **1"-2" pipes combined** |
| `pipes34` | `pipes_34` | INTEGER | **3"-4" pipes combined** |
| ~~`pipes1Half`~~ | ~~`pipes_1_5`~~ | ❌ REMOVED | Use `pipes12` |
| ~~`pipes2`~~ | ~~`pipes_2`~~ | ❌ REMOVED | Use `pipes12` |
| ~~`pipes3`~~ | ~~`pipes_3`~~ | ❌ REMOVED | Use `pipes34` |
| ~~`pipes4`~~ | ~~`pipes_4`~~ | ❌ REMOVED | Use `pipes34` |
| **Roof Features** ||||
| `gables` | `gables` | INTEGER | Count |
| `turtleBacks` | `turtle_backs` | INTEGER | Count |
| `satellite` | `satellite` | BOOLEAN | Yes/No |
| `chimney` | `chimney` | BOOLEAN | Yes/No |
| `solar` | `solar` | BOOLEAN | Yes/No |
| `swampCooler` | `swamp_cooler` | BOOLEAN | Yes/No |
| **Gutters & Drainage** ||||
| `gutterLf` / `guttersLf` | `gutter_lf` | NUMERIC(10,2) | Linear feet |
| `downspouts` | `downspouts` | INTEGER | Count |
| `gutterGuardLf` | `gutter_guard_lf` | NUMERIC(10,2) | Linear feet |
| **Lighting & Quotes** ||||
| `permanentLighting` | `permanent_lighting` | TEXT | Description |
| `dabellaQuote` | `dabella_quote` | NUMERIC(12,2) | DaBella amount |
| `quoteAmount` | `quote_amount` | NUMERIC(12,2) | Job count amount |
| `quoteNotes` | `quote_notes` | TEXT | Quote details |
| **Additional** ||||
| `notes` | `notes` | TEXT | General notes |
| `lastContactDate` | `last_contact_date` | DATE | Last contact |
| `deletedAt` | `deleted_at` | TIMESTAMPTZ | Soft delete |

---

### ✅ Communications Tab

| CRM Frontend Field | Database Column | Type | Notes |
|-------------------|-----------------|------|-------|
| `id` | `id` | UUID | Auto-generated |
| `leadId` | `lead_id` | UUID | FK to leads |
| `type` | `type` | TEXT | Call/Email/Text/Meeting |
| `direction` | `direction` | TEXT | Inbound/Outbound |
| `duration` | `duration` | INTEGER | Seconds |
| `notes` | `notes` | TEXT | Communication notes |
| `outcome` | `outcome` | TEXT | Result |
| `createdAt` | `created_at` | TIMESTAMPTZ | Auto-set |

**Real-time:** Not currently subscribed (can be added)

---

### ✅ Canvassing Tab

#### Territories
| CRM Frontend Field | Database Column | Type | Notes |
|-------------------|-----------------|------|-------|
| `id` | `id` | UUID | Auto-generated |
| `name` | `name` | TEXT | Territory name |
| `description` | `description` | TEXT | Description |
| `boundaries` | `boundaries` | JSONB | GeoJSON polygon |
| `active` | `active` | BOOLEAN | Is active |
| `assignedTo` | `assigned_to` | TEXT | User assignment |

#### Properties
| CRM Frontend Field | Database Column | Type | Notes |
|-------------------|-----------------|------|-------|
| `id` | `id` | UUID | Auto-generated |
| `territoryId` | `territory_id` | UUID | FK to territories |
| `address` | `address` | TEXT | Property address |
| `latitude` | `latitude` | NUMERIC(10,8) | Location |
| `longitude` | `longitude` | NUMERIC(11,8) | Location |
| `status` | `status` | TEXT | Not Visited/Contacted/etc |
| `notes` | `notes` | TEXT | Property notes |
| `visitCount` | `visit_count` | INTEGER | Auto-incremented |
| `lastVisitedAt` | `last_visited_at` | TIMESTAMPTZ | Last visit |

#### Visits
| CRM Frontend Field | Database Column | Type | Notes |
|-------------------|-----------------|------|-------|
| `id` | `id` | UUID | Auto-generated |
| `propertyId` | `property_id` | UUID | FK to properties |
| `visitDate` | `visit_date` | DATE | Visit date |
| `outcome` | `outcome` | TEXT | Result |
| `notes` | `notes` | TEXT | Visit notes |

**Real-time:** Not currently subscribed (can be added)

---

### ✅ Property Designs Tab (360° Designer)

| CRM Frontend Field | Database Column | Type | Notes |
|-------------------|-----------------|------|-------|
| `id` | `id` | UUID | Auto-generated |
| `leadId` | `lead_id` | UUID | FK to leads |
| `designData` | `design_data` | JSONB | 3D model data |
| `roofPitchDegrees` | `roof_pitch_degrees` | NUMERIC(5,2) | Roof angle |
| `status` | `status` | TEXT | Draft/Final/etc |
| `notes` | `notes` | TEXT | Design notes |
| `createdAt` | `created_at` | TIMESTAMPTZ | Auto-set |
| `updatedAt` | `updated_at` | TIMESTAMPTZ | Auto-updated |

**Real-time:** Not currently subscribed (can be added)

---

### ✅ Calendar Tab

| CRM Frontend Field | Database Column | Type | Notes |
|-------------------|-----------------|------|-------|
| `id` | `id` | UUID | Auto-generated |
| `leadId` | `lead_id` | UUID | FK to leads (optional) |
| `title` | `title` | TEXT | Event title |
| `description` | `description` | TEXT | Event details |
| `startTime` | `start_time` | TIMESTAMPTZ | Start time |
| `endTime` | `end_time` | TIMESTAMPTZ | End time |
| `location` | `location` | TEXT | Meeting location |
| `eventType` | `event_type` | TEXT | Type of event |
| `googleEventId` | `google_event_id` | TEXT | Google Calendar ID |
| `createdAt` | `created_at` | TIMESTAMPTZ | Auto-set |
| `updatedAt` | `updated_at` | TIMESTAMPTZ | Auto-updated |

**Real-time:** Not currently subscribed (can be added)

---

### ✅ Dashboard Tab (Read-only Statistics)

The dashboard uses the `dashboard_stats` VIEW which aggregates data from the leads table:

| Dashboard Metric | View Column | Calculation |
|-----------------|-------------|-------------|
| Total Leads | `total_leads` | COUNT(leads WHERE deleted_at IS NULL) |
| Hot Leads | `hot_leads` | COUNT(leads WHERE quality='Hot') |
| Quoted Leads | `quoted_leads` | COUNT(leads WHERE disposition='Quoted') |
| Total Quote Value | `total_quote_value` | SUM(dabella_quote) |
| Scheduled | `scheduled_count` | COUNT(disposition='Scheduled') |
| Follow Up | `follow_up_count` | COUNT(disposition='Follow Up') |
| Insurance | `insurance_count` | COUNT(disposition='Insurance') |
| Closed Sold | `closed_sold_count` | COUNT(disposition='Closed Sold') |
| Conversion Rate | `conversion_rate` | (Closed Sold / Total) * 100 |

**Real-time:** Updates when leads table changes (automatic via subscriptions)

---

## 🔄 Real-time Subscriptions

### Currently Active:
- ✅ **Leads Table** - [useLeads.js:54-76](src/hooks/useLeads.js#L54-L76)
  - Listens for INSERT, UPDATE, DELETE events
  - Auto-updates UI when changes occur

### Can Be Added:
- ⚪ Communications
- ⚪ Canvassing (territories, properties, visits)
- ⚪ Property Designs
- ⚪ Calendar Events

---

## ⚠️ Important Migration Notes

### Pipe Fields Changed (Migration 004)
**OLD (REMOVED):**
- `pipes_1_5`, `pipes_2`, `pipes_3`, `pipes_4`

**NEW (CURRENT):**
- `pipes_12` - Combines 1" and 2" pipes
- `pipes_34` - Combines 3" and 4" pipes

**Fix Applied:** [useLeads.js:159-160](src/hooks/useLeads.js#L159-L160) now uses correct field names

### Other Renamed Fields
- `vents` → `ridge_vents` + `turbine_vents`
- `gutters_lf` → `gutter_lf`

---

## 🧪 Testing Field Mappings

### SQL Test:
```bash
psql -h localhost -U postgres -d postgres -f supabase/test_crm_field_mappings.sql
```

### JavaScript Test (Browser Console):
```javascript
import { testSupabaseConnection } from './utils/testSupabaseConnection';
testSupabaseConnection();
```

---

## 📝 Developer Checklist

When adding/editing CRM fields:

- [ ] Update database schema (create new migration)
- [ ] Update field mapping in [supabaseService.js](src/api/supabaseService.js)
- [ ] Update field mapping in [useLeads.js](src/hooks/useLeads.js) (or relevant hook)
- [ ] Update UI components to use new field
- [ ] Add field to this documentation
- [ ] Test with [testSupabaseConnection.js](src/utils/testSupabaseConnection.js)
- [ ] Verify real-time sync works

---

## 🔗 Related Files

- **Supabase Client:** [src/lib/supabase.js](src/lib/supabase.js)
- **Services:** [src/api/supabaseService.js](src/api/supabaseService.js)
- **Hooks:** [src/hooks/useLeads.js](src/hooks/useLeads.js)
- **Schema:** [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql)
- **Job Counts Migration:** [supabase/migrations/004_merge_job_counts_into_leads.sql](supabase/migrations/004_merge_job_counts_into_leads.sql)
