"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  /** Lucide icon shown in the animated badge. */
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Small uppercase label above the title. */
  eyebrow?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  /** Tighter padding/sizing for inline/card contexts. */
  compact?: boolean;
  className?: string;
}

/**
 * Shared, theme-adaptive empty / zero-data state with an animated icon.
 *
 * Colors adapt to either app automatically: the icon badge + eyebrow use the
 * `signal` brand token (defined in both apps), while the title/description
 * inherit the surrounding text color (white on the dark portal, ink on the
 * light marketing site) — so a single component reads correctly in both.
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  eyebrow,
  action,
  secondaryAction,
  compact = false,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "px-4 py-10" : "px-6 py-16"
      } ${className}`}
    >
      <span
        className={`xc-empty-icon inline-flex items-center justify-center rounded-2xl ${
          compact ? "h-12 w-12" : "h-16 w-16"
        }`}
      >
        <Icon className={compact ? "h-5 w-5" : "h-7 w-7"} aria-hidden />
      </span>

      {eyebrow && (
        <p className="text-signal mt-5 text-[11px] font-semibold uppercase tracking-[0.18em]">
          {eyebrow}
        </p>
      )}

      <h2
        className={`font-display font-semibold tracking-tight ${eyebrow ? "mt-2" : "mt-5"} ${
          compact ? "text-lg" : "text-2xl"
        }`}
      >
        {title}
      </h2>

      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed opacity-60">{description}</p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
