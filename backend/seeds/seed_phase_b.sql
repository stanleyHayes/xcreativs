-- Seed Phase B data: engagements, milestones, deliverables, decisions, risks, team

-- Engagement: 24H+ Authority
INSERT INTO engagement.engagements (id, slug, client_id, client_name, title, description, sector, service_line, stage, start_date, target_end_date, currency_preference, is_white_label, created_at, updated_at)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '24h-economy-authority-2026',
    (SELECT id FROM identity.users WHERE email = 'test3@xcreativs.com'),
    '24-Hour Economy Authority of Ghana',
    '24H+ Authority Intelligence Architecture',
    'Design and build a national intelligence platform for the 24-Hour Economy Authority to coordinate policy, investment, and enforcement across Ghana.',
    'government',
    'enterprise_government_systems',
    'active',
    '2026-01-15',
    '2027-01-15',
    'USD',
    FALSE,
    NOW(),
    NOW()
);

-- Engagement: Fastcare ILIVVON
INSERT INTO engagement.engagements (id, slug, client_id, client_name, title, description, sector, service_line, stage, start_date, target_end_date, currency_preference, is_white_label, created_at, updated_at)
VALUES (
    'b2c3d4e5-f6a7-8901-bcde-f23456789012',
    'fastcare-ilivvon-2026',
    (SELECT id FROM identity.users WHERE email = 'test3@xcreativs.com'),
    'Fastcare Clinics',
    'ILIVVON Deployment for Fastcare',
    'Deploy the ILIVVON health intelligence platform across Fastcare clinic network to unify patient data and enable predictive care.',
    'health',
    'ai_automation',
    'active',
    '2025-09-01',
    '2026-09-01',
    'USD',
    FALSE,
    NOW(),
    NOW()
);

-- Milestones for 24H+ Authority
INSERT INTO engagement.milestones (engagement_id, title, description, due_date, status, sort_order) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Discovery & Governance Design', 'Stakeholder mapping, governance framework, and data sovereignty review.', '2026-02-28', 'completed', 1),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Architecture Blueprint', 'System architecture, tech stack selection, and security model.', '2026-04-30', 'completed', 2),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'MVP Platform Build', 'Core intelligence engine, donor tracking, and regulatory coordination.', '2026-08-31', 'in_progress', 3),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Pilot Launch', 'Live deployment with 3 pilot agencies and training.', '2026-10-31', 'pending', 4),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'National Rollout', 'Full deployment across all 16 regions.', '2027-01-15', 'pending', 5);

-- Deliverables for 24H+ Authority
INSERT INTO engagement.deliverables (engagement_id, title, description, version, file_url, signature_status, visibility_role, status, created_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Discovery Report', 'Findings from 6-week discovery phase.', 1, 'https://assets.xcreativs.com/deliverables/24h-discovery.pdf', 'signed', 'viewer', 'published', NOW()),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Architecture Blueprint v2', 'Revised architecture after security review.', 2, 'https://assets.xcreativs.com/deliverables/24h-arch-v2.pdf', 'signed', 'viewer', 'published', NOW()),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'MVP Technical Spec', 'Internal technical specification for MVP build.', 1, 'https://assets.xcreativs.com/deliverables/24h-mvp-spec.pdf', 'unsigned', 'project', 'draft', NOW());

-- Decisions for 24H+ Authority
INSERT INTO engagement.decisions (engagement_id, title, description, rationale, alternatives_considered, status, decided_at, created_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Use PostgreSQL as primary datastore', 'Selected PostgreSQL over MongoDB for ACID compliance and sovereignty.', 'Government data requires transactional integrity and on-premise deployment capability.', 'MongoDB, MySQL', 'approved', '2026-02-15', NOW()),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Deploy in Ghana datacenter', 'All production infrastructure to be hosted in Ghana.', 'Data sovereignty requirement from client procurement.', 'AWS Europe, AWS US', 'approved', '2026-03-01', NOW());

-- Risks for 24H+ Authority
INSERT INTO engagement.risks (engagement_id, title, description, mitigation_plan, severity, status, created_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Procurement delays', 'Government procurement cycles may delay infrastructure provisioning.', 'Early engagement with NITA and pre-approved vendor list.', 'high', 'open', NOW()),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Stakeholder churn', 'Key stakeholders may change after election cycle.', 'Document all decisions in decision log; knowledge transfer protocols.', 'medium', 'open', NOW()),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Integration complexity', 'Legacy systems at participating agencies have poor documentation.', 'Allocate 4 weeks for integration discovery per agency.', 'medium', 'open', NOW());

-- Capability Deliveries for 24H+ Authority
INSERT INTO engagement.capability_deliveries (engagement_id, capability_name, status, sort_order, created_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Donor Intelligence Engine', 'delivered', 1, NOW()),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Regulatory Coordination Layer', 'in_flight', 2, NOW()),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Investor Portal', 'queued', 3, NOW()),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'AI Policy Copilot', 'deferred', 4, NOW());

-- Budget Lines for 24H+ Authority
INSERT INTO engagement.budget_lines (engagement_id, item, allocated_usd, allocated_ghs, spent_usd, spent_ghs, category) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Platform Engineering', 150000.00, 1875000.00, 45000.00, 562500.00, 'Development'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Infrastructure & Hosting', 35000.00, 437500.00, 12000.00, 150000.00, 'Infrastructure'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Security Audit', 25000.00, 312500.00, 0.00, 0.00, 'Security');

-- Team Members for 24H+ Authority
INSERT INTO engagement.team_members (engagement_id, name, role, email, availability_status, is_xcreativs, created_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Shay Ford', 'Engagement Lead', 'shay@xcreativs.com', 'available', TRUE, NOW()),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Dr. Ama Mensah', 'Technical Architect', 'ama@xcreativs.com', 'available', TRUE, NOW()),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Kofi Asante', 'Client Product Owner', 'kofi.asante@24h.gov.gh', 'available', FALSE, NOW());

-- Support Tickets for 24H+ Authority
INSERT INTO engagement.support_tickets (engagement_id, title, description, status, priority, sla_target_hours, created_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'API latency spike from Accra', 'Client reports 3-5s response times during peak hours.', 'open', 'high', 24, NOW()),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Request for additional dashboard widget', 'Ministry of Finance wants a custom revenue widget.', 'open', 'medium', 72, NOW());

-- Activity Feed for 24H+ Authority
INSERT INTO comms.activity_feed (engagement_id, actor_name, action, resource_type, resource_id, metadata, created_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Shay Ford', 'created', 'deliverable', 'discovery-report', '{"title":"Discovery Report"}', NOW() - INTERVAL '2 days'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Dr. Ama Mensah', 'approved', 'decision', 'postgres-primary', '{"title":"Use PostgreSQL as primary datastore"}', NOW() - INTERVAL '1 day'),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Kofi Asante', 'commented', 'risk', 'procurement-delays', '{"title":"Procurement delays"}', NOW() - INTERVAL '6 hours');
