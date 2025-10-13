# Communications Center - Quick Start Guide

## 🚀 Ready to Use!

Your Communications Center is now fully operational with Google Voice integration.

---

## 📋 Before You Start

### 1. Apply Database Migration (5 minutes)

**Go to Supabase Dashboard:**
1. Open https://supabase.com
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New query"
5. Open this file: `supabase/migrations/012_enhanced_communications.sql`
6. Copy entire contents
7. Paste into SQL Editor
8. Click "Run" or press Ctrl+Enter

**Verify it worked:**
```sql
-- Run this query in SQL Editor:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'communications'
AND column_name IN ('disposition', 'follow_up_date', 'google_voice_account');
```
Should return 3 rows.

### 2. Build & Deploy (2 minutes)

```bash
# In your project directory
npm run build

# If build succeeds, deploy
vercel deploy --prod
```

### 3. Browser Setup (1 minute)

1. Open Chrome/Firefox/Edge
2. Go to https://google.com
3. Log in as: **brandon@rimehq.net**
4. Visit https://voice.google.com to verify access
5. When you visit your CRM, allow popups if prompted

---

## 🎯 How to Use

### Making a Call

1. Click **Communications** tab
2. Search for customer (or select from list)
3. Click blue **"Call"** button
4. **Google Voice opens automatically** with phone number
5. Make your call in Google Voice
6. Return to CRM
7. Select disposition:
   - ✅ Spoke with Customer
   - 📵 No Answer
   - 📞 Left Voicemail
   - 📅 Follow-up Needed
   - 🚫 Not Interested
8. Type notes about the call
9. Click **"Log Communication"**

✅ **Done!** Call is saved with timestamp.

---

### Sending SMS

1. Click **Communications** tab
2. Search/select customer
3. Click green **"SMS"** button
4. **Google Voice messages opens** with phone number
5. Send your text in Google Voice
6. Return to CRM
7. Select disposition:
   - 📤 Sent SMS
   - 📥 Received SMS
   - 📅 Follow-up Needed
   - 🚫 Not Interested
8. Type message content/notes
9. Click **"Log Communication"**

✅ **Done!** SMS is logged.

---

### Sending Email

1. Click **Communications** tab
2. Search/select customer (must have email)
3. Click purple **"Email"** button
4. Enter **Subject**
5. Enter **Message**
6. Select disposition:
   - 📧 Email Sent
   - 📨 Email Received
   - 📅 Follow-up Needed
   - 🚫 Not Interested
7. Click **"Log Communication"**
8. **Email client opens** with pre-filled info
9. Send the email

✅ **Done!** Email is logged.

---

## 🔍 Viewing Communication History

1. Select any customer
2. Scroll down to **"Communication History"** section
3. See all past:
   - 📞 Phone calls
   - 💬 SMS messages
   - 📧 Emails
4. Each shows:
   - Date & time
   - Disposition/outcome
   - Your notes
   - Type icon

---

## 📅 Setting Follow-ups

When you select **"Follow-up Needed"** for any disposition:
1. A date picker appears automatically
2. Select future date
3. Click "Log Communication"
4. Follow-up is saved

**To view follow-ups**, run this in Supabase:
```sql
SELECT * FROM follow_up_reminders
WHERE urgency IN ('Today', 'Overdue')
ORDER BY follow_up_date;
```

---

## 💡 Pro Tips

### Customer Search
- Search by: name, address, phone, or email
- Filter by: All, Leads, or Jobs
- Sorted by most recent contact first

### Customer Info Display
When you select a customer, you see:
- Full contact information
- Property details (roof age, sqft, etc.)
- Quote amounts
- Lead quality and status
- All notes
- Communication stats (calls, SMS, emails)

### Google Voice Account Info
Always visible in the left panel:
- Account: **brandon@rimehq.net**
- Phone: **801-228-0678**

---

## ⚠️ Troubleshooting

### Popup Blocked?
1. Click popup blocker icon in browser address bar
2. Select "Always allow popups"
3. Refresh page
4. Try again

### Google Voice doesn't open?
1. Verify you're logged into brandon@rimehq.net
2. Try opening https://voice.google.com manually
3. Check if popup blocker is enabled
4. Try a different browser

### Communication not saving?
1. Check browser console (F12) for errors
2. Verify Supabase connection (check .env file)
3. Ensure database migration was applied
4. Check internet connection

### Phone number not pre-filled?
- Customer must have phone number in their record
- Update customer info to add phone number
- System will automatically format it

---

## 📊 Quick Stats

Access communication stats in Supabase:
```sql
-- Today's communications
SELECT type, COUNT(*) as count
FROM communications
WHERE DATE(timestamp) = CURRENT_DATE
GROUP BY type;

-- This week's communications
SELECT
  COUNT(*) FILTER (WHERE type = 'call') as calls,
  COUNT(*) FILTER (WHERE type = 'sms') as sms,
  COUNT(*) FILTER (WHERE type = 'email') as emails
FROM communications
WHERE timestamp > NOW() - INTERVAL '7 days';

-- Most contacted customers
SELECT l.customer_name, COUNT(c.*) as contacts
FROM leads l
JOIN communications c ON l.id = c.lead_id
WHERE c.timestamp > NOW() - INTERVAL '30 days'
GROUP BY l.customer_name
ORDER BY contacts DESC
LIMIT 10;
```

---

## 📱 Mobile Usage

The Communications Center is fully responsive:
- Works on phones and tablets
- Touch-friendly buttons
- Optimized layout for small screens
- All features available on mobile

---

## 🎓 Training Users

### For New Users:
1. Show them the customer search
2. Demonstrate one complete workflow (call, SMS, or email)
3. Show them the communication history
4. Explain follow-ups
5. Let them practice with a test customer

### Key Points to Emphasize:
- Always select disposition
- Add notes for every communication
- Use follow-ups for callbacks
- Review history before contacting

---

## 📞 Google Voice Integration

### Account Details:
- **Email**: brandon@rimehq.net
- **Phone**: 801-228-0678

### How It Works:
1. CRM opens Google Voice in new window
2. Phone number is pre-filled (if available)
3. You make call/send SMS in Google Voice
4. Return to CRM to log the interaction
5. CRM saves everything to database

### Benefits:
- All calls/texts from one number (801-228-0678)
- Professional appearance
- Call history in Google Voice
- Backup of conversations
- CRM logging for analytics

---

## 🎉 You're Ready!

That's it! Your Communications Center is ready to use.

### Next Steps:
1. ✅ Apply database migration
2. ✅ Build & deploy
3. ✅ Log into Google Voice
4. ✅ Start communicating!

---

## 📚 More Help

- **Full Documentation**: See [COMMUNICATIONS_SUMMARY.md](./COMMUNICATIONS_SUMMARY.md)
- **Deployment Guide**: See [COMMUNICATIONS_DEPLOYMENT.md](./COMMUNICATIONS_DEPLOYMENT.md)
- **Database Schema**: Check `supabase/migrations/012_enhanced_communications.sql`

---

**Questions?** Check the troubleshooting section or refer to the full documentation.

**Happy Communicating! 🚀**
