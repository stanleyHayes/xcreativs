-- Demo content for the gated-download (theses) and audio podcast feed features.
-- Idempotent: safe to run repeatedly. Content-only, no cross-schema FKs.

-- Insights: one gated thesis + one open field note
INSERT INTO content.insights
  (slug, content_type, title, title_fr, summary, summary_fr, body, body_fr, author_name, author_title, tags, is_gated, gated_pdf_url, audio_url, published_at, status)
VALUES
  (
    'sovereign-digital-systems-thesis',
    'thesis',
    'The Sovereign Digital Systems Thesis',
    'La thèse des systèmes numériques souverains',
    'Why West African governments and enterprises should own their digital infrastructure end to end — and a framework for getting there.',
    'Pourquoi les gouvernements et entreprises d''Afrique de l''Ouest devraient posséder leur infrastructure numérique de bout en bout.',
    'This thesis argues that data residency, operational control, and the right to export are non-negotiable for national-scale systems. The full argument, with the maturity framework and procurement playbook, is in the downloadable PDF.',
    'Cette thèse soutient que la résidence des données, le contrôle opérationnel et le droit d''exportation sont non négociables.',
    'Kwame Mensah',
    'Principal, Systems Strategy',
    '["sovereignty", "policy", "architecture"]'::jsonb,
    TRUE,
    'https://cdn.xcreativs.com/theses/sovereign-digital-systems-thesis.pdf',
    '',
    now() - interval '10 days',
    'published'
  ),
  (
    'notes-on-edge-latency-accra',
    'field_note',
    'Field Notes: Edge Latency from Accra',
    'Notes de terrain : latence en périphérie depuis Accra',
    'What we measured serving West African 4G traffic, and the caching decisions that followed.',
    'Ce que nous avons mesuré en servant le trafic 4G ouest-africain.',
    'Time-to-first-byte from Accra dropped from 410ms to 180ms once we moved static assets to a regional edge and pinned connection pooling. The detail: measure at the 75th percentile, not the mean — tail latency is where mobile users live.',
    'Le temps jusqu''au premier octet depuis Accra est passé de 410ms à 180ms.',
    'Ama Owusu',
    'Lead Engineer, Platform',
    '["performance", "edge", "west-africa"]'::jsonb,
    FALSE,
    '',
    '',
    now() - interval '3 days',
    'published'
  )
ON CONFLICT (slug) DO NOTHING;

-- Audio briefs for the podcast RSS feed
INSERT INTO content.audio_briefs
  (slug, title, summary, duration_seconds, audio_url, transcript, speaker_name, speaker_title, tags, cover_image_url, published_at, status)
VALUES
  (
    'brief-data-residency-in-practice',
    'Data Residency in Practice',
    'A nine-minute briefing on what data residency actually requires beyond a checkbox in a procurement form.',
    540,
    'https://cdn.xcreativs.com/audio/data-residency-in-practice.mp3',
    'Data residency is often treated as a storage-location flag. In practice it touches backups, logs, third-party processors, and disaster recovery...',
    'Kwame Mensah',
    'Principal, Systems Strategy',
    '["sovereignty", "compliance"]'::jsonb,
    'https://cdn.xcreativs.com/audio/covers/data-residency.jpg',
    now() - interval '8 days',
    'published'
  ),
  (
    'brief-buying-vs-building-intelligence',
    'Buying vs Building Intelligence',
    'When does an organisation buy an AI capability, and when must it own the model and the data pipeline? Eleven minutes.',
    660,
    'https://cdn.xcreativs.com/audio/buying-vs-building-intelligence.mp3',
    'The buy-versus-build decision for intelligence hinges on three questions: is the data proprietary, is the workflow a differentiator...',
    'Ama Owusu',
    'Lead Engineer, Platform',
    '["ai", "strategy"]'::jsonb,
    'https://cdn.xcreativs.com/audio/covers/buy-vs-build.jpg',
    now() - interval '2 days',
    'published'
  )
ON CONFLICT (slug) DO NOTHING;

-- Subsidiaries (holding-company map)
INSERT INTO content.subsidiaries
  (slug, name, name_fr, description, description_fr, status, leadership, relationship_to_parent, sort_order)
VALUES
  (
    'ilivvon-labs',
    'ILIVVON Labs',
    'ILIVVON Labs',
    'The product arm building ILIVVON, our document-intelligence platform, alongside other first-party software bets.',
    'La branche produit qui construit ILIVVON, notre plateforme d''intelligence documentaire.',
    'active',
    '[{"name": "Kwame Mensah", "role": "Managing Director"}, {"name": "Ama Owusu", "role": "Head of Engineering"}]'::jsonb,
    'Wholly owned product subsidiary',
    1
  ),
  (
    'xcreativs-advisory',
    'XCreativs Advisory',
    'XCreativs Advisory',
    'Strategic advisory and systems architecture for governments and large enterprises across West Africa.',
    'Conseil stratégique et architecture de systèmes pour les gouvernements et grandes entreprises.',
    'active',
    '[{"name": "Nana Adjei", "role": "Principal"}]'::jsonb,
    'Services subsidiary',
    2
  )
ON CONFLICT (slug) DO NOTHING;

-- Webinars (one upcoming, one recorded)
INSERT INTO content.webinars
  (slug, title, description, scheduled_at, duration_minutes, recording_url, registration_url, max_attendees, speaker_names, tags, cover_image_url, status)
VALUES
  (
    'sovereign-cloud-west-africa',
    'Building Sovereign Cloud in West Africa',
    'A working session on data-residency architecture, edge placement, and the procurement realities of sovereign cloud for the region.',
    now() + interval '14 days',
    60,
    '',
    '',
    500,
    '["Kwame Mensah", "Ama Owusu"]'::jsonb,
    '["sovereignty", "cloud", "architecture"]'::jsonb,
    '',
    'upcoming'
  ),
  (
    'document-intelligence-in-government',
    'Document Intelligence in Government',
    'How structured extraction from contracts, tenders, and policy briefs changes the speed of public-sector decision-making. Recorded session.',
    now() - interval '20 days',
    45,
    'https://cdn.xcreativs.com/webinars/document-intelligence-in-government.mp4',
    '',
    500,
    '["Nana Adjei"]'::jsonb,
    '["ai", "government", "document-intelligence"]'::jsonb,
    '',
    'recorded'
  )
ON CONFLICT (slug) DO NOTHING;
