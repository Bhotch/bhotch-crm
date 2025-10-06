# Bhotch CRM - User Feature Guide

**Welcome to Bhotch CRM!**
Your complete guide to using every feature of the CRM system.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Leads Management](#leads-management)
4. [Job Count](#job-count)
5. [Communications](#communications)
6. [Canvassing](#canvassing)
7. [Calendar](#calendar)
8. [Map View](#map-view)
9. [Tips & Tricks](#tips--tricks)

---

## Getting Started

### Accessing the CRM

**Web Access:**
1. Open your browser
2. Go to: `https://bhotch-[deployment].vercel.app`
3. The app loads instantly

**Mobile Install:**
1. Open in Chrome/Safari
2. Tap "Add to Home Screen"
3. Access like a native app

### First Time Setup

**No setup required!** The CRM is ready to use immediately.

### Navigation

```
┌─────────────────────────────────────┐
│  📊 Dashboard  📋 Leads  📐 Job Count │
│  💬 Communications  🗺️ Canvassing    │
│  📅 Calendar  🌍 Map                 │
└─────────────────────────────────────┘
```

Click any tab to switch views. All changes save automatically!

---

## Dashboard

### Overview

The Dashboard shows real-time statistics about your business.

![Dashboard View]

### Key Metrics

**Total Leads**
- Shows all active leads
- Excludes deleted leads
- Updates in real-time

**Hot Leads**
- Leads marked as "Hot" quality
- High priority customers
- Quick access count

**Quoted Leads**
- Leads with "Quoted" disposition
- Potential sales in progress
- Track conversion pipeline

**Total Quote Value**
- Sum of all DaBella quotes
- Shows potential revenue
- Updated automatically

### Disposition Breakdown

**Scheduled:** Appointments set
**Follow Up:** Needs contact
**Insurance:** Insurance claims
**Closed Sold:** Completed sales

### Conversion Rate

```
Conversion Rate = (Closed Sold / Total Leads) × 100
```

Automatically calculated and displayed.

### Using the Dashboard

1. **Monitor at a Glance**
   - Open Dashboard tab
   - View key numbers
   - No interaction needed

2. **Watch Real-Time Updates**
   - Add/edit a lead in another tab
   - Dashboard updates instantly
   - No refresh required

3. **Track Progress**
   - Daily review of metrics
   - Watch conversion rate trends
   - Identify growth opportunities

---

## Leads Management

### Viewing Leads

**Leads Table:**
- Shows all active leads
- Sortable columns
- Searchable
- Filterable

**Columns Shown:**
- Customer Name
- Phone Number
- Email
- Address
- Quality (Hot/Warm/Cold)
- Disposition
- Lead Source
- DaBella Quote
- Square Feet
- Date Added

### Adding a New Lead

**Step 1:** Click "+ Add Lead"

**Step 2:** Fill in basic information
```
┌─ Add New Lead ────────────────────┐
│ Customer Name: [____________]     │
│ First Name:    [____________]     │
│ Last Name:     [____________]     │
│ Phone:         [____________]     │
│ Email:         [____________]     │
│ Address:       [____________]     │
└───────────────────────────────────┘
```

**Step 3:** Set lead classification
- Quality: Hot, Warm, or Cold
- Disposition: Status (Scheduled, Follow Up, etc.)
- Lead Source: Where they came from

**Step 4:** Click "Add Lead"

✅ Lead appears instantly in table!

### Editing a Lead

**Step 1:** Find the lead
- Use search box
- Or scroll to find

**Step 2:** Click pencil icon ✏️

**Step 3:** Update fields
- Change any information
- Fields save automatically

**Step 4:** Click "Save"

✅ Changes appear everywhere instantly!

### Deleting a Lead

**Step 1:** Find the lead

**Step 2:** Click trash icon 🗑️

**Step 3:** Confirm deletion

✅ Lead is soft-deleted (can be recovered)

### Searching & Filtering

**Search Box:**
```
🔍 [Search leads...]
```
Searches: Name, Phone, Email, Address

**Quality Filter:**
```
Quality: [ All | Hot | Warm | Cold ]
```

**Disposition Filter:**
```
Disposition: [ All | Scheduled | Quoted | etc. ]
```

**Date Filter:**
```
From: [____] To: [____]
```

### Column Management

**Show/Hide Columns:**

1. Click ⚙️ Settings icon
2. Check/uncheck columns
3. Click "Save"

**Saved Preferences:**
- Remembers your choices
- Applies every time you visit
- Reset to defaults anytime

### Sorting

**Click any column header** to sort:
- First click: Ascending (↑)
- Second click: Descending (↓)
- Third click: Remove sort

---

## Job Count

### Purpose

Track detailed measurements and specifications for each property.

### Selecting a Customer

**Step 1:** Open "Job Count" tab

**Step 2:** Use search box
```
🔍 [Search customers...]
```

**Step 3:** Select from dropdown
```
Customer: [ John Doe - 555-1234 - 123 Main St ]
```

✅ Form loads with existing data!

### Adding a New Count

**For New Customer:**

**Step 1:** Click "+ Add New Count"

**Step 2:** Enter customer information
- First Name
- Last Name
- Phone Number
- Email
- Address

**Step 3:** Fill in measurements (below)

**Step 4:** Click "Create Lead & Save Count"

### Form Sections

#### 1. Core Measurements

```
┌─ Core Measurements ───────────────┐
│ Square Feet: [____] (required)    │
│ Ridge LF:    [____]               │
│ Valley LF:   [____]               │
│ Eaves LF:    [____]               │
└───────────────────────────────────┘
```

**Square Feet:** Total roof area (REQUIRED)
**Ridge LF:** Linear feet of ridge
**Valley LF:** Linear feet of valleys
**Eaves LF:** Linear feet of eaves

#### 2. Ventilation

```
┌─ Ventilation ─────────────────────┐
│ Ridge Vents:   [__]               │
│ Turbine Vents: [__]               │
│ Rime Flow:     [____]             │
└───────────────────────────────────┘
```

**Ridge Vents:** Count of ridge vents
**Turbine Vents:** Count of turbine vents
**Rime Flow:** Rime flow measurement

#### 3. Pipes

```
┌─ Pipes ───────────────────────────┐
│ Pipes 1"-2": [__]                 │
│ Pipes 3"-4": [__]                 │
└───────────────────────────────────┘
```

**1"-2":** Count of small pipes (combined)
**3"-4":** Count of large pipes (combined)

#### 4. Roof Features

```
┌─ Roof Features ───────────────────┐
│ Gables:       [__]                │
│ Turtle Backs: [__]                │
│                                   │
│ ☐ Satellite   ☐ Chimney          │
│ ☐ Solar       ☐ Swamp Cooler     │
└───────────────────────────────────┘
```

**Gables:** Count of gable ends
**Turtle Backs:** Count of turtle back vents
**Checkboxes:** Yes/No features

#### 5. Gutters & Drainage

```
┌─ Gutters & Drainage ──────────────┐
│ Gutter LF:       [____]           │
│ Downspouts:      [__]             │
│ Gutter Guard LF: [____]           │
└───────────────────────────────────┘
```

#### 6. Additional Information

```
┌─ Additional ───────────────────────┐
│ Permanent Lighting: [__________]  │
│ Quote Amount ($):   [__________]  │
│ Quote Notes:                      │
│ ┌───────────────────────────────┐ │
│ │                               │ │
│ │                               │ │
│ └───────────────────────────────┘ │
└───────────────────────────────────┘
```

### Saving

**Auto-Save Indicator:**
```
🟠 Unsaved changes
```

**Save Button:**
```
[💾 Save Job Count]
```

**After Saving:**
```
✅ Job count saved successfully!
```

All fields sync to database immediately.

### Tips

- ✅ **Fill in Square Feet first** - It's required
- ✅ **Use Tab key** to move between fields quickly
- ✅ **Save frequently** - Click save after each section
- ✅ **Leave notes** - Use Quote Notes for special instructions

---

## Communications

### Purpose

Track all interactions with customers: calls, emails, texts, meetings.

### Viewing Communications

**Communications Table:**
- Shows all logged communications
- Newest first
- Linked to leads

**Columns:**
- Customer Name
- Type (Call/Email/Text/Meeting)
- Direction (Inbound/Outbound)
- Duration
- Notes
- Outcome
- Date/Time

### Logging a Communication

**Step 1:** Click "+ Log Communication"

**Step 2:** Select customer
```
Customer: [ Select from dropdown ]
```

**Step 3:** Set type
```
Type: [ Call | Email | Text | Meeting ]
```

**Step 4:** Set direction
```
Direction: [ Inbound | Outbound ]
```

**Step 5:** Enter details
```
Duration: [__] seconds
Notes: [_________________]
Outcome: [______________]
```

**Step 6:** Click "Save"

✅ Communication logged!

### Communication Types

**Call:**
- Phone conversations
- Track duration
- Note outcome

**Email:**
- Email exchanges
- Copy subject/content to notes
- Track response

**Text:**
- SMS messages
- Quick follow-ups
- Confirmation texts

**Meeting:**
- In-person meetings
- Virtual meetings
- Site visits

### Best Practices

✅ **Log immediately** after contact
✅ **Be specific** in notes
✅ **Include next steps** in outcome
✅ **Track promises** made to customer

---

## Canvassing

### Purpose

Manage territories, track properties, and log visits.

### Territories

**Creating a Territory:**

1. Click "+ New Territory"
2. Enter name (e.g., "North Side")
3. Add description
4. Draw boundaries on map
5. Assign to team member
6. Click "Create"

**Managing Territories:**
- View all territories
- Edit boundaries
- Assign/reassign
- Mark active/inactive

### Properties

**Adding a Property:**

1. Select territory
2. Click "+ Add Property"
3. Enter address
4. Mark location on map
5. Set initial status
6. Add notes
7. Click "Save"

**Property Statuses:**
- Not Visited
- No Answer
- Not Interested
- Interested
- Scheduled
- Converted to Lead

**Updating Property:**
- Click on property
- Change status
- Add visit notes
- Save changes

### Logging Visits

**Step 1:** Find property in territory

**Step 2:** Click "Log Visit"

**Step 3:** Enter visit details
```
Date: [____]
Outcome: [ No Answer | Not Interested | etc. ]
Notes: [_______________________________]
```

**Step 4:** Click "Save Visit"

**Auto-Increments:**
- Visit count updates automatically
- Last visited date set

### Canvassing Workflow

```
1. Select Territory
   ↓
2. View Properties
   ↓
3. Mark Visited
   ↓
4. Update Status
   ↓
5. Convert to Lead (if interested)
```

### Tips

✅ **Plan your route** - Review territory before going out
✅ **Update in real-time** - Log visits immediately
✅ **Add good notes** - Help next person who visits
✅ **Convert quickly** - Turn interested properties into leads

---

## Calendar

### Purpose

Schedule and track all appointments and events.

### Calendar Views

**Month View:**
- See whole month
- All events shown
- Click date to add event

**Week View:**
- Detailed weekly schedule
- Time slots visible
- Drag to create events

**Day View:**
- Hourly breakdown
- Detailed schedule
- Perfect for busy days

### Adding an Event

**Step 1:** Click "+ New Event" or click on calendar

**Step 2:** Fill in details
```
┌─ New Event ───────────────────────┐
│ Title:        [_______________]   │
│ Customer:     [ Select ]          │
│ Start:        [____] [____]       │
│ End:          [____] [____]       │
│ Location:     [_______________]   │
│ Type:         [ Appointment ]     │
│ Description:  [_______________]   │
│               [_______________]   │
└───────────────────────────────────┘
```

**Step 3:** Click "Create Event"

### Event Types

**Appointment:** Customer meetings
**Site Visit:** Property inspections
**Follow-up:** Check-in calls
**Installation:** Job completion
**Other:** Miscellaneous

### Editing Events

**Click on event** to edit:
- Change time
- Update location
- Modify details
- Delete if needed

### Google Calendar Sync

**Coming Soon:**
- Two-way sync with Google Calendar
- Updates automatically
- Access from any device

### Tips

✅ **Link to leads** - Always select customer
✅ **Set reminders** - Add location for site visits
✅ **Color code** - Use event types for easy scanning
✅ **Update status** - Mark completed after event

---

## Map View

### Purpose

Visualize leads and territories on an interactive map.

### Using the Map

**View All Leads:**
- Blue markers = Leads
- Green markers = Hot leads
- Red markers = Territories

**Click a Marker:**
- See customer info
- Quick actions
- Directions link

**Filter by:**
- Quality (Hot/Warm/Cold)
- Disposition
- Territory

### Features

**Cluster View:**
- Multiple leads close together = cluster
- Click cluster to zoom in
- See individual leads

**Draw Territory:**
- Click "Draw" tool
- Outline area on map
- Save as territory

**Get Directions:**
- Click lead marker
- Click "Directions"
- Opens Google Maps

### Tips

✅ **Plan routes** - See multiple leads in area
✅ **Identify gaps** - Find uncovered areas
✅ **Territory planning** - Visual boundary drawing
✅ **Mobile friendly** - Use on phone while driving

---

## Tips & Tricks

### Keyboard Shortcuts

```
Ctrl/Cmd + S    = Save current form
Ctrl/Cmd + F    = Focus search box
Esc             = Close modal
Tab             = Next field
Shift + Tab     = Previous field
```

### Speed Tips

**1. Use Search Everywhere**
- Every view has search
- Start typing immediately
- No need to scroll

**2. Tab Between Fields**
- Faster than clicking
- Maintains flow
- Works in all forms

**3. Real-Time Updates**
- Open two windows
- Edit in one, see in other
- Verify changes instantly

**4. Column Customization**
- Hide unused columns
- Show only what you need
- Saves screen space

**5. Filters for Focus**
- Use quality filter for priority
- Date filter for recent leads
- Disposition for pipeline

### Mobile Usage

**Best Practices:**
- Landscape mode for tables
- Portrait for forms
- Install as app for speed
- Works offline (coming soon)

### Data Entry

**Quick Lead Entry:**
1. Minimum: Name + Phone
2. Add details later
3. Required fields marked

**Bulk Operations:**
- Coming soon: Import CSV
- Coming soon: Batch update
- Coming soon: Export to Excel

### Maintenance

**Daily:**
- Review dashboard metrics
- Follow up on scheduled leads
- Log all communications

**Weekly:**
- Update canvassing territories
- Review conversion rates
- Clean up old leads

**Monthly:**
- Analyze trends
- Plan strategies
- Archive closed leads

---

## Frequently Asked Questions

**Q: Do changes save automatically?**
A: No, click "Save" button to save changes. You'll see "Unsaved changes" indicator.

**Q: Can I undo a deletion?**
A: Yes, leads are soft-deleted. Contact admin for recovery.

**Q: How do I export data?**
A: Coming soon. Use browser print for now.

**Q: Can multiple people use it at once?**
A: Yes! Real-time sync keeps everyone updated.

**Q: Does it work offline?**
A: Not yet, but coming soon with PWA updates.

**Q: How do I get support?**
A: Contact your admin or check documentation in `/docs` folder.

---

## Quick Reference Card

```
╔══════════════════════════════════════════════╗
║           BHOTCH CRM QUICK GUIDE             ║
╠══════════════════════════════════════════════╣
║ ADD LEAD         | + Add Lead button         ║
║ EDIT LEAD        | ✏️ icon in table           ║
║ DELETE LEAD      | 🗑️ icon in table           ║
║ SEARCH           | 🔍 search box              ║
║ FILTER           | Dropdown filters          ║
║ ADD JOB COUNT    | Job Count tab → + New     ║
║ LOG COMMUNICATION| Communications → + Log    ║
║ ADD EVENT        | Calendar → + New Event    ║
║ ADD TERRITORY    | Canvassing → + Territory  ║
║ VIEW STATS       | Dashboard tab             ║
╚══════════════════════════════════════════════╝
```

---

**END OF USER FEATURE GUIDE**

*For technical documentation, see: [COMPREHENSIVE_SYSTEM_GUIDE.md](COMPREHENSIVE_SYSTEM_GUIDE.md)*
*For field mappings, see: [FIELD_MAPPING_REFERENCE.md](../FIELD_MAPPING_REFERENCE.md)*
