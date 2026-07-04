import { cn } from "@/lib/utils";

/** Brand mark: a landscape script page with a play button, in the red circle. */
export function LogoMark({ className = "size-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
      <circle cx="24" cy="24" r="23" fill="var(--primary)" />
      <rect x="10.5" y="15" width="27" height="18" rx="3.5" fill="var(--primary-foreground)" />
      <rect x="15" y="20" width="9" height="2.4" rx="1.2" fill="var(--primary)" opacity="0.3" />
      <rect x="15" y="25.6" width="6.5" height="2.4" rx="1.2" fill="var(--primary)" opacity="0.3" />
      <path d="M27.5 19.8 L34 24 L27.5 28.2 Z" fill="var(--primary)" />
    </svg>
  );
}

/** Mark + wordmark lockup. Scales with font size: pass text-[Npx] via className. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[0.33em] text-[21px]", className)}>
      <LogoMark className="size-[1.14em]" />
      <span className="font-logo text-[1em] font-bold leading-none tracking-[-0.01em]">
        ThroughLine
      </span>
    </span>
  );
}
