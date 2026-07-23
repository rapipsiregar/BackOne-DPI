"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_TIMEOUT_SECONDS = 60 * 60; // 1 hour
const DEFAULT_WARNING_SECONDS = 2 * 60;  // Show warning 2 minutes before logout

// ─── Types ─────────────────────────────────────────────────────────────────────
interface UseInactivityTimeoutOptions {
  timeoutSeconds?: number;
  warningSeconds?: number;
}

interface UseInactivityTimeoutReturn {
  showWarning: boolean;
  timeLeft: number;
  isRenewing: boolean;
  handleRenewSession: () => Promise<void>;
  handleLogout: () => Promise<void>;
}

// ─── User activity events to monitor ───────────────────────────────────────────
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "click",
  "scroll",
  "keydown",
  "touchstart",
];

/**
 * useInactivityTimeout
 *
 * Hybrid Tab-Aware Inactivity Session Timeout.
 *
 * Behavior:
 * - Timer resets to `timeoutSeconds` on any user activity (mouse/keyboard/touch)
 *   but ONLY when the tab is visible (document.visibilityState === "visible").
 * - When the user switches to another tab, the timer keeps running silently.
 * - Warning modal is shown when remaining time reaches `warningSeconds`.
 * - On tab return (visibilitychange → visible), the current state is checked
 *   immediately so the warning modal appears instantly if needed.
 * - Auto-logout occurs when the timer reaches zero.
 */
export function useInactivityTimeout({
  timeoutSeconds = DEFAULT_TIMEOUT_SECONDS,
  warningSeconds = DEFAULT_WARNING_SECONDS,
}: UseInactivityTimeoutOptions = {}): UseInactivityTimeoutReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(warningSeconds);
  const [isRenewing, setIsRenewing] = useState(false);

  // Store last activity time in a ref so event listeners don't cause re-renders
  const lastActivityRef = useRef<number>(Date.now());

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Proceed to login page even if request fails
    } finally {
      window.location.href = "/login";
    }
  }, []);

  // ── Renew session ───────────────────────────────────────────────────────────
  const handleRenewSession = useCallback(async () => {
    setIsRenewing(true);
    try {
      const res = await fetch("/api/auth/renew", { method: "POST" });
      if (res.ok) {
        // Reset inactivity clock on successful renewal
        lastActivityRef.current = Date.now();
        setShowWarning(false);
      }
    } catch (err) {
      console.error("[InactivityTimeout] Failed to renew session:", err);
    } finally {
      setIsRenewing(false);
    }
  }, []);

  // ── Activity listener: reset timer on user interaction (visible tab only) ───
  useEffect(() => {
    const resetActivity = () => {
      if (document.visibilityState === "visible") {
        lastActivityRef.current = Date.now();
        // If the warning was showing and user is active, dismiss it silently
        // (they are clearly still present at the screen)
        setShowWarning(prev => {
          if (prev) {
            // Still within active period — dismiss warning
            return false;
          }
          return false;
        });
      }
    };

    ACTIVITY_EVENTS.forEach(event =>
      window.addEventListener(event, resetActivity, { passive: true })
    );

    return () => {
      ACTIVITY_EVENTS.forEach(event =>
        window.removeEventListener(event, resetActivity)
      );
    };
  }, []);

  // ── Inactivity countdown (runs every second) ─────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = timeoutSeconds - elapsed;

      if (remaining <= 0) {
        // Expired — auto logout
        handleLogout();
      } else if (remaining <= warningSeconds) {
        // In warning zone — show modal and update countdown
        setTimeLeft(remaining);
        setShowWarning(true);
      } else {
        // Safe zone — ensure warning is hidden (guard against stale state)
        setShowWarning(false);
      }
    };

    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [timeoutSeconds, warningSeconds, handleLogout]);

  // ── Visibility change: check state immediately when user returns to tab ──────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;

      // User has returned to the tab — check inactivity state right now
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = timeoutSeconds - elapsed;

      if (remaining <= 0) {
        // Expired while away — logout immediately
        handleLogout();
      } else if (remaining <= warningSeconds) {
        // In warning zone — show modal immediately (don't wait for next tick)
        setTimeLeft(remaining);
        setShowWarning(true);
      }
      // If remaining > warningSeconds: safe, do nothing — timer already running
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [timeoutSeconds, warningSeconds, handleLogout]);

  return {
    showWarning,
    timeLeft,
    isRenewing,
    handleRenewSession,
    handleLogout,
  };
}
