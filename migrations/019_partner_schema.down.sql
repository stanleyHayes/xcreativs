-- Drops the reconciled partner tables (partner.applications is left intact).
DROP TABLE IF EXISTS partner.distribution_orders CASCADE;
DROP TABLE IF EXISTS partner.referrals CASCADE;
DROP TABLE IF EXISTS partner.agreements CASCADE;
DROP TABLE IF EXISTS partner.products CASCADE;
DROP TABLE IF EXISTS partner.partner_users CASCADE;
DROP TABLE IF EXISTS partner.partners CASCADE;
