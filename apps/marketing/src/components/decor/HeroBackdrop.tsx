export default function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-hairline" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-hairline" />
      <div className="absolute inset-y-0 left-[8%] w-px bg-gravity/5 dark:bg-white/8" />
      <div className="absolute inset-y-0 left-[32%] w-px bg-gravity/5 dark:bg-white/8" />
      <div className="absolute inset-y-0 right-[18%] w-px bg-gravity/5 dark:bg-white/8" />
      <div className="absolute left-[8%] right-[18%] top-[28%] h-px bg-gravity/5 dark:bg-white/8" />
      <div className="absolute left-[32%] right-[8%] top-[62%] h-px bg-gravity/5 dark:bg-white/8" />
    </div>
  );
}
