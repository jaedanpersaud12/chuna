"use client";

import { useEffect } from "react";
import { bind } from "cuelume";

/**
 * Enables cuelume's delegated interaction sounds for the whole document.
 * `bind()` is SSR-safe and idempotent, and its listeners are delegated, so
 * buttons rendered later inside dialogs/dropdowns get feedback too. Renders
 * nothing.
 */
export function CuelumeProvider() {
  useEffect(() => {
    bind();
  }, []);
  return null;
}
