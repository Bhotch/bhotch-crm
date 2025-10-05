# CRM Testing Checklist
**Date:** October 5, 2025
**Testing Environment:** http://localhost:3000 (Development) + https://bhotch-crm.vercel.app (Production)

---

## Pre-Testing Setup

### 1. Apply Supabase Security Fixes (CRITICAL - Do This First!)

**Steps:**
1. Open https://supabase.com/dashboard/project/lvwehhyeoolktdlvaikd
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Open `supabase/migrations/002_security_fixes.sql` in your editor
5. Copy the entire contents
6. Paste into Supabase SQL Editor
7. Click **RUN** (or press Ctrl+Enter)
8. Verify "Success. No rows returned" message
9. Go to **Database → Advisors**
10. Click **Run Checks**
11. Verify: **0 errors, 0 warnings** ✅

**Expected Result:** All security issues resolved

---

## Testing Matrix

### Environment Selection
- [ ] Local Development (http://localhost:3000)
- [ ] Production (https://bhotch-crm.vercel.app)

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)

---

## 1. Dashboard Tab Testing

### A. Initial Load
- [ ] Dashboard loads without errors
- [ ] No console errors (press F12 → Console)
- [ ] All stats display:
  - [ ] Total Leads count (should show 123)
  - [ ] Hot Leads count
  - [ ] Quoted Leads count
  - [ ] Total Quote Value
  - [ ] Conversion Rate

### B. Charts and Visualizations
- [ ] Charts render properly
- [ ] Data displays correctly
- [ ] No "NaN" or "undefined" values

### C. Real-time Updates (Advanced)
**Test:** Add a new lead and watch dashboard update
1. Open Dashboard in one browser tab
2. Open Leads tab in another browser tab/window
3. Add a new lead in Leads tab
4. Watch Dashboard tab - stats should update within 1-2 seconds
- [ ] Dashboard stats update automatically (no page refresh needed)

---

## 2. Leads Tab Testing

### A. Initial Load
- [ ] Lead list displays
- [ ] Shows 123+ leads (from migration)
- [ ] Table columns display properly:
  - [ ] Customer Name
  - [ ] Phone Number
  - [ ] Address
  - [ ] Quality (Hot/Warm/Cold)
  - [ ] Disposition
  - [ ] Actions

### B. Search and Filter
- [ ] Search by customer name works
- [ ] Search by phone number works
- [ ] Search by address works
- [ ] Filter by quality works (Hot/Warm/Cold)
- [ ] Filter by disposition works
- [ ] Clear filters works

### C. Sorting
- [ ] Sort by Name (A-Z, Z-A)
- [ ] Sort by Date (Newest/Oldest)
- [ ] Sort by Quality

### D. Add New Lead
**Steps:**
1. Click "Add Lead" button
2. Fill in form:
   - Customer Name: "Test Customer"
   - Phone: "555-1234"
   - Address: "123 Test St"
   - Quality: "Hot"
   - Disposition: "New"
3. Click Save

**Verify:**
- [ ] Success notification appears
- [ ] New lead appears in list immediately
- [ ] Lead has all entered information
- [ ] No console errors

### E. Edit Existing Lead
**Steps:**
1. Click Edit icon on any lead
2. Change Customer Name to "Updated Name"
3. Click Save

**Verify:**
- [ ] Success notification appears
- [ ] Name updates in list immediately
- [ ] No page refresh needed
- [ ] No console errors

### F. Delete Lead (Soft Delete)
**Steps:**
1. Click Delete icon on a test lead
2. Confirm deletion

**Verify:**
- [ ] Success notification appears
- [ ] Lead disappears from list immediately
- [ ] Dashboard stats update automatically
- [ ] No console errors

### G. Real-time Subscription Test
**Setup:** Open Leads tab in two browser windows side-by-side

**Test 1: Add Lead in Window 1**
- [ ] Lead appears immediately in Window 2 (without refresh)

**Test 2: Edit Lead in Window 1**
- [ ] Changes appear immediately in Window 2 (without refresh)

**Test 3: Delete Lead in Window 1**
- [ ] Lead disappears immediately from Window 2 (without refresh)

**Expected:** All changes propagate in <1 second

### H. View Lead Details
- [ ] Click on a lead to view details
- [ ] All fields display correctly
- [ ] Associated job counts appear
- [ ] Associated communications appear
- [ ] Close modal works

---

## 3. Job Counts Tab Testing

### A. Initial Load
- [ ] Job counts list displays
- [ ] Table shows all columns:
  - [ ] Customer Name (from joined leads table)
  - [ ] Address (from joined leads table)
  - [ ] Date
  - [ ] Square Footage
  - [ ] Ridge Length
  - [ ] Actions

### B. Add New Job Count
**Steps:**
1. Click "Add Job Count"
2. Select an existing lead from dropdown
3. Fill in:
   - Date: Today's date
   - Square Footage: "2500"
   - Ridge Length: "50"
   - Hip Length: "30"
4. Click Save

**Verify:**
- [ ] Success notification appears
- [ ] New job count appears in list
- [ ] Customer name displays correctly (from joined lead)
- [ ] Address displays correctly (from joined lead)
- [ ] No console errors

### C. Edit Job Count
**Steps:**
1. Click Edit on a job count
2. Change Square Footage to "3000"
3. Click Save

**Verify:**
- [ ] Success notification appears
- [ ] Updates immediately in list
- [ ] No console errors

### D. Delete Job Count
**Steps:**
1. Click Delete on a test job count
2. Confirm deletion

**Verify:**
- [ ] Success notification appears
- [ ] Disappears from list immediately
- [ ] No console errors

### E. Real-time Subscription Test
**Setup:** Open Job Counts tab in two browser windows

**Test 1: Add Job Count in Window 1**
- [ ] Job count appears immediately in Window 2

**Test 2: Edit Job Count in Window 1**
- [ ] Changes appear immediately in Window 2

**Expected:** Real-time updates working

---

## 4. Communications Tab Testing

### A. Initial Load
- [ ] Communications list loads
- [ ] Shows all communications types:
  - [ ] Calls
  - [ ] SMS
  - [ ] Emails
- [ ] Statistics display:
  - [ ] Total Calls
  - [ ] Total SMS
  - [ ] Total Emails
  - [ ] No Answers
  - [ ] Voicemails Left

### B. Add New Communication - Call
**Steps:**
1. Click "Log Communication"
2. Select Type: "Call"
3. Select Lead: Any lead from dropdown
4. Select Status: "Completed"
5. Enter Notes: "Test call completed"
6. Enter Duration: "5" (minutes)
7. Click Save

**Verify:**
- [ ] Success notification appears
- [ ] Communication appears in list immediately
- [ ] Shows customer name
- [ ] Shows type as "Call"
- [ ] Shows status as "Completed"
- [ ] Stats update immediately (Total Calls +1)
- [ ] No console errors

### C. Add New Communication - SMS
**Steps:**
1. Click "Log Communication"
2. Select Type: "SMS"
3. Select Lead: Any lead
4. Enter Notes: "Test SMS message sent"
5. Click Save

**Verify:**
- [ ] Success notification appears
- [ ] SMS appears in list
- [ ] Stats update (Total SMS +1)

### D. Add New Communication - Email
**Steps:**
1. Click "Log Communication"
2. Select Type: "Email"
3. Select Lead: Any lead
4. Enter Subject: "Test Email"
5. Enter Notes: "Email content here"
6. Click Save

**Verify:**
- [ ] Success notification appears
- [ ] Email appears in list
- [ ] Stats update (Total Emails +1)

### E. Filter Communications
- [ ] Filter by Lead - shows only that lead's communications
- [ ] Filter by Type (Call/SMS/Email)
- [ ] Filter by Date Range (Last 7 days, Last 30 days)
- [ ] Clear filters works

### F. View Communication Details
- [ ] Click on communication to view details
- [ ] All information displays correctly
- [ ] Associated lead information shows
- [ ] Close modal works

### G. Delete Communication
**Steps:**
1. Click Delete on a test communication
2. Confirm deletion

**Verify:**
- [ ] Success notification appears
- [ ] Disappears from list immediately
- [ ] Stats update immediately (count decreases)
- [ ] No console errors

### H. Real-time Subscription Test
**Setup:** Open Communications tab in two browser windows

**Test 1: Add Communication in Window 1**
- [ ] Communication appears immediately in Window 2

**Test 2: Delete Communication in Window 1**
- [ ] Disappears immediately from Window 2

**Expected:** Real-time updates <1 second

### I. Google Voice Integration (If Configured)
- [ ] Click "Call" button on a lead
- [ ] Google Voice interface opens
- [ ] Call can be initiated
- [ ] Call is logged automatically (if integration complete)

---

## 5. Canvassing Tab Testing

### A. Initial Load
- [ ] Map loads correctly
- [ ] Shows default location or saved location
- [ ] Zoom controls work
- [ ] Street view button works

### B. Click-to-Drop Pin
**Steps:**
1. Click anywhere on the map
2. Pin should appear immediately

**Verify:**
- [ ] Pin appears where clicked
- [ ] Zoom level adjusts to street level (18-20)
- [ ] Address populates automatically (geocoding)
- [ ] Property form appears

### C. Add Property
**Steps:**
1. Click on map to drop pin
2. Fill in property form:
   - Address: Auto-filled or manual
   - Status: "Needs Inspection"
   - Notes: "Test property"
3. Click Save

**Verify:**
- [ ] Pin stays on map with correct color
- [ ] Property appears in list on sidebar
- [ ] Day summary updates
- [ ] No console errors

### D. Update Property Status
**Steps:**
1. Click on an existing property pin
2. Change status to "Interested"
3. Click Save

**Verify:**
- [ ] Pin color changes to reflect new status
- [ ] Status updates in sidebar list
- [ ] Day summary updates
- [ ] No console errors

### E. Day Summary
- [ ] Total properties counted correctly
- [ ] Status breakdown accurate:
  - [ ] Needs Inspection count
  - [ ] Knock Not Home count
  - [ ] Follow Up Needed count
  - [ ] Door Hanger count
  - [ ] Interested count
  - [ ] Appointments count

### F. Export Day Summary
**Steps:**
1. Click "Export Summary"
2. File downloads

**Verify:**
- [ ] CSV file downloads
- [ ] File contains all properties visited today
- [ ] Data is correctly formatted
- [ ] Opens in Excel/Sheets properly

### G. Map Controls
- [ ] Zoom in/out works
- [ ] Pan/drag works
- [ ] Street view works
- [ ] Satellite view toggle works
- [ ] Full screen mode works

---

## 6. Cross-Tab Integration Testing

### A. Lead → Job Count Flow
**Steps:**
1. Go to Leads tab
2. Add a new lead: "Integration Test Customer"
3. Go to Job Counts tab
4. Add a job count for the new lead
5. Go back to Leads tab
6. Open the lead details

**Verify:**
- [ ] Job count appears in lead details
- [ ] All data correctly linked

### B. Lead → Communication Flow
**Steps:**
1. Go to Leads tab
2. Select a lead
3. Click "Contact" or similar button
4. Log a communication
5. Check Communications tab

**Verify:**
- [ ] Communication appears in Communications tab
- [ ] Correctly linked to lead
- [ ] Customer name displays

### C. Canvassing → Lead Flow
**Steps:**
1. Go to Canvassing tab
2. Drop a pin on map
3. Mark as "Interested"
4. Create lead from property
5. Check Leads tab

**Verify:**
- [ ] New lead created from property
- [ ] Address matches
- [ ] Disposition set appropriately

---

## 7. Performance Testing

### A. Page Load Times
- [ ] Dashboard: <2 seconds
- [ ] Leads Tab: <3 seconds (with 123+ leads)
- [ ] Job Counts Tab: <2 seconds
- [ ] Communications Tab: <2 seconds
- [ ] Canvassing Tab: <3 seconds (map load)

### B. Search Performance
**Steps:**
1. Go to Leads tab (123+ records)
2. Type in search box: "Test"

**Verify:**
- [ ] Results filter instantly (<500ms)
- [ ] No lag or freeze
- [ ] UI remains responsive

### C. Real-time Subscription Performance
**Monitor:** Browser Developer Tools → Network → WS (WebSocket)

**Verify:**
- [ ] WebSocket connections established
- [ ] Connections show "Connected"
- [ ] Low bandwidth usage when idle (<1KB/s)
- [ ] Updates propagate quickly (<1 second)

---

## 8. Error Handling Testing

### A. Network Offline
**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to add a lead

**Verify:**
- [ ] Appropriate error message appears
- [ ] Fallback to local storage works (if implemented)
- [ ] No unhandled errors in console
- [ ] App doesn't crash

### B. Invalid Data Entry
**Test 1: Required Fields**
1. Try to save lead without customer name
- [ ] Validation error shown
- [ ] Form doesn't submit

**Test 2: Phone Format**
1. Enter invalid phone: "abc123"
- [ ] Validation error shown
- [ ] Suggests correct format

**Test 3: Duplicate Entry**
1. Try to add lead with duplicate phone
- [ ] Warning shown (if duplicate detection enabled)
- [ ] Option to proceed or cancel

### C. Database Connection Issues
**Simulated Test:**
- [ ] If Supabase is unreachable, fallback to Google Sheets works
- [ ] User is notified of fallback mode
- [ ] Data still accessible

---

## 9. Browser Console Checks

### Critical Checks (F12 → Console)
- [ ] **No errors** in red
- [ ] **No unhandled promise rejections**
- [ ] **No 404 errors** (missing resources)
- [ ] **No CORS errors**

### Acceptable Warnings
✅ Webpack DevServer deprecation warnings (development only)
✅ Google Maps API usage warnings (if using free tier)

### Supabase-Specific Checks
Look for console logs confirming:
- [ ] "Supabase enabled: true" or similar
- [ ] "Lead changed:" logs when real-time events occur
- [ ] "Job count changed:" logs
- [ ] "Communication changed:" logs

---

## 10. Database Health Monitor (Dev Mode)

If `DatabaseHealthMonitor` component is visible:

**Verify:**
- [ ] Shows "Connected" to Supabase
- [ ] Response time <100ms
- [ ] Record counts match expected:
  - [ ] Leads: 123+
  - [ ] Job Counts: (your count)
  - [ ] Communications: (your count)
- [ ] Performance rating: "Excellent" or "Good"

---

## 11. Mobile Responsiveness (Optional)

### Test on Mobile or Resize Browser to 375px width

**Dashboard:**
- [ ] Stats stack vertically
- [ ] Charts resize appropriately
- [ ] All content accessible

**Leads Tab:**
- [ ] Table scrolls horizontally if needed
- [ ] Action buttons accessible
- [ ] Add lead form works

**Canvassing Tab:**
- [ ] Map fills screen appropriately
- [ ] Touch gestures work (pinch to zoom, pan)
- [ ] Property list accessible

---

## 12. Security Verification

### A. Supabase Security Advisor
**Steps:**
1. Go to Supabase Dashboard
2. Navigate to Database → Advisors
3. Click "Run Checks"

**Verify:**
- [ ] **0 errors**
- [ ] **0 warnings**
- [ ] Green checkmarks on all tests

**Specific Checks:**
- [ ] ✅ `update_updated_at_column` has fixed search_path
- [ ] ✅ `increment_property_visit_count` has fixed search_path
- [ ] ✅ `dashboard_stats` uses SECURITY INVOKER

### B. Environment Variables
**Verify in Vercel:**
1. Go to Vercel Dashboard → Settings → Environment Variables

**Check:**
- [ ] `REACT_APP_SUPABASE_URL` is set (Production)
- [ ] `REACT_APP_SUPABASE_ANON_KEY` is set (Production)
- [ ] `REACT_APP_SUPABASE_SERVICE_KEY` is set (Production)
- [ ] All other required env vars present

---

## 13. Deployment Verification

### Production Deployment
**URL:** https://bhotch-crm.vercel.app

**Verify:**
- [ ] Site loads successfully
- [ ] No 404 errors
- [ ] All tabs accessible
- [ ] Supabase connection works (not fallback to Google Sheets)
- [ ] Real-time features work
- [ ] No console errors

### Vercel Deployment Status
**Command:** `vercel ls --scope brandon-hotchkiss-projects`

**Verify:**
- [ ] Latest deployment shows "● Ready"
- [ ] Age matches recent git push
- [ ] Environment: Production
- [ ] No build errors

---

## 14. Git Repository Check

**Command:** `git status`

**Verify:**
- [ ] Working directory clean
- [ ] All changes committed
- [ ] Branch: main
- [ ] Up to date with origin/main

**Command:** `git log --oneline -3`

**Verify latest commits:**
- [ ] Recent commit for Supabase enhancements
- [ ] Recent commit for migration verification
- [ ] All commits have proper messages

---

## Test Results Summary

### Environment Tested
- [ ] Local Development
- [ ] Production Deployment

### Overall Results
- Total Tests: _____
- Passed: _____
- Failed: _____
- Skipped: _____

### Critical Issues Found
1. _______________
2. _______________
3. _______________

### Minor Issues Found
1. _______________
2. _______________
3. _______________

### Performance Notes
- Page load times: _______________
- Real-time latency: _______________
- Database response: _______________

### Browser Compatibility
- [ ] Chrome/Edge: Working
- [ ] Firefox: Working
- [ ] Safari: Working

---

## Sign-Off

**Tester:** _______________
**Date:** _______________
**Status:** [ ] PASS [ ] FAIL [ ] NEEDS WORK

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## Quick Test (15 minutes)

If time is limited, prioritize these tests:

1. ✅ **Apply Security Fixes** (5 min)
2. ✅ **Dashboard loads** (1 min)
3. ✅ **Add a lead** (2 min)
4. ✅ **Real-time test: Open 2 tabs, add lead in one, see it in other** (3 min)
5. ✅ **Add a job count** (2 min)
6. ✅ **Log a communication** (2 min)
7. ✅ **Check console for errors** (1 min)

**If all 7 pass:** System is production ready ✅
