export default function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0_7.5%,var(--color-hairline)_7.5%_calc(7.5%+1px),transparent_calc(7.5%+1px)_92.5%,var(--color-hairline)_92.5%_calc(92.5%+1px),transparent_calc(92.5%+1px))] opacity-80" />
      <div className="absolute -right-[12vw] -top-[28vw] h-[62vw] w-[62vw] rounded-full border border-signal/15" />
      <div className="absolute -right-[4vw] -top-[20vw] h-[46vw] w-[46vw] rounded-full border border-signal/20" />
      <div className="absolute right-[11vw] top-[14%] h-2 w-2 bg-signal" />
      <div className="absolute bottom-0 left-[7.5%] h-[36%] w-[min(32rem,38vw)] bg-signal/[0.035]" />
    </div>
  );
}
