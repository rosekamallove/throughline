import { Lightbulb } from "lucide-react";

import { parseThumbLine } from "@/lib/thumb-text";
import { cn } from "@/lib/utils";

interface ThumbnailPackagingProps {
  color?: string | null;
  /** Anton lines; `*token*` marks the highlighted (yellow) span. */
  lines?: string[] | null;
  /** Real uploaded thumbnail — wins over CSS mode when set. */
  imageUrl?: string | null;
  alt?: string;
  className?: string;
}

/**
 * The 16:9 packaging slot. Three modes: uploaded image, CSS packaging
 * (saturated bg + Anton text), or the idea ghost box. Sized with container
 * query units so one component scales from grid card to packaging-lab hero.
 */
export function ThumbnailPackaging({
  color,
  lines,
  imageUrl,
  alt = "",
  className,
}: ThumbnailPackagingProps) {
  if (imageUrl) {
    return (
      <div className={cn("@container aspect-video overflow-hidden rounded-thumb", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={alt} className="size-full object-cover" />
      </div>
    );
  }

  if (color && lines?.length) {
    return (
      <div
        className={cn(
          "@container flex aspect-video flex-col items-center justify-center overflow-hidden rounded-thumb",
          className,
        )}
        style={{ backgroundColor: color }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            className="font-anton text-[10.5cqw] uppercase leading-[0.94] tracking-wide"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,.4)" }}
          >
            {parseThumbLine(line).map((seg, j) => (
              <span key={j} className={seg.highlight ? "text-thumb-accent" : "text-white"}>
                {seg.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "@container flex aspect-video items-center justify-center rounded-thumb border border-dashed border-ghost-border bg-ghost-bg",
        className,
      )}
    >
      <Lightbulb className="size-[8cqw] text-sub2" />
    </div>
  );
}
