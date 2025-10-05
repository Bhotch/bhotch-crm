-- =============================================
-- BHOTCH CRM COMPLETE SCHEMA
-- Migration from Google Sheets to PostgreSQL
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE 1: LEADS (Primary customer data)
-- Replaces: Bhotchleads Google Sheet
-- =============================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Original Google Sheets columns mapped 1:1
    date_added DATE DEFAULT CURRENT_DATE,
    customer_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    email TEXT,
    address TEXT,

    -- Geolocation for Map tab
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),

    -- Lead classification
    quality TEXT CHECK (quality IN ('Hot', 'Warm', 'Cold')),
    disposition TEXT CHECK (disposition IN (
        'New', 'Scheduled', 'Insurance', 'Quoted',
        'Follow Up', 'Closed Sold', 'Closed Lost'
    )),
    lead_source TEXT,
    status TEXT,

    -- Property information
    roof_age INTEGER,
    roof_type TEXT,

    -- Measurements (from sheets columns)
    sqft NUMERIC(10, 2),
    ridge_lf NUMERIC(10, 2),
    valley_lf NUMERIC(10, 2),
    eaves_lf NUMERIC(10, 2),

    -- Component counts
    pipes_1_5 INTEGER DEFAULT 0,
    pipes_2 INTEGER DEFAULT 0,
    pipes_3 INTEGER DEFAULT 0,
    pipes_4 INTEGER DEFAULT 0,
    vents INTEGER DEFAULT 0,
    gutters_lf NUMERIC(10, 2),

    -- Financial
    dabella_quote NUMERIC(12, 2),

    -- Additional fields
    notes TEXT,
    last_contact_date DATE,

    -- Soft delete support
    deleted_at TIMESTAMPTZ
);

-- =============================================
-- TABLE 2: JOB COUNTS (Enhanced measurements)
-- Replaces: Job Count Google Sheet
-- =============================================
CREATE TABLE job_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Foreign key to leads
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

    -- Core measurements
    sqft NUMERIC(10, 2) NOT NULL,
    ridge_lf NUMERIC(10, 2),
    valley_lf NUMERIC(10, 2),
    eaves_lf NUMERIC(10, 2),

    -- Ventilation details
    ridge_vents INTEGER DEFAULT 0,
    turbine_vents INTEGER DEFAULT 0,
    rime_flow NUMERIC(10, 2),

    -- Pipe specifications (matching exact sheet columns)
    pipe_1_5_inch INTEGER DEFAULT 0,
    pipe_2_inch INTEGER DEFAULT 0,
    pipe_3_inch INTEGER DEFAULT 0,
    pipe_4_inch INTEGER DEFAULT 0,

    -- Roof features
    gables INTEGER DEFAULT 0,
    turtle_backs INTEGER DEFAULT 0,
    satellite BOOLEAN DEFAULT FALSE,
    chimney BOOLEAN DEFAULT FALSE,
    solar BOOLEAN DEFAULT FALSE,
    swamp_cooler BOOLEAN DEFAULT FALSE,

    -- Gutters & drainage
    gutter_lf NUMERIC(10, 2),
    downspouts INTEGER DEFAULT 0,
    gutter_guard_lf NUMERIC(10, 2),

    -- Lighting
    permanent_lighting TEXT,

    -- Quote information
    quote_amount NUMERIC(12, 2),
    quote_notes TEXT
);

-- =============================================
-- TABLE 3: COMMUNICATIONS (Google Voice integration)
-- Supports: Communications Tab
-- =============================================
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

    -- Communication details
    type TEXT CHECK (type IN ('call', 'sms', 'email')) NOT NULL,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    outcome TEXT,
    message_content TEXT,
    subject TEXT, -- for emails

    -- Duration tracking
    duration_seconds INTEGER, -- for calls

    -- Google Voice integration
    google_voice_id TEXT,

    -- Metadata
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE 4: CANVASSING TERRITORIES
-- Supports: Canvassing Tab
-- =============================================
CREATE TABLE canvassing_territories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Territory details
    name TEXT NOT NULL,
    description TEXT,
    boundary_geojson JSONB, -- Polygon coordinates
    color TEXT, -- Hex color for map display

    -- Status
    active BOOLEAN DEFAULT TRUE,

    -- Statistics (computed)
    area_sq_miles NUMERIC(10, 4),
    total_properties INTEGER DEFAULT 0,
    contacted_count INTEGER DEFAULT 0
);

-- =============================================
-- TABLE 5: CANVASSING PROPERTIES
-- Supports: Canvassing Tab property tracking
-- =============================================
CREATE TABLE canvassing_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Territory relationship
    territory_id UUID REFERENCES canvassing_territories(id),

    -- Location
    address TEXT NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,

    -- Status tracking (matches CanvassingView.jsx statuses)
    status TEXT CHECK (status IN (
        'Not Contacted', 'Interested', 'Appointment',
        'Sold', 'Callback', 'Not Home', 'Not Interested', 'DNC'
    )) DEFAULT 'Not Contacted',

    -- Visit tracking
    notes TEXT,
    last_visited_at TIMESTAMPTZ,
    visit_count INTEGER DEFAULT 0,

    -- Owner information (if collected)
    owner_name TEXT,
    owner_phone TEXT
);

-- =============================================
-- TABLE 6: PROPERTY VISITS (Detailed history)
-- Supports: Canvassing analytics
-- =============================================
CREATE TABLE property_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Relationships
    property_id UUID REFERENCES canvassing_properties(id) ON DELETE CASCADE,
    territory_id UUID REFERENCES canvassing_territories(id),

    -- Visit details
    visit_date TIMESTAMPTZ DEFAULT NOW(),
    outcome TEXT,
    notes TEXT,
    duration_minutes INTEGER,

    -- Weather conditions (from weatherService.js)
    weather_conditions JSONB
);

-- =============================================
-- TABLE 7: PROPERTY DESIGNS (360° Visualizations)
-- Supports: 360° Designer Tab
-- =============================================
CREATE TABLE property_designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Relationship to lead
    lead_id UUID REFERENCES leads(id),

    -- Design metadata
    design_name TEXT NOT NULL,
    design_type TEXT, -- 'shingles', 'lighting', 'full'

    -- Design data (from Visualization360 store)
    design_data JSONB NOT NULL,

    -- Photos (8-photo workflow from PhotoCapture)
    photos JSONB, -- Array of base64/URLs

    -- Material selections (from MalarkeyShingleSystem)
    selected_materials JSONB,

    -- Cost estimation
    cost_estimate NUMERIC(12, 2),

    -- Status
    status TEXT DEFAULT 'draft', -- draft, presented, approved
    presented_date TIMESTAMPTZ
);

-- =============================================
-- TABLE 8: CALENDAR EVENTS (Google Calendar sync)
-- Supports: Calendar Tab
-- =============================================
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Google Calendar integration
    google_event_id TEXT UNIQUE,

    -- Event details
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,

    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    timezone TEXT DEFAULT 'America/Denver',

    -- Relationships
    lead_id UUID REFERENCES leads(id),

    -- Status
    status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, tentative

    -- Sync tracking
    last_synced_at TIMESTAMPTZ
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- Critical for Dashboard and filtering operations
-- =============================================

-- Leads table indexes
CREATE INDEX idx_leads_quality ON leads(quality) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_disposition ON leads(disposition) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_location ON leads(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_leads_phone ON leads(phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX idx_leads_email ON leads(email) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_customer_name ON leads(customer_name);

-- Full-text search on leads
CREATE INDEX idx_leads_search ON leads USING GIN (
    to_tsvector('english',
        COALESCE(customer_name, '') || ' ' ||
        COALESCE(email, '') || ' ' ||
        COALESCE(address, '')
    )
);

-- Job counts indexes
CREATE INDEX idx_job_counts_lead_id ON job_counts(lead_id);
CREATE INDEX idx_job_counts_created_at ON job_counts(created_at DESC);

-- Communications indexes
CREATE INDEX idx_communications_lead_id ON communications(lead_id);
CREATE INDEX idx_communications_type ON communications(type);
CREATE INDEX idx_communications_created_at ON communications(created_at DESC);

-- Canvassing indexes
CREATE INDEX idx_territories_active ON canvassing_territories(active);
CREATE INDEX idx_canvassing_properties_territory ON canvassing_properties(territory_id);
CREATE INDEX idx_canvassing_properties_status ON canvassing_properties(status);
CREATE INDEX idx_canvassing_properties_location ON canvassing_properties(latitude, longitude);
CREATE INDEX idx_property_visits_property_id ON property_visits(property_id);
CREATE INDEX idx_property_visits_date ON property_visits(visit_date DESC);

-- Property designs indexes
CREATE INDEX idx_property_designs_lead_id ON property_designs(lead_id);
CREATE INDEX idx_property_designs_status ON property_designs(status);

-- Calendar events indexes
CREATE INDEX idx_calendar_events_lead_id ON calendar_events(lead_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_google_id ON calendar_events(google_event_id);

-- =============================================
-- FUNCTIONS FOR AUTOMATION
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_counts_updated_at BEFORE UPDATE ON job_counts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_territories_updated_at BEFORE UPDATE ON canvassing_territories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON canvassing_properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_designs_updated_at BEFORE UPDATE ON property_designs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-increment visit_count
CREATE OR REPLACE FUNCTION increment_property_visit_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE canvassing_properties
    SET visit_count = visit_count + 1,
        last_visited_at = NEW.visit_date
    WHERE id = NEW.property_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_visit_count AFTER INSERT ON property_visits
    FOR EACH ROW EXECUTE FUNCTION increment_property_visit_count();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- Start permissive for migration, tighten later
-- =============================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvassing_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvassing_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated users (single-user CRM)
CREATE POLICY "Enable all for authenticated users" ON leads
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON job_counts
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON communications
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON canvassing_territories
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON canvassing_properties
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON property_visits
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON property_designs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON calendar_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- VIEWS FOR DASHBOARD
-- Pre-computed aggregations for performance
-- =============================================

CREATE VIEW dashboard_stats AS
SELECT
    -- Lead statistics
    COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_leads,
    COUNT(*) FILTER (WHERE quality = 'Hot' AND deleted_at IS NULL) AS hot_leads,
    COUNT(*) FILTER (WHERE disposition = 'Quoted' AND deleted_at IS NULL) AS quoted_leads,
    SUM(dabella_quote) FILTER (WHERE deleted_at IS NULL) AS total_quote_value,

    -- Disposition breakdown
    COUNT(*) FILTER (WHERE disposition = 'Scheduled' AND deleted_at IS NULL) AS scheduled_count,
    COUNT(*) FILTER (WHERE disposition = 'Follow Up' AND deleted_at IS NULL) AS follow_up_count,
    COUNT(*) FILTER (WHERE disposition = 'Insurance' AND deleted_at IS NULL) AS insurance_count,
    COUNT(*) FILTER (WHERE disposition = 'Closed Sold' AND deleted_at IS NULL) AS closed_sold_count,

    -- Conversion rate
    ROUND(
        100.0 * COUNT(*) FILTER (WHERE disposition = 'Closed Sold' AND deleted_at IS NULL) /
        NULLIF(COUNT(*) FILTER (WHERE deleted_at IS NULL), 0),
        2
    ) AS conversion_rate
FROM leads;

-- =============================================
-- INITIAL DATA SEEDING (Optional test data)
-- =============================================

-- Sample lead for testing
INSERT INTO leads (customer_name, first_name, last_name, phone_number, email, address, quality, disposition)
VALUES ('Test Customer', 'John', 'Doe', '555-0123', 'john.doe@example.com', '123 Main St, Denver, CO', 'Warm', 'New')
RETURNING id;
