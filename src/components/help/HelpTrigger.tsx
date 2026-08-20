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
        className={`group flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all ${className}`}
        title="Learn how to read data on this page"
      >
        <BookOpen className="h-3.5 w-3.5 text-blue-500 group-hover:text-blue-400 transition-colors" />
        <span className="sm:hidden">Learn</span>
        <span className="hidden sm:inline">Learn This Page</span>
      </button>

      <ContextualHelpModal
        pageId={pageId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
