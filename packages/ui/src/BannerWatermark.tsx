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
      strokeWidth={0.8}
      className={`pointer-events-none absolute -right-14 -top-10 hidden h-64 w-64 text-signal/[0.06] sm:block lg:right-[6%] lg:h-96 lg:w-96 ${className}`}
    />
  );
}
