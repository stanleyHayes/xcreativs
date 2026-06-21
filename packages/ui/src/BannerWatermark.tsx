import type { LucideIcon } from "lucide-react";

type BannerWatermarkProps = {
  icon: LucideIcon;
  className?: string;
};

export default function BannerWatermark({
  icon: Icon,
  className = "",
}: BannerWatermarkProps) {
  return (
    <Icon
      aria-hidden
      strokeWidth={1.05}
      className={`pointer-events-none absolute -right-10 top-1/2 hidden h-56 w-56 -translate-y-1/2 text-signal/[0.075] sm:block sm:h-72 sm:w-72 lg:right-10 lg:h-80 lg:w-80 ${className}`}
    />
  );
}
