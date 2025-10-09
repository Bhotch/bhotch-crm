-- =============================================
-- CANVASSING ENHANCEMENTS MIGRATION
-- Adds support for photos, routes, and enhanced analytics
-- =============================================

-- Add photo storage columns to canvassing_properties
ALTER TABLE canvassing_properties
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_time_to_knock TEXT,
ADD COLUMN IF NOT EXISTS roof_condition TEXT,
ADD COLUMN IF NOT EXISTS home_value NUMERIC(12, 2);

-- Create index on photos for faster queries
CREATE INDEX IF NOT EXISTS idx_canvassing_properties_photos
ON canvassing_properties USING gin(photos);

-- Create index on custom_fields for faster queries
CREATE INDEX IF NOT EXISTS idx_canvassing_properties_custom_fields
ON canvassing_properties USING gin(custom_fields);

-- =============================================
-- TABLE: CANVASSING ROUTES
-- For route planning and optimization
-- =============================================
CREATE TABLE IF NOT EXISTS canvassing_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Route details
    name TEXT NOT NULL,
    description TEXT,
    user_id TEXT, -- Rep who created the route

    -- Route properties (ordered array of property IDs)
    property_ids JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Route statistics
    total_distance_km NUMERIC(10, 2),
    estimated_time_minutes INTEGER,
    status TEXT CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planned',

    -- Completion tracking
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    current_stop_index INTEGER DEFAULT 0,

    -- Route metadata
    optimized BOOLEAN DEFAULT FALSE,
    optimization_algorithm TEXT
);

-- Create indexes for routes
CREATE INDEX IF NOT EXISTS idx_canvassing_routes_user_id ON canvassing_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_canvassing_routes_status ON canvassing_routes(status);
CREATE INDEX IF NOT EXISTS idx_canvassing_routes_created_at ON canvassing_routes(created_at DESC);

-- =============================================
-- TABLE: TEAM LOCATIONS
-- Real-time tracking of team members
-- =============================================
CREATE TABLE IF NOT EXISTS team_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- User identification
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,

    -- Location data
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    accuracy NUMERIC(10, 2),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for team locations
CREATE INDEX IF NOT EXISTS idx_team_locations_user_id ON team_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_team_locations_is_active ON team_locations(is_active);

-- =============================================
-- TABLE: CANVASSING COMPETITIONS
-- Gamification and leaderboards
-- =============================================
CREATE TABLE IF NOT EXISTS canvassing_competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Competition details
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,

    -- Competition type and goals
    competition_type TEXT CHECK (competition_type IN ('knocks', 'appointments', 'sales', 'revenue')) NOT NULL,
    goal_value NUMERIC(12, 2),

    -- Participants (array of user IDs)
    participants JSONB DEFAULT '[]'::jsonb,

    -- Status
    status TEXT CHECK (status IN ('upcoming', 'active', 'completed')) DEFAULT 'upcoming',

    -- Winner tracking
    winner_id TEXT,
    winner_score NUMERIC(12, 2)
);

-- Create indexes for competitions
CREATE INDEX IF NOT EXISTS idx_canvassing_competitions_status ON canvassing_competitions(status);
CREATE INDEX IF NOT EXISTS idx_canvassing_competitions_dates ON canvassing_competitions(start_date, end_date);

-- =============================================
-- TABLE: USER ACHIEVEMENTS
-- Track badges and milestones
-- =============================================
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- User and achievement
    user_id TEXT NOT NULL,
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,

    -- Points and level
    points_earned INTEGER DEFAULT 0,
    level_unlocked INTEGER,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_type ON user_achievements(achievement_type);

-- =============================================
-- TABLE: OFFLINE SYNC QUEUE
-- For offline-first functionality
-- =============================================
CREATE TABLE IF NOT EXISTS offline_sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Action details
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'create', 'update', 'delete'
    table_name TEXT NOT NULL,
    record_id UUID,

    -- Data payload
    data JSONB NOT NULL,

    -- Sync status
    synced BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Create indexes for sync queue
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_user_id ON offline_sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_synced ON offline_sync_queue(synced);

-- =============================================
-- ENHANCED PROPERTY VISITS TABLE
-- Add more tracking fields
-- =============================================
ALTER TABLE property_visits
ADD COLUMN IF NOT EXISTS pitch_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS follow_up_date DATE,
ADD COLUMN IF NOT EXISTS appointment_scheduled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS voice_notes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS weather_condition TEXT,
ADD COLUMN IF NOT EXISTS gps_latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS gps_longitude NUMERIC(11, 8);

-- =============================================
-- FUNCTION: Calculate Territory Statistics
-- =============================================
CREATE OR REPLACE FUNCTION calculate_territory_stats(territory_uuid UUID)
RETURNS TABLE (
    total_properties INTEGER,
    contacted INTEGER,
    interested INTEGER,
    appointments INTEGER,
    sold INTEGER,
    conversion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER AS total_properties,
        COUNT(*) FILTER (WHERE status != 'Not Contacted')::INTEGER AS contacted,
        COUNT(*) FILTER (WHERE status = 'Interested')::INTEGER AS interested,
        COUNT(*) FILTER (WHERE status = 'Appointment')::INTEGER AS appointments,
        COUNT(*) FILTER (WHERE status = 'Sold')::INTEGER AS sold,
        CASE
            WHEN COUNT(*) > 0 THEN
                (COUNT(*) FILTER (WHERE status = 'Sold')::NUMERIC / COUNT(*)::NUMERIC * 100)
            ELSE 0
        END AS conversion_rate
    FROM canvassing_properties
    WHERE territory_id = territory_uuid;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- =============================================
-- FUNCTION: Get User Daily Stats
-- =============================================
CREATE OR REPLACE FUNCTION get_user_daily_stats(user_name TEXT, stat_date DATE)
RETURNS TABLE (
    total_knocks INTEGER,
    interested INTEGER,
    appointments INTEGER,
    sold INTEGER,
    doors_per_deal NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER AS total_knocks,
        COUNT(*) FILTER (WHERE status = 'Interested')::INTEGER AS interested,
        COUNT(*) FILTER (WHERE status = 'Appointment')::INTEGER AS appointments,
        COUNT(*) FILTER (WHERE status = 'Sold')::INTEGER AS sold,
        CASE
            WHEN COUNT(*) FILTER (WHERE status = 'Sold') > 0 THEN
                COUNT(*)::NUMERIC / COUNT(*) FILTER (WHERE status = 'Sold')::NUMERIC
            ELSE 0
        END AS doors_per_deal
    FROM property_visits pv
    WHERE pv.visited_by = user_name
    AND DATE(pv.visited_at) = stat_date;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- =============================================
-- FUNCTION: Optimize Route
-- Returns optimized order of property IDs using nearest neighbor
-- =============================================
CREATE OR REPLACE FUNCTION optimize_route(
    start_lat NUMERIC,
    start_lng NUMERIC,
    property_ids_array UUID[]
)
RETURNS UUID[] AS $$
DECLARE
    result UUID[] := ARRAY[]::UUID[];
    remaining UUID[];
    current_lat NUMERIC := start_lat;
    current_lng NUMERIC := start_lng;
    nearest_id UUID;
    nearest_distance NUMERIC;
    prop_record RECORD;
BEGIN
    remaining := property_ids_array;

    -- Nearest neighbor algorithm
    WHILE array_length(remaining, 1) > 0 LOOP
        nearest_distance := 999999;

        FOR prop_record IN
            SELECT id, latitude, longitude
            FROM canvassing_properties
            WHERE id = ANY(remaining)
        LOOP
            DECLARE
                distance NUMERIC;
            BEGIN
                -- Haversine distance calculation
                distance := (
                    6371 * acos(
                        cos(radians(current_lat)) *
                        cos(radians(prop_record.latitude)) *
                        cos(radians(prop_record.longitude) - radians(current_lng)) +
                        sin(radians(current_lat)) *
                        sin(radians(prop_record.latitude))
                    )
                );

                IF distance < nearest_distance THEN
                    nearest_distance := distance;
                    nearest_id := prop_record.id;
                    current_lat := prop_record.latitude;
                    current_lng := prop_record.longitude;
                END IF;
            END;
        END LOOP;

        result := array_append(result, nearest_id);
        remaining := array_remove(remaining, nearest_id);
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

-- Update territory statistics when properties change
CREATE OR REPLACE FUNCTION update_territory_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE canvassing_territories
        SET
            total_properties = (
                SELECT COUNT(*) FROM canvassing_properties
                WHERE territory_id = NEW.territory_id
            ),
            contacted_count = (
                SELECT COUNT(*) FROM canvassing_properties
                WHERE territory_id = NEW.territory_id
                AND status != 'Not Contacted'
            ),
            updated_at = NOW()
        WHERE id = NEW.territory_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE TRIGGER trg_update_territory_stats
AFTER INSERT OR UPDATE ON canvassing_properties
FOR EACH ROW
EXECUTE FUNCTION update_territory_stats();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================
COMMENT ON TABLE canvassing_routes IS 'Stores planned and active canvassing routes with optimization data';
COMMENT ON TABLE team_locations IS 'Real-time GPS tracking of field sales team members';
COMMENT ON TABLE canvassing_competitions IS 'Gamification competitions and challenges for sales teams';
COMMENT ON TABLE user_achievements IS 'Badges, milestones, and achievements earned by users';
COMMENT ON TABLE offline_sync_queue IS 'Queue for syncing offline changes when connection is restored';

COMMENT ON FUNCTION calculate_territory_stats IS 'Calculates real-time statistics for a given territory';
COMMENT ON FUNCTION get_user_daily_stats IS 'Returns daily performance metrics for a specific user';
COMMENT ON FUNCTION optimize_route IS 'Optimizes route order using nearest neighbor algorithm';
