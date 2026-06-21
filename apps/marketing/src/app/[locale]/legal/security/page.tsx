import { LockKeyhole } from "lucide-react";
import LegalDocument from "../_components/LegalDocument";

export default function SecurityPage() {
  return (
    <LegalDocument
      icon={LockKeyhole}
      label="Trust center"
      title="Security"
      description="The safeguards XCreativs uses to protect client workspaces, engagement records, documents, and operational systems."
      updated="14 June 2026"
      owner="Security and platform"
      sections={[
        {
          title: "Security posture",
          body: "Security is treated as a baseline operating constraint. Production systems are designed around least privilege, authenticated access, traceable changes, monitored infrastructure, and clear ownership of sensitive workflows.",
        },
        {
          title: "Authentication and MFA",
          body: "Portal access requires authenticated accounts. Multi-factor authentication is supported and can be enforced for protected workspaces, giving clients a stronger assurance layer for sensitive engagements.",
        },
        {
          title: "Role-based access",
          body: "Workspace access is scoped by user, role, and engagement membership. Administrative functions are separated from client views, and protected routes are guarded before sensitive records are returned.",
        },
        {
          title: "Audit logging",
          body: "Authenticated reads and writes are captured in the audit trail with user, action, resource, IP address, user agent, timestamp, and response status metadata for compliance review.",
        },
        {
          title: "Infrastructure protection",
          body: "Production services run behind managed infrastructure with transport encryption, request-size limits, rate limiting, security headers, monitored health checks, and hardened deployment workflows.",
        },
        {
          title: "Incident handling",
          body: "Suspected security events are triaged by severity, contained through access controls or service changes, documented, and communicated to affected parties where contractual or legal duties require notice.",
        },
      ]}
      assurance={[
        "Authenticated access, MFA support, and role-scoped permissions.",
        "Audit trail coverage for authenticated reads and writes.",
        "Security headers, rate limits, and monitored service health.",
      ]}
    />
  );
}
