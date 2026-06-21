import { ShieldCheck } from "lucide-react";
import LegalDocument from "../_components/LegalDocument";

export default function PrivacyPage() {
  return (
    <LegalDocument
      icon={ShieldCheck}
      label="Privacy"
      title="Privacy Policy"
      description="How XCreativs collects, protects, uses, and retains personal and organisational information across the public site and portal."
      updated="14 June 2026"
      owner="Privacy and security"
      sections={[
        {
          title: "Information we collect",
          body: "We collect information you provide directly, including contact forms, diagnostic responses, RFP details, booking requests, partner applications, career applications, portal profile data, and support messages.",
        },
        {
          title: "How we use information",
          body: "We use information to respond to enquiries, evaluate readiness, administer client and partner workspaces, deliver engagements, improve services, maintain security, and satisfy legal or contractual obligations.",
        },
        {
          title: "Portal and workspace data",
          body: "Authenticated portal activity can include engagement records, decisions, deliverables, invoices, approvals, comments, support tickets, audit logs, and user preferences. Access to this data is scoped by role and engagement membership.",
        },
        {
          title: "Retention",
          body: "We retain data for as long as needed to support the relationship, satisfy engagement governance, preserve audit trails, and meet legal obligations. Where deletion is appropriate, we remove or anonymise records through controlled processes.",
        },
        {
          title: "Sharing and processors",
          body: "We do not sell personal data. We use vetted processors for hosting, email, file storage, analytics, and operational delivery. Processor access is limited to the purpose required and governed by contractual safeguards.",
        },
        {
          title: "Your rights",
          body: "You may request access, correction, export, restriction, or deletion of personal data where applicable. Client workspace requests may be routed through the owning organisation or engagement lead for verification.",
        },
      ]}
      assurance={[
        "No sale of personal data.",
        "Role-scoped portal access and authenticated audit trails.",
        "Retention tied to engagement governance and legal obligations.",
      ]}
    />
  );
}
