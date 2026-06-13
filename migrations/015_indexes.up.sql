-- Performance indexes for frequently queried tables

-- Content tables
CREATE INDEX IF NOT EXISTS idx_services_status ON content.services(status);
CREATE INDEX IF NOT EXISTS idx_labs_products_status ON content.labs_products(status);
CREATE INDEX IF NOT EXISTS idx_industries_status ON content.industries(status);
CREATE INDEX IF NOT EXISTS idx_case_dossiers_status ON content.case_dossiers(status);
CREATE INDEX IF NOT EXISTS idx_insights_status ON content.insights(status);
CREATE INDEX IF NOT EXISTS idx_press_releases_status ON content.press_releases(status);
CREATE INDEX IF NOT EXISTS idx_reading_list_status ON content.reading_list_items(status);
CREATE INDEX IF NOT EXISTS idx_audio_briefs_status ON content.audio_briefs(status);
CREATE INDEX IF NOT EXISTS idx_webinars_scheduled_at ON content.webinars(scheduled_at);

-- Identity tables
CREATE INDEX IF NOT EXISTS idx_users_email ON identity.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON identity.users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON identity.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON identity.sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON identity.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON identity.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON identity.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON identity.audit_log(created_at);

-- Engagement tables
CREATE INDEX IF NOT EXISTS idx_engagements_client_id ON engagement.engagements(client_id);
CREATE INDEX IF NOT EXISTS idx_engagements_stage ON engagement.engagements(stage);
CREATE INDEX IF NOT EXISTS idx_milestones_engagement_id ON engagement.milestones(engagement_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_engagement_id ON engagement.deliverables(engagement_id);
CREATE INDEX IF NOT EXISTS idx_decisions_engagement_id ON engagement.decisions(engagement_id);
CREATE INDEX IF NOT EXISTS idx_risks_engagement_id ON engagement.risks(engagement_id);
CREATE INDEX IF NOT EXISTS idx_team_members_engagement_id ON engagement.team_members(engagement_id);
CREATE INDEX IF NOT EXISTS idx_invoices_engagement_id ON engagement.invoices(engagement_id);
CREATE INDEX IF NOT EXISTS idx_capability_deliveries_engagement_id ON engagement.capability_deliveries(engagement_id);
CREATE INDEX IF NOT EXISTS idx_document_library_engagement_id ON engagement.document_library(engagement_id);
CREATE INDEX IF NOT EXISTS idx_reports_engagement_id ON engagement.reports(engagement_id);
CREATE INDEX IF NOT EXISTS idx_budget_lines_engagement_id ON engagement.budget_lines(engagement_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_engagement_id ON engagement.approval_workflows(engagement_id);

-- Communications tables
CREATE INDEX IF NOT EXISTS idx_threads_engagement_id ON comms.threads(engagement_id);
CREATE INDEX IF NOT EXISTS idx_comments_thread_id ON comms.comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON comms.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON comms.notifications(is_read);

-- Lead qualification tables
CREATE INDEX IF NOT EXISTS idx_diagnostics_email ON lead_qual.diagnostics(email);
CREATE INDEX IF NOT EXISTS idx_diagnostics_created_at ON lead_qual.diagnostics(created_at);
CREATE INDEX IF NOT EXISTS idx_scope_estimates_email ON lead_qual.scope_estimates(email);
CREATE INDEX IF NOT EXISTS idx_rfp_submissions_contact_email ON lead_qual.rfp_submissions(contact_email);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_email ON lead_qual.consultation_bookings(email);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_status ON lead_qual.consultation_bookings(status);
CREATE INDEX IF NOT EXISTS idx_consultation_bookings_created_at ON lead_qual.consultation_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON lead_qual.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_signature_requests_status ON lead_qual.signature_requests(status);
CREATE INDEX IF NOT EXISTS idx_signature_requests_created_by ON lead_qual.signature_requests(created_by);

-- Interactive tables
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON interactive.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON interactive.chat_messages(session_id);

-- Talent tables
CREATE INDEX IF NOT EXISTS idx_job_roles_is_open ON talent.job_roles(is_open);
CREATE INDEX IF NOT EXISTS idx_applications_applicant_email ON talent.applications(applicant_email);
CREATE INDEX IF NOT EXISTS idx_talent_network_email ON talent.talent_network(email);

-- Partner tables
CREATE INDEX IF NOT EXISTS idx_partners_status ON partner.partners(status);
CREATE INDEX IF NOT EXISTS idx_partner_applications_email ON partner.applications(contact_email);
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner.applications(status);
CREATE INDEX IF NOT EXISTS idx_referrals_partner_id ON partner.referrals(partner_id);
CREATE INDEX IF NOT EXISTS idx_distribution_orders_partner_id ON partner.distribution_orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_users_partner_id ON partner.partner_users(partner_id);

-- Portal config
CREATE INDEX IF NOT EXISTS idx_client_themes_engagement_id ON portal_config.client_themes(engagement_id);
