CREATE SCHEMA IF NOT EXISTS content;
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS lead_qual;
CREATE SCHEMA IF NOT EXISTS talent;
CREATE SCHEMA IF NOT EXISTS engagement;
CREATE SCHEMA IF NOT EXISTS comms;
CREATE SCHEMA IF NOT EXISTS partner;
CREATE SCHEMA IF NOT EXISTS portal_config;
CREATE SCHEMA IF NOT EXISTS interactive;

-- Common enums
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer', 'executive', 'project');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE engagement_stage AS ENUM ('prospect', 'qualified', 'proposal', 'active', 'completed', 'declined');
CREATE TYPE service_line AS ENUM (
    'digital_systems_audit',
    'enterprise_government_systems',
    'ai_automation',
    'strategic_web_platforms',
    'strategy_advisory'
);
CREATE TYPE industry_sector AS ENUM (
    'government',
    'health',
    'financial_services',
    'insurance',
    'retail_commerce',
    'energy',
    'education',
    'ngo_development'
);
CREATE TYPE content_type AS ENUM ('field_note', 'thesis', 'whitepaper');
CREATE TYPE currency_code AS ENUM ('USD', 'GHS', 'EUR');
CREATE TYPE application_status AS ENUM ('received', 'under_review', 'interview_scheduled', 'offer', 'declined', 'withdrawn');
CREATE TYPE notification_channel AS ENUM ('email', 'in_app', 'whatsapp', 'sms');
CREATE TYPE diagnostic_routing AS ENUM ('services', 'labs_collaboration', 'government_digital_excellence', 'decline_with_referral');
