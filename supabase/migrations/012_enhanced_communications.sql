-- =============================================
-- ENHANCED COMMUNICATIONS SYSTEM
-- Support for SMS, Call, and Email dispositions
-- Google Voice integration for brandon@rimehq.net (801-228-0678)
-- =============================================

-- Add new columns for enhanced communication tracking
ALTER TABLE communications
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS email_from TEXT,
ADD COLUMN IF NOT EXISTS email_to TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS google_voice_account TEXT DEFAULT 'brandon@rimehq.net',
ADD COLUMN IF NOT EXISTS google_voice_number TEXT DEFAULT '801-228-0678',
ADD COLUMN IF NOT EXISTS disposition TEXT,
ADD COLUMN IF NOT EXISTS follow_up_date DATE,
ADD COLUMN IF NOT EXISTS contact_method TEXT;

-- Update type constraint to ensure valid communication types
ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_type_check;
ALTER TABLE communications ADD CONSTRAINT communications_type_check
CHECK (type IN ('call', 'sms', 'email'));

-- Create disposition check constraint
ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_disposition_check;
ALTER TABLE communications ADD CONSTRAINT communications_disposition_check
CHECK (
  disposition IN (
    -- SMS dispositions
    'Sent SMS', 'Received SMS', 'SMS Follow-up Needed', 'SMS Not Interested',
    -- Call dispositions
    'No Answer', 'Left Voicemail', 'Call Follow-up Needed', 'Call Not Interested',
    'Call Completed', 'Spoke with Customer',
    -- Email dispositions
    'Email Sent', 'Email Received', 'Email Follow-up Needed', 'Email Not Interested',
    'Email Bounced', 'Email Opened', 'Email Replied'
  )
  OR disposition IS NULL
);

-- Create index on disposition for filtering
CREATE INDEX IF NOT EXISTS idx_communications_disposition ON communications(disposition);

-- Create index on follow_up_date for reminders
CREATE INDEX IF NOT EXISTS idx_communications_follow_up ON communications(follow_up_date)
WHERE follow_up_date IS NOT NULL;

-- Create index on phone_number for quick lookups
CREATE INDEX IF NOT EXISTS idx_communications_phone ON communications(phone_number)
WHERE phone_number IS NOT NULL;

-- Create index on email fields
CREATE INDEX IF NOT EXISTS idx_communications_email_to ON communications(email_to)
WHERE email_to IS NOT NULL;

-- Create a view for communication summary by customer
CREATE OR REPLACE VIEW communication_summary_by_customer AS
SELECT
  l.id AS lead_id,
  l.customer_name,
  l.phone_number,
  l.email,
  COUNT(c.id) AS total_communications,
  COUNT(c.id) FILTER (WHERE c.type = 'call') AS total_calls,
  COUNT(c.id) FILTER (WHERE c.type = 'sms') AS total_sms,
  COUNT(c.id) FILTER (WHERE c.type = 'email') AS total_emails,
  MAX(c.timestamp) AS last_contact_date,
  COUNT(c.id) FILTER (WHERE c.disposition LIKE '%Follow-up Needed%') AS pending_follow_ups
FROM leads l
LEFT JOIN communications c ON l.id = c.lead_id
WHERE l.deleted_at IS NULL
GROUP BY l.id, l.customer_name, l.phone_number, l.email;

-- Create a function to automatically set follow_up_date for follow-up dispositions
CREATE OR REPLACE FUNCTION set_follow_up_date()
RETURNS TRIGGER AS $$
BEGIN
  -- If disposition includes 'Follow-up' and no follow_up_date is set, set it to tomorrow
  IF NEW.disposition LIKE '%Follow-up%' AND NEW.follow_up_date IS NULL THEN
    NEW.follow_up_date := CURRENT_DATE + INTERVAL '1 day';
  END IF;

  -- Set contact_method based on type
  IF NEW.contact_method IS NULL THEN
    NEW.contact_method := NEW.type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Create trigger for automatic follow-up date setting
DROP TRIGGER IF EXISTS trigger_set_follow_up_date ON communications;
CREATE TRIGGER trigger_set_follow_up_date
BEFORE INSERT OR UPDATE ON communications
FOR EACH ROW
EXECUTE FUNCTION set_follow_up_date();

-- Update last_contact_date on leads table when communication is added
CREATE OR REPLACE FUNCTION update_lead_last_contact()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads
  SET last_contact_date = NEW.timestamp::DATE
  WHERE id = NEW.lead_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Create trigger to update lead last contact date
DROP TRIGGER IF EXISTS trigger_update_lead_last_contact ON communications;
CREATE TRIGGER trigger_update_lead_last_contact
AFTER INSERT ON communications
FOR EACH ROW
EXECUTE FUNCTION update_lead_last_contact();

-- Create view for follow-up reminders
CREATE OR REPLACE VIEW follow_up_reminders AS
SELECT
  c.id,
  c.lead_id,
  l.customer_name,
  l.phone_number,
  l.email,
  l.address,
  c.type,
  c.disposition,
  c.follow_up_date,
  c.message_content AS last_notes,
  c.timestamp AS last_contact,
  CASE
    WHEN c.follow_up_date = CURRENT_DATE THEN 'Today'
    WHEN c.follow_up_date < CURRENT_DATE THEN 'Overdue'
    WHEN c.follow_up_date = CURRENT_DATE + INTERVAL '1 day' THEN 'Tomorrow'
    ELSE 'Upcoming'
  END AS urgency
FROM communications c
JOIN leads l ON c.lead_id = l.id
WHERE c.follow_up_date IS NOT NULL
  AND c.disposition LIKE '%Follow-up%'
  AND l.deleted_at IS NULL
ORDER BY c.follow_up_date ASC;

-- Grant permissions for views
GRANT SELECT ON communication_summary_by_customer TO authenticated;
GRANT SELECT ON follow_up_reminders TO authenticated;

COMMENT ON TABLE communications IS 'Enhanced communication tracking with SMS, Call, and Email support. Integrated with Google Voice (brandon@rimehq.net, 801-228-0678).';
COMMENT ON COLUMN communications.disposition IS 'Communication outcome/disposition. Supports SMS, Call, and Email specific dispositions with follow-up tracking.';
COMMENT ON COLUMN communications.google_voice_account IS 'Google Voice account used (default: brandon@rimehq.net)';
COMMENT ON COLUMN communications.google_voice_number IS 'Google Voice phone number (default: 801-228-0678)';
COMMENT ON VIEW follow_up_reminders IS 'Active follow-up tasks organized by urgency';
