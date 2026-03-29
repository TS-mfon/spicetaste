interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<string, { label: string; className: string }> = {
    collecting: { label: "Collecting Evidence", className: "border-primary/30 bg-primary/10 text-primary" },
    resolved: { label: "Resolved", className: "border-emerald/30 bg-emerald/10 text-emerald" },
    pending: { label: "AI Thinking…", className: "border-accent/30 bg-accent/10 text-accent" },
  };

  const c = config[status] || config.collecting;

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${c.className}`}>
      {status === "pending" && (
        <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
      )}
      {c.label}
    </span>
  );
}
