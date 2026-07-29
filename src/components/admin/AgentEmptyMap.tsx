"use client";

import React from "react";
import { MapPin } from "lucide-react";

export function EmptyMap() {
  return (
    <div className="flex flex-col items-center justify-center h-72 gap-4">
      <div className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}>
        <MapPin className="w-7 h-7 text-indigo-400 opacity-60" />
      </div>
      <div className="text-center font-serif">
        <p className="text-sm font-semibold text-slate-300">No agent locations configured</p>
        <p className="text-xs text-slate-400 mt-2.5 max-w-sm leading-relaxed flex items-center justify-center gap-1.5 flex-wrap">
          <span>Click the</span>
          <span className="inline-flex items-center justify-center p-1 rounded bg-indigo-950/20 text-slate-500 border border-slate-700/30" title="Map Pin Icon">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
          </span>
          <span>icon in the</span>
          <span className="text-slate-300 font-semibold">Actions</span>
          <span>column to set coordinates.</span>
        </p>
      </div>
    </div>
  );
}
