"use client";

import type { LucideIcon } from "lucide-react";

interface PortalEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  eyebrow?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export default function PortalEmptyState({
  icon: Icon,
  title,
  description,
  eyebrow,
  action,
  secondaryAction,
  compact = false,
  className = "",
}: PortalEmptyStateProps) {
  return (
    <div className={`portal-empty-x ${compact ? "portal-empty-x-compact" : ""} ${className}`}>
      <span className="portal-empty-icon-x">
        <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </span>
      {eyebrow && <p className="portal-meta-x mt-4 text-signal">{eyebrow}</p>}
      <h2 className="font-display mt-3 text-2xl font-semibold tracking-tight text-white/86">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-white/52">{description}</p>
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
