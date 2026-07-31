"use client";

import React, { useState } from "react";
import { BookOpen } from "lucide-react";
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
        className={`group flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all shrink-0 shadow-sm active:scale-95 ${className}`}
        title="Learn how to read data on this page"
      >
        <BookOpen className="h-3.5 w-3.5 text-blue-400 group-hover:text-blue-300 transition-colors shrink-0" />
        <span className="hidden sm:inline">Learn This Page</span>
        <span className="sm:hidden text-[11px]">Learn</span>
      </button>

      <ContextualHelpModal
        pageId={pageId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
