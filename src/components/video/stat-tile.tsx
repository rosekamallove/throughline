export function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1 rounded-xl border border-border bg-card px-4 py-3">
      <span className="font-mono text-xl font-semibold">{value}</span>
      <span className="mono-label">{label}</span>
    </div>
  );
}
