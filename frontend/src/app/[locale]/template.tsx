// A template re-mounts on every navigation (unlike layout), so this replays a
// subtle fade on each route change — our global page transition.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
