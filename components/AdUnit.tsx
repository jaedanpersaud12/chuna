"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ADSENSE_CLIENT } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface Props {
  /** AdSense ad unit slot id (from your dashboard). */
  slot: string;
  className?: string;
  /** data-ad-format; "auto" is a responsive display unit. */
  format?: string;
  responsive?: boolean;
  style?: React.CSSProperties;
  /** Show the small "Advertisement" label above the unit. */
  label?: boolean;
}

export default function AdUnit({
  slot,
  className,
  format = "auto",
  responsive = true,
  style,
  label = true,
}: Props) {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const ins = insRef.current;
    // Only push once per <ins>; AdSense marks processed units with this attr.
    if (!ins || ins.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adsbygoogle.js not ready yet — it drains the queue once loaded.
    }
  }, [slot]);

  // No slot configured yet: show the intended position in dev, nothing in prod.
  if (!slot) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <div
        className={cn(
          "flex h-24 w-full items-center justify-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground",
          className
        )}
      >
        Ad slot — set an AdSense slot id in lib/adsense.ts
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <p className="mb-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground/60">
          Advertisement
        </p>
      )}
      <ins
        ref={insRef}
        className="adsbygoogle block"
        style={{ display: "block", ...style }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
