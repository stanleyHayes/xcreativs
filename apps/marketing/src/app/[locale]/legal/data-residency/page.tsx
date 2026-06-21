import type { Metadata } from "next";
import { Server } from "lucide-react";
import LegalDocument from "../_components/LegalDocument";

export const metadata: Metadata = {
  title: "Data Residency - XCreativs Technologies",
  description: "XCreativs Technologies data residency policy. Where client data lives, how it is protected, and how sovereignty is maintained.",
};

export default function DataResidencyPage() {
  return (
    <LegalDocument
      icon={Server}
      label="Data sovereignty"
      title="Data Residency"
      description="Where client data lives, how residency decisions are made, and how sovereign operating requirements are protected."
      updated="14 June 2026"
      owner="Security and delivery governance"
      sections={[
        {
          title: "Residency principle",
          body: "XCreativs designs systems with data sovereignty as a first-class constraint. For public-sector and regulated clients, residency choices are agreed during engagement setup and reflected in the technical architecture.",
        },
        {
          title: "Default regions",
          body: "Unless an agreement specifies otherwise, African mandates are designed around African or client-approved regions. European mandates default to European regions. Client-specific jurisdiction requirements take priority.",
        },
        {
          title: "Encryption and key handling",
          body: "Client data is encrypted in transit and at rest. Where client requirements demand it, key material can be restricted to the selected residency region or managed through client-approved controls.",
        },
        {
          title: "Subprocessors",
          body: "Subprocessors are selected with residency, security, and operational need in mind. We do not introduce subprocessors for client data processing without appropriate contractual safeguards.",
        },
        {
          title: "Backups and recovery",
          body: "Backup, disaster recovery, and retention patterns are designed to respect the same residency posture as the primary workload unless a separate recovery region is explicitly approved.",
        },
        {
          title: "Attestations and review",
          body: "Clients may request residency information during an active engagement. Where third-party evidence or architecture attestations are required, they are shared under the applicable confidentiality terms.",
        },
      ]}
      assurance={[
        "Residency posture agreed during engagement setup.",
        "Backup and recovery patterns aligned to approved regions.",
        "Subprocessors reviewed for residency and contractual safeguards.",
      ]}
    />
  );
}
