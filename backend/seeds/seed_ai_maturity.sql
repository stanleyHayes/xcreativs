-- Seed AI Maturity Score Assessment
INSERT INTO interactive.assessment_templates (slug, title, description, version, is_active)
VALUES ('ai-maturity', 'AI Maturity Score', 'Evaluate your organisation readiness for artificial intelligence adoption across strategy, data, talent, and governance dimensions.', 1, TRUE)
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
    tpl_id UUID;
BEGIN
    SELECT id INTO tpl_id FROM interactive.assessment_templates WHERE slug = 'ai-maturity';
    IF tpl_id IS NULL THEN RETURN; END IF;

    DELETE FROM interactive.assessment_questions WHERE template_id = tpl_id;

    INSERT INTO interactive.assessment_questions (template_id, question_text, dimension, question_order, options) VALUES
    (tpl_id, 'Does your organisation have a defined AI strategy?', 'strategy', 1, '[{"label":"No AI strategy","value":1},{"label":"Exploratory discussions only","value":2},{"label":"Informal AI initiatives","value":3},{"label":"Documented AI roadmap","value":4},{"label":"AI integrated into core business strategy","value":5}]'),
    (tpl_id, 'How are AI use cases identified and prioritised?', 'strategy', 2, '[{"label":"Ad-hoc, no process","value":1},{"label":"Individual teams suggest ideas","value":2},{"label":"Centralised idea collection","value":3},{"label":"Structured evaluation framework","value":4},{"label":"Portfolio management with ROI tracking","value":5}]'),
    (tpl_id, 'Is there a dedicated budget for AI initiatives?', 'strategy', 3, '[{"label":"No budget","value":1},{"label":"Experimental/POC budget only","value":2},{"label":"Project-specific budgets","value":3},{"label":"Annual AI programme budget","value":4},{"label":"Multi-year AI investment plan","value":5}]'),
    (tpl_id, 'What is the quality and accessibility of your data for AI?', 'data', 4, '[{"label":"Siloed, inaccessible data","value":1},{"label":"Some data available but unclean","value":2},{"label":"Centralised data warehouse","value":3},{"label":"Curated datasets with metadata","value":4},{"label":"Real-time data pipelines with quality monitoring","value":5}]'),
    (tpl_id, 'Do you have labelled data for supervised learning?', 'data', 5, '[{"label":"No labelled data","value":1},{"label":"Small ad-hoc labelled sets","value":2},{"label":"Moderate labelled datasets","value":3},{"label":"Systematic labelling processes","value":4},{"label":"Active learning with human-in-the-loop","value":5}]'),
    (tpl_id, 'How do you handle data privacy and ethics in AI?', 'data', 6, '[{"label":"No consideration","value":1},{"label":"Aware but no policy","value":2},{"label":"Basic privacy compliance","value":3},{"label":"Ethics review board","value":4},{"label":"Responsible AI framework with audits","value":5}]'),
    (tpl_id, 'What is the current AI/ML expertise in your organisation?', 'talent', 7, '[{"label":"No AI expertise","value":1},{"label":"Individual enthusiasts","value":2},{"label":"Small data science team","value":3},{"label":"Dedicated ML engineering unit","value":4},{"label":"Centre of Excellence with external advisors","value":5}]'),
    (tpl_id, 'How do you upskill staff on AI tools and concepts?', 'talent', 8, '[{"label":"No training","value":1},{"label":"Self-directed learning","value":2},{"label":"Occasional workshops","value":3},{"label":"Structured training programme","value":4},{"label":"Continuous learning with certifications","value":5}]'),
    (tpl_id, 'Do you have access to AI/ML infrastructure?', 'talent', 9, '[{"label":"No infrastructure","value":1},{"label":"Cloud compute for experiments","value":2},{"label":"Managed ML platform","value":3},{"label":"Scalable training and inference clusters","value":4},{"label":"MLOps with auto-scaling and monitoring","value":5}]'),
    (tpl_id, 'Is there governance for AI model deployment?', 'governance', 10, '[{"label":"No governance","value":1},{"label":"Ad-hoc approval","value":2},{"label":"IT review required","value":3},{"label":"AI governance committee","value":4},{"label":"Full model registry with audit trails","value":5}]'),
    (tpl_id, 'How do you monitor AI models in production?', 'governance', 11, '[{"label":"No monitoring","value":1},{"label":"Basic error logging","value":2},{"label":"Performance dashboards","value":3},{"label":"Drift and bias detection","value":4},{"label":"Continuous monitoring with auto-rollback","value":5}]'),
    (tpl_id, 'Are AI outcomes measured against business KPIs?', 'governance', 12, '[{"label":"Not measured","value":1},{"label":"Informal feedback","value":2},{"label":"Project-level metrics","value":3},{"label":"Business impact tracking","value":4},{"label":"C-suite AI ROI reporting","value":5}]');
END $$;
