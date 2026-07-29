"use client";

import { useEffect } from "react";

/**
 * ViewportScaler – Forces the dashboard to appear identical on any screen size.
 *
 * Strategy (cross-browser, zero feedback-loop):
 *  - Reference design width: 1536px.
 *  - Source of truth: `window.outerWidth` — the physical pixel width of the
 *    OS browser window INCLUDING chrome/scrollbars. This value is NEVER
 *    modified by CSS transforms or `document.documentElement.style.width`,
 *    so reading it inside a resize handler cannot trigger another resize event.
 *  - We set `document.documentElement.style.width = "1536px"` so the layout
 *    always renders as if the screen is 1536px wide.
 *  - Then `transform: scale(outerWidth / 1536)` + `transform-origin: top left`
 *    shrinks the full layout to exactly fit the browser window.
 *  - `minHeight` is compensated for the scale shrink to avoid bottom whitespace.
 *  - On screens >= 1536px, all overrides are removed (native behaviour).
 */
export function ViewportScaler() {
  useEffect(() => {
    const REFERENCE_WIDTH = 1536;
    let lastWidth = -1;
    let rafId = 0;

    const apply = () => {
      // outerWidth = physical width of the browser window chrome.
      // It is NOT affected by CSS zoom / transform so there is no loop.
      const browserWidth = window.outerWidth;

      // Debounce: skip if nothing changed
      if (browserWidth === lastWidth) return;
      lastWidth = browserWidth;

      const el = document.documentElement;

      if (browserWidth > 0 && browserWidth < REFERENCE_WIDTH) {
        const scale = browserWidth / REFERENCE_WIDTH;
        el.style.width = `${REFERENCE_WIDTH}px`;
        el.style.transform = `scale(${scale})`;
        el.style.transformOrigin = "top left";
        el.style.overflowX = "hidden";
        // Prevent blank space at bottom due to scale shrink
        el.style.minHeight = `${Math.ceil(window.innerHeight / scale)}px`;
      } else {
        // Full-size screen or server-side: remove all overrides
        el.style.width = "";
        el.style.transform = "";
        el.style.transformOrigin = "";
        el.style.overflowX = "";
        el.style.minHeight = "";
      }
    };

    const onResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(apply);
    };

    // Initial apply
    apply();

    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      const el = document.documentElement;
      el.style.width = "";
      el.style.transform = "";
      el.style.transformOrigin = "";
      el.style.overflowX = "";
      el.style.minHeight = "";
    };
  }, []);

  return null;
}
