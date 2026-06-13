-- Drop all indexes created in 015_indexes.up.sql

-- Content
DROP INDEX IF EXISTS content.idx_services_status;
DROP INDEX IF EXISTS content.idx_labs_products_status;
DROP INDEX IF EXISTS content.idx_industries_status;
DROP INDEX IF EXISTS content.idx_case_dossiers_status;
DROP INDEX IF EXISTS content.idx_insights_status;
DROP INDEX IF EXISTS content.idx_press_releases_status;
DROP INDEX IF EXISTS content.idx_reading_list_status;
DROP INDEX IF EXISTS content.idx_audio_briefs_status;
DROP INDEX IF EXISTS content.idx_webinars_scheduled_at;

-- Identity
DROP INDEX IF EXISTS identity.idx_users_email;
DROP INDEX IF EXISTS identity.idx_users_role;
DROP INDEX IF EXISTS identity.idx_sessions_user_id;
DROP INDEX IF EXISTS identity.idx_sessions_refresh_token;
DROP INDEX IF EXISTS identity.idx_api_keys_hash;
DROP INDEX IF EXISTS identity.idx_api_keys_user_id;
DROP INDEX IF EXISTS identity.idx_audit_log_user_id;
DROP INDEX IF EXISTS identity.idx_audit_log_created_at;

-- Engagement
DROP INDEX IF EXISTS engagement.idx_engagements_client_id;
DROP INDEX IF EXISTS engagement.idx_engagements_stage;
DROP INDEX IF EXISTS engagement.idx_milestones_engagement_id;
DROP INDEX IF EXISTS engagement.idx_deliverables_engagement_id;
DROP INDEX IF EXISTS engagement.idx_decisions_engagement_id;
DROP INDEX IF EXISTS engagement.idx_risks_engagement_id;
DROP INDEX IF EXISTS engagement.idx_team_members_engagement_id;
DROP INDEX IF EXISTS engagement.idx_invoices_engagement_id;
DROP INDEX IF EXISTS engagement.idx_capability_deliveries_engagement_id;
DROP INDEX IF EXISTS engagement.idx_document_library_engagement_id;
DROP INDEX IF EXISTS engagement.idx_reports_engagement_id;
DROP INDEX IF EXISTS engagement.idx_budget_lines_engagement_id;
DROP INDEX IF EXISTS engagement.idx_approval_workflows_engagement_id;

-- Communications
DROP INDEX IF EXISTS comms.idx_threads_engagement_id;
DROP INDEX IF EXISTS comms.idx_comments_thread_id;
DROP INDEX IF EXISTS comms.idx_notifications_user_id;
DROP INDEX IF EXISTS comms.idx_notifications_is_read;

-- Lead qualification
DROP INDEX IF EXISTS lead_qual.idx_diagnostics_email;
DROP INDEX IF EXISTS lead_qual.idx_diagnostics_created_at;
DROP INDEX IF EXISTS lead_qual.idx_scope_estimates_email;
DROP INDEX IF EXISTS lead_qual.idx_rfp_submissions_contact_email;
DROP INDEX IF EXISTS lead_qual.idx_consultation_bookings_email;
DROP INDEX IF EXISTS lead_qual.idx_consultation_bookings_status;
DROP INDEX IF EXISTS lead_qual.idx_consultation_bookings_created_at;
DROP INDEX IF EXISTS lead_qual.idx_newsletter_subscribers_email;
DROP INDEX IF EXISTS lead_qual.idx_signature_requests_status;
DROP INDEX IF EXISTS lead_qual.idx_signature_requests_created_by;

-- Interactive
DROP INDEX IF EXISTS interactive.idx_chat_sessions_user_id;
DROP INDEX IF EXISTS interactive.idx_chat_messages_session_id;

-- Talent
DROP INDEX IF EXISTS talent.idx_job_roles_is_open;
DROP INDEX IF EXISTS talent.idx_applications_applicant_email;
DROP INDEX IF EXISTS talent.idx_talent_network_email;

-- Partner
DROP INDEX IF EXISTS partner.idx_partners_status;
DROP INDEX IF EXISTS partner.idx_partner_applications_email;
DROP INDEX IF EXISTS partner.idx_partner_applications_status;
DROP INDEX IF EXISTS partner.idx_referrals_partner_id;
DROP INDEX IF EXISTS partner.idx_distribution_orders_partner_id;
DROP INDEX IF EXISTS partner.idx_partner_users_partner_id;

-- Portal config
DROP INDEX IF EXISTS portal_config.idx_client_themes_engagement_id;
