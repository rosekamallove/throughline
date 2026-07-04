/** Brand mark: a script page with a play button, in the YouTube red circle. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Throughline">
      <circle cx="24" cy="24" r="23" fill="var(--primary)" />
      <rect x="15" y="10.5" width="18" height="27" rx="3.5" fill="var(--primary-foreground)" />
      <rect x="19" y="15.5" width="10" height="2.4" rx="1.2" fill="var(--primary)" opacity="0.3" />
      <rect x="19" y="30.6" width="7" height="2.4" rx="1.2" fill="var(--primary)" opacity="0.3" />
      <path d="M21 20.6 L28.8 24.7 L21 28.8 Z" fill="var(--primary)" />
    </svg>
  );
}
