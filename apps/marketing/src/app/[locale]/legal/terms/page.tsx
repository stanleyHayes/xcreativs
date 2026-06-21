import { Scale } from "lucide-react";
import LegalDocument from "../_components/LegalDocument";

export default function TermsPage() {
  return (
    <LegalDocument
      icon={Scale}
      label="Legal terms"
      title="Terms of Service"
      description="The operating terms for using XCreativs digital properties, portals, diagnostics, and client workspaces."
      updated="14 June 2026"
      owner="Legal and operations"
      sections={[
        {
          title: "Acceptance of terms",
          body: "By accessing the XCreativs website, client portal, partner workspace, diagnostics, or related services, you agree to use them in accordance with these terms and any engagement agreement signed with XCreativs Technologies.",
        },
        {
          title: "Permitted use",
          body: "You may use the platform for lawful business purposes connected to evaluating, procuring, delivering, or governing XCreativs services. You may not misuse accounts, probe protected systems, interfere with service availability, or attempt to access data that does not belong to you.",
        },
        {
          title: "Client workspaces",
          body: "Portal access is provisioned per engagement. Workspace content, deliverables, decisions, invoices, reports, and support records remain subject to the access controls, confidentiality terms, and commercial agreements that govern the relevant engagement.",
        },
        {
          title: "Intellectual property",
          body: "Unless an engagement agreement states otherwise, XCreativs retains ownership of its platform, methods, reusable components, internal tools, documentation structures, and product IP. Client-owned materials remain the property of the client.",
        },
        {
          title: "Service changes",
          body: "We may improve, retire, or modify public site and portal features as the platform evolves. Material changes that affect active client obligations will be handled through the applicable engagement governance process.",
        },
        {
          title: "Contact",
          body: "Questions about these terms should be sent through the contact page or raised with your engagement lead. Contract-specific terms always take priority where there is a signed agreement.",
        },
      ]}
      assurance={[
        "Plain-language terms aligned to active engagement governance.",
        "Portal access bound to authenticated users and scoped roles.",
        "Contract-specific commitments take priority over generic site terms.",
      ]}
    />
  );
}
