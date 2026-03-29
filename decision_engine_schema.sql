/**
 * Decision Engine & Recommendation System Database Schema
 * 
 * Optimized for Supabase (PostgreSQL)
 * Read-heavy workload with proper indexing
 * 
 * Tables:
 * - user_profiles: User demographic and preference data
 * - decision_logs: Historical decision engine outputs
 * - recommendations: Recommendation catalog and cache
 * - market_data: Real-time market information (bonus)
 * - user_behavior: User activity tracking (bonus)
 */

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search optimization
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. USER_PROFILES TABLE
-- ============================================================================

/**
 * Stores user demographic and preference information
 * Used for personalization and filtering
 * Read-heavy: accessed on every decision engine run
 */
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic user information
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Demographics
  role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'trader', 'supplier', 'admin')),
  region VARCHAR(100) NOT NULL,
  
  -- Farm information
  farm_size_hectares NUMERIC(10, 2),
  farm_location POINT,  -- For geographic queries
  
  -- Preferences
  interests TEXT[] DEFAULT '{}',  -- Array of crop types: ['rice', 'vegetables', 'coffee']
  
  -- Risk profile
  risk_tolerance VARCHAR(20) DEFAULT 'medium' CHECK (risk_tolerance IN ('low', 'medium', 'high')),
  
  -- Communication preferences
  preferred_channel VARCHAR(50) DEFAULT 'email' CHECK (preferred_channel IN ('email', 'sms', 'push', 'in-app')),
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  
  -- Additional metadata (flexible for future use)
  metadata JSONB DEFAULT '{}',
  
  CONSTRAINT email_not_empty CHECK (LENGTH(TRIM(email)) > 0)
);

-- Indexes for user_profiles (read-heavy access patterns)
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_region ON user_profiles(region);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_is_active ON user_profiles(is_active) WHERE is_active = true;
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- GIN index for interests array (common filter)
CREATE INDEX idx_user_profiles_interests ON user_profiles USING GIN(interests);

-- GIST index for geographic queries
CREATE INDEX idx_user_profiles_location ON user_profiles USING GIST(farm_location);

-- JSONB index for flexible metadata queries
CREATE INDEX idx_user_profiles_metadata ON user_profiles USING GIN(metadata);

-- Trigger to update updated_at timestamp
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. DECISION_LOGS TABLE
-- ============================================================================

/**
 * Stores historical decision engine outputs
 * Read-heavy: for analytics, feedback, and ML training
 * Write-once: decisions are immutable
 */
CREATE TABLE IF NOT EXISTS decision_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  
  -- Session information
  session_id VARCHAR(100) UNIQUE NOT NULL,
  
  -- Decision outputs (JSONB for flexible structure)
  insights JSONB NOT NULL,  -- Array of insights
  recommendations JSONB NOT NULL,  -- Array of recommendations
  
  -- Decision metadata
  execution_time_ms INTEGER,
  rules_executed INTEGER,
  rules_triggered TEXT[],
  
  -- Summary
  summary TEXT,
  confidence_score NUMERIC(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  
  -- Timestamps (immutable after insert)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Feedback from user (for ML training)
  user_feedback VARCHAR(50) CHECK (user_feedback IN ('positive', 'negative', 'neutral')),
  feedback_provided_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  
  CONSTRAINT valid_insights CHECK (jsonb_array_length(insights) >= 0),
  CONSTRAINT valid_recommendations CHECK (jsonb_array_length(recommendations) >= 0)
);

-- Indexes for decision_logs (analytics and ML queries)
CREATE INDEX idx_decision_logs_user_id ON decision_logs(user_id);
CREATE INDEX idx_decision_logs_created_at ON decision_logs(created_at DESC);
CREATE INDEX idx_decision_logs_session_id ON decision_logs(session_id);
CREATE INDEX idx_decision_logs_confidence ON decision_logs(confidence_score DESC);
CREATE INDEX idx_decision_logs_user_created ON decision_logs(user_id, created_at DESC);

-- JSONB indexes for insights and recommendations queries
CREATE INDEX idx_decision_logs_insights ON decision_logs USING GIN(insights);
CREATE INDEX idx_decision_logs_recommendations ON decision_logs USING GIN(recommendations);

-- GIN index for rules triggered (common filter)
CREATE INDEX idx_decision_logs_rules_triggered ON decision_logs USING GIN(rules_triggered);

-- Index for feedback analytics
CREATE INDEX idx_decision_logs_user_feedback ON decision_logs(user_feedback) WHERE user_feedback IS NOT NULL;

-- ============================================================================
-- 3. RECOMMENDATIONS TABLE
-- ============================================================================

/**
 * Catalog of recommendations and their metadata
 * Read-heavy: for caching, filtering, and serving recommendations
 */
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic information
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Classification
  type VARCHAR(50) NOT NULL CHECK (type IN ('product', 'action', 'affiliate', 'alert')),
  category VARCHAR(100),
  
  -- Recommendation content (JSONB for flexibility)
  content JSONB NOT NULL,  -- Includes: { score, confidence, reasons, metadata }
  
  -- Target audience
  target_audience VARCHAR(50) DEFAULT 'both' CHECK (target_audience IN ('seller', 'buyer', 'both')),
  
  -- Applicability
  region_applicable TEXT[] DEFAULT '{}',  -- NULL = all regions
  crop_applicable TEXT[] DEFAULT '{}',    -- NULL = all crops
  
  -- Temporal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Usage tracking
  times_shown INTEGER DEFAULT 0,
  times_clicked INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}',
  
  CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
  CONSTRAINT content_not_empty CHECK (jsonb_typeof(content) = 'object')
);

-- Indexes for recommendations (read-heavy catalog access)
CREATE INDEX idx_recommendations_type ON recommendations(type);
CREATE INDEX idx_recommendations_is_active ON recommendations(is_active) WHERE is_active = true;
CREATE INDEX idx_recommendations_created_at ON recommendations(created_at DESC);
CREATE INDEX idx_recommendations_expires_at ON recommendations(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_recommendations_category ON recommendations(category);
CREATE INDEX idx_recommendations_target_audience ON recommendations(target_audience);

-- GIN indexes for array columns (region and crop filtering)
CREATE INDEX idx_recommendations_region_applicable ON recommendations USING GIN(region_applicable);
CREATE INDEX idx_recommendations_crop_applicable ON recommendations USING GIN(crop_applicable);

-- JSONB indexes for content queries
CREATE INDEX idx_recommendations_content ON recommendations USING GIN(content);

-- Full-text search index for title and description
CREATE INDEX idx_recommendations_text_search ON recommendations 
  USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Index for popularity/engagement (for sorting)
CREATE INDEX idx_recommendations_popularity ON recommendations(times_shown DESC NULLS LAST);

-- Trigger to update updated_at
CREATE TRIGGER recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. BONUS: MARKET_DATA TABLE
-- ============================================================================

/**
 * Real-time commodity market data
 * Read-heavy: accessed frequently for insights and recommendations
 */
CREATE TABLE IF NOT EXISTS market_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Commodity information
  commodity_id VARCHAR(50) NOT NULL,
  commodity_name VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  
  -- Price data
  current_price NUMERIC(12, 2) NOT NULL,
  price_unit VARCHAR(20) NOT NULL,  -- 'VND/kg', 'USD/kg', etc.
  price_change_24h NUMERIC(10, 4),  -- Raw change
  price_change_percentage_24h NUMERIC(5, 2),  -- Percentage
  
  -- Market metrics
  demand_level VARCHAR(20) CHECK (demand_level IN ('low', 'medium', 'high')),
  supply_level VARCHAR(20) CHECK (supply_level IN ('low', 'medium', 'high')),
  volatility_index NUMERIC(5, 2),  -- 0-100
  
  -- Trend information
  trend_direction VARCHAR(20) CHECK (trend_direction IN ('uptrend', 'downtrend', 'sideways')),
  seasonality_score NUMERIC(6, 2),  -- -100 to 100
  
  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata
  data_source VARCHAR(100),
  is_verified BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

-- Indexes for market_data (time-series access patterns)
CREATE INDEX idx_market_data_commodity_id ON market_data(commodity_id);
CREATE INDEX idx_market_data_commodity_region ON market_data(commodity_id, region);
CREATE INDEX idx_market_data_timestamp ON market_data(timestamp DESC);
CREATE INDEX idx_market_data_trend ON market_data(trend_direction);
CREATE INDEX idx_market_data_demand_supply ON market_data(demand_level, supply_level);
CREATE INDEX idx_market_data_commodity_timestamp ON market_data(commodity_id, timestamp DESC);

-- Composite index for common query pattern
CREATE INDEX idx_market_data_commodity_latest ON market_data(commodity_id, timestamp DESC) 
  WHERE is_verified = true;

-- ============================================================================
-- 5. BONUS: USER_BEHAVIOR TABLE
-- ============================================================================

/**
 * Tracks user interactions for behavior analysis and ML
 * Write-heavy insert, read-heavy for analytics
 */
CREATE TABLE IF NOT EXISTS user_behavior (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  
  -- Activity information
  event_type VARCHAR(50) NOT NULL,  -- 'recommendation_shown', 'recommendation_clicked', 'product_purchased'
  event_data JSONB DEFAULT '{}',    -- Flexible event details
  
  -- Related records
  decision_log_id UUID REFERENCES decision_logs(id) ON DELETE SET NULL,
  recommendation_id UUID REFERENCES recommendations(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes for user_behavior (activity queries)
CREATE INDEX idx_user_behavior_user_id ON user_behavior(user_id);
CREATE INDEX idx_user_behavior_created_at ON user_behavior(created_at DESC);
CREATE INDEX idx_user_behavior_event_type ON user_behavior(event_type);
CREATE INDEX idx_user_behavior_user_event ON user_behavior(user_id, event_type);
CREATE INDEX idx_user_behavior_user_created ON user_behavior(user_id, created_at DESC);
CREATE INDEX idx_user_behavior_decision_log_id ON user_behavior(decision_log_id);
CREATE INDEX idx_user_behavior_recommendation_id ON user_behavior(recommendation_id);

-- ============================================================================
-- 6. HELPER FUNCTION FOR UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. HELPER FUNCTIONS FOR JSONB
-- ============================================================================

/**
 * Helper function to get array length from JSONB
 */
CREATE OR REPLACE FUNCTION jsonb_array_length(data JSONB)
RETURNS INTEGER AS $$
BEGIN
  IF jsonb_typeof(data) = 'array' THEN
    RETURN jsonb_array_length(data);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 8. MATERIALIZED VIEWS FOR ANALYTICS (Optional)
-- ============================================================================

/**
 * Daily decision statistics by region
 * Refresh daily for analytics dashboard
 */
CREATE MATERIALIZED VIEW mv_decision_stats_daily AS
SELECT
  DATE(dl.created_at) as decision_date,
  up.region,
  COUNT(dl.id) as total_decisions,
  COUNT(DISTINCT dl.user_id) as unique_users,
  AVG(dl.confidence_score) as avg_confidence,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY dl.confidence_score) as median_confidence,
  COUNT(DISTINCT u.user_feedback) FILTER (WHERE u.user_feedback = 'positive') as positive_feedback,
  COUNT(DISTINCT u.user_feedback) FILTER (WHERE u.user_feedback = 'negative') as negative_feedback
FROM decision_logs dl
JOIN user_profiles up ON dl.user_id = up.user_id
LEFT JOIN decision_logs u ON dl.id = u.id
GROUP BY DATE(dl.created_at), up.region;

CREATE INDEX idx_mv_decision_stats_daily_date ON mv_decision_stats_daily(decision_date DESC);
CREATE INDEX idx_mv_decision_stats_daily_region ON mv_decision_stats_daily(region);

-- ============================================================================
-- 9. ROW LEVEL SECURITY (Optional but recommended)
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profiles
CREATE POLICY user_profiles_select_policy ON user_profiles
  FOR SELECT
  USING (auth.uid()::uuid = user_id OR auth.role() = 'admin');

-- Users can only see their own decision logs
CREATE POLICY decision_logs_select_policy ON decision_logs
  FOR SELECT
  USING (auth.uid()::uuid = user_id OR auth.role() = 'admin');

-- All authenticated users can see active recommendations
CREATE POLICY recommendations_select_policy ON recommendations
  FOR SELECT
  USING (is_active = true);

-- ============================================================================
-- 10. SAMPLE DATA (Optional - for testing)
-- ============================================================================

INSERT INTO user_profiles (email, role, region, interests, risk_tolerance, farm_size_hectares)
VALUES 
  ('duc.nguyen@farm.vn', 'farmer', 'Mekong Delta', ARRAY['rice', 'vegetables', 'shrimp'], 'medium', 40.0),
  ('tuan.pham@farm.vn', 'trader', 'Red River Delta', ARRAY['rice', 'corn'], 'low', 25.0),
  ('linh.tran@farm.vn', 'farmer', 'Central Highlands', ARRAY['coffee', 'cocoa', 'pepper'], 'high', 100.0)
ON CONFLICT (email) DO NOTHING;

INSERT INTO recommendations (title, type, category, description, content, target_audience, crop_applicable, region_applicable)
VALUES 
  (
    'Soil Moisture Sensor Pro',
    'product',
    'IoT Equipment',
    'Advanced moisture monitoring for optimal irrigation',
    '{"price": 250000, "currency": "VND", "rating": 4.8, "stock": 15}',
    'seller',
    ARRAY['rice', 'vegetables'],
    ARRAY['Mekong Delta', 'Red River Delta']
  ),
  (
    'Increase Rice Production',
    'action',
    'Strategy',
    'Market conditions favorable for production increase',
    '{"priority": "high", "expectedROI": "35%", "timeline": "next_season"}',
    'seller',
    ARRAY['rice'],
    ARRAY['Mekong Delta', 'Red River Delta']
  ),
  (
    'Weather Monitoring Station',
    'product',
    'IoT Equipment',
    'Real-time climate and weather data collection',
    '{"price": 800000, "currency": "VND", "rating": 4.6, "stock": 8}',
    'both',
    ARRAY['coffee', 'cocoa'],
    ARRAY['Central Highlands']
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. SUMMARY OF INDEXES
-- ============================================================================

/**
 * INDEX SUMMARY:
 * 
 * user_profiles (8 indexes):
 *   - Single column: email, region, role, is_active, created_at
 *   - Array GIN: interests
 *   - Spatial GIST: farm_location
 *   - JSONB GIN: metadata
 *
 * decision_logs (10 indexes):
 *   - Single column: user_id, created_at, session_id, confidence_score
 *   - Composite: user_id+created_at
 *   - Array GIN: rules_triggered
 *   - JSONB GIN: insights, recommendations
 *   - Filtered: user_feedback
 *
 * recommendations (11 indexes):
 *   - Single column: type, is_active, created_at, expires_at, category, target_audience
 *   - Array GIN: region_applicable, crop_applicable
 *   - JSONB GIN: content
 *   - Full-text: text search on title+description
 *   - Popularity: times_shown DESC
 *
 * market_data (7 indexes):
 *   - Single column: commodity_id, timestamp, trend_direction
 *   - Composite: commodity_id+region, commodity_id+timestamp
 *   - Filtered: commodity_id+timestamp (verified only)
 *
 * user_behavior (7 indexes):
 *   - Single column: user_id, created_at, event_type
 *   - Composite: user_id+event_type, user_id+created_at
 *   - Foreign keys: decision_log_id, recommendation_id
 *
 * OPTIMIZATION PATTERNS:
 * - Read-heavy: Lots of selective indexes
 * - Time-series: DESC ordering on timestamps
 * - Array/JSONB: GIN indexes for contains queries
 * - Filtering: Composite indexes for common query patterns
 * - Temporal: Filtered indexes for active/valid records
 */
