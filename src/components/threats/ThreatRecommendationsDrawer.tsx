"use client";

import { useEffect, useState } from "react";
import { X, ShieldAlert, CheckCircle2, Server, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ThreatStat } from "@/lib/api";
import { formatAppLabel } from "@/lib/utils";
import { getMitigationSteps } from "./getMitigationSteps";

interface ThreatRecommendationsDrawerProps {
  threat: ThreatStat | null;
  onClose: () => void;
}

export function ThreatRecommendationsDrawer({
  threat,
  onClose,
}: ThreatRecommendationsDrawerProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [activeThreat, setActiveThreat] = useState<ThreatStat | null>(null);

  // Sync threat to activeThreat and handle mounting/resetting close state
  useEffect(() => {
    if (threat) {
      setActiveThreat(threat);
      setIsClosing(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [threat]);

  if (!threat && !activeThreat) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setActiveThreat(null);
      setIsClosing(false);
    }, 480); // Match 500ms keyframe animation duration
  };

  const displayThreat = threat || activeThreat;
  if (!displayThreat) return null;

  const sev = (displayThreat.severity || "").toLowerCase();
  let badgeVariant: "red" | "orange" | "yellow" | "blue" | "green" = "blue";
  if (sev.includes("high") || sev.includes("critical")) badgeVariant = "red";
  else if (sev.includes("med")) badgeVariant = "orange";
  else if (sev.includes("low")) badgeVariant = "yellow";

  const mitigation = getMitigationSteps(displayThreat.threat_type || "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 cursor-default"
      onClick={handleClose}
    >
      {/* Backdrop overlay (fade in/out over 0.5s via keyframes) */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${
          isClosing ? "animate-overlay-out" : "animate-overlay-in"
        }`}
      />

      {/* Centered Modal Content Box (fades and scales over 0.5s via keyframes) */}
      <div
        className={`relative bg-slate-950/85 border border-slate-800/60 rounded-3xl w-full max-w-2xl h-[75vh] flex flex-col shadow-2xl shadow-blue-900/20 overflow-hidden backdrop-blur-xl ${
          isClosing ? "animate-modal-out" : "animate-modal-in"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Mitigation Guide
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white rounded-lg p-1.5 hover:bg-white/5 transition-all outline-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 custom-scrollbar">
          {/* Threat Metadata Card */}
          <div className="bg-slate-950/30 border border-white/5 rounded-xl p-4.5 space-y-3.5">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Threat Type
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-white leading-tight">
                  {displayThreat.threat_type || "Unknown Threat"}
                </span>
                <Badge variant={badgeVariant} className="text-[10px] uppercase font-bold shrink-0">
                  {displayThreat.severity}
                </Badge>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                Description
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {displayThreat.description || "No detailed description available."}
              </p>
            </div>
          </div>

          {/* Technical details block */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              Technical Details
            </h3>
            <div className="bg-slate-950/20 border border-white/5 rounded-xl divide-y divide-white/5">
              <div className="px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Source IP</span>
                <span className="font-mono font-medium text-white">{displayThreat.ip_address || "-"}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Source MAC</span>
                <span className="font-mono font-medium text-white">{displayThreat.mac_address || "-"}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Destination IP</span>
                <span className="font-mono font-medium text-white">{displayThreat.dst_ip || "-"}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Application</span>
                <span className="font-medium text-white">{formatAppLabel(displayThreat.app_label)}</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Domain</span>
                <span className="font-mono font-medium text-white truncate max-w-[200px]" title={displayThreat.domain || ""}>
                  {displayThreat.domain || "-"}
                </span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Detected At</span>
                <span className="text-slate-300">
                  {displayThreat.detected_at ? new Date(displayThreat.detected_at).toLocaleString() : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations checklist */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-primary" />
              Recommendations & Actions
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed italic mb-1">
              {mitigation.intro}
            </p>
            <div className="space-y-3">
              {mitigation.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-slate-950/20 hover:bg-slate-950/45 transition-colors p-3.5 border border-white/5 rounded-xl"
                >
                  <div className="p-0.5 rounded bg-emerald-500/10 text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="px-6 py-4.5 border-t border-white/5 bg-slate-950/40 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-all cursor-pointer border border-white/5"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
