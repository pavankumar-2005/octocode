import { Link } from "react-router-dom";

// The OctoCode mark: an octopus on a gradient tile, plus the name.
export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="OctoCode home">
      <span className="bg-brand grid size-8 place-items-center rounded-lg text-lg shadow-md shadow-violet-500/30">
        🐙
      </span>
      {!compact && <span className="font-display text-lg font-bold tracking-tight">OctoCode</span>}
    </Link>
  );
}
