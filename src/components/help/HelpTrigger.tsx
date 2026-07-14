"use client";

import React, { useState } from "react";
import { HelpCircle } from "lucide-react";
import { ContextualHelpModal } from "./ContextualHelpModal";

interface HelpTriggerProps {
  pageId: string;
  className?: string;
}

export function HelpTrigger({ pageId, className = "" }: HelpTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`group flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all ${className}`}
        title="Pelajari cara membaca data halaman ini"
      >
        <HelpCircle className="h-3.5 w-3.5 text-blue-500 group-hover:text-blue-400 transition-colors" />
        <span>Pelajari Halaman Ini</span>
      </button>

      <ContextualHelpModal
        pageId={pageId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
