type Node = { x: number; y: number };

// Abstract data-network laid over the hero — fixed coordinates (percent) so the
// server and client render identically (no hydration drift).
const NODES: Node[] = [
  { x: 10, y: 28 },
  { x: 22, y: 52 },
  { x: 16, y: 78 },
  { x: 33, y: 38 },
  { x: 29, y: 66 },
  { x: 45, y: 24 },
  { x: 51, y: 50 },
  { x: 43, y: 78 },
  { x: 63, y: 36 },
  { x: 70, y: 60 },
  { x: 81, y: 28 },
  { x: 87, y: 52 },
  { x: 77, y: 80 },
  { x: 93, y: 44 },
];

const LINKS: [number, number][] = [
  [0, 1], [1, 2], [1, 3], [3, 4], [4, 2], [3, 5], [5, 6], [6, 4],
  [6, 7], [5, 8], [8, 9], [9, 6], [8, 10], [10, 11], [11, 9], [11, 13],
  [9, 12], [12, 7], [10, 13],
];

export default function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* drifting brand glows */}
      <div className="animate-drift absolute -left-[12%] -top-[25%] h-[55vmax] w-[55vmax] rounded-full bg-signal/15 blur-[140px]" />
      <div className="animate-drift-slow absolute -right-[15%] top-[5%] h-[48vmax] w-[48vmax] rounded-full bg-[#16d0ff]/10 blur-[150px]" />
      <div className="animate-float absolute bottom-[-20%] left-[30%] h-[40vmax] w-[40vmax] rounded-full bg-signal/[0.07] blur-[130px]" />

      {/* engineering grid, faded at the edges */}
      <div
        className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_40%,black,transparent_72%)]"
      />

      {/* constellation links */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <g stroke="var(--color-signal)" strokeWidth={0.12} opacity={0.22}>
          {LINKS.map(([a, b], i) => (
            <line
              key={i}
              x1={NODES[a].x}
              y1={NODES[a].y}
              x2={NODES[b].x}
              y2={NODES[b].y}
              strokeDasharray="2 3"
              style={{ animation: `xc-dash ${22 + (i % 6) * 4}s linear infinite` }}
            />
          ))}
        </g>
      </svg>

      {/* crisp pulsing nodes */}
      {NODES.map((n, i) => (
        <span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-signal"
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            transform: "translate(-50%, -50%)",
            animation: `xc-pulse ${4 + (i % 5)}s ease-in-out ${(i % 7) * 0.4}s infinite`,
          }}
        />
      ))}

      {/* grain + base wash */}
      <div className="bg-grain absolute inset-0 opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-foundation" />
    </div>
  );
}
