"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, BookOpen, ChevronUp, ChevronDown, Info, HelpCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { PAGE_GUIDES, type PageGuide } from "@/lib/helpContent";

interface ContextualHelpModalProps {
  pageId: string;
  isOpen: boolean;
  onClose: () => void;
}

function SectionBlock({ heading, content, columns, items }: PageGuide["sections"][0]) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-white/4 transition-colors text-left"
      >
        <span className="text-xs font-semibold text-white/90">{heading}</span>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5">
          {open ? (
            <ChevronUp className="h-3 w-3 text-slate-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-slate-400" />
          )}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-white/5">
          {content && (
            <p className="text-xs text-slate-400 leading-relaxed">{content}</p>
          )}

          {columns && columns.length > 0 && (
            <div className="rounded-lg overflow-hidden border border-white/5">
              <div className="grid grid-cols-[140px_1fr] bg-white/[0.04] px-3 py-2 border-b border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Kolom</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cara Membaca</span>
              </div>
              {columns.map((col, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-[140px_1fr] px-3 py-2 gap-3 border-b border-white/5 last:border-0 ${
                    i % 2 === 0 ? "bg-white/[0.01]" : ""
                  }`}
                >
                  <span
                    className="font-mono text-xs font-semibold text-blue-400 truncate"
                    title={col.column}
                  >
                    {col.column}
                  </span>
                  <span className="text-xs text-slate-300 leading-relaxed">
                    {col.description}
                  </span>
                </div>
              ))}
            </div>
          )}

          {items && items.length > 0 && (
            <div className="space-y-1.5">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex gap-3 rounded-lg bg-white/[0.02] border border-white/5 px-3 py-2"
                >
                  <span className="text-xs font-semibold text-blue-400 w-32 shrink-0 pt-0.5">
                    {item.label}
                  </span>
                  <span className="text-xs text-slate-300 leading-relaxed">
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ContextualHelpModal({ pageId, isOpen, onClose }: ContextualHelpModalProps) {
  const guide = PAGE_GUIDES.find((p) => p.id === pageId);

  // Esc key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!guide) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal content box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-slate-900/90 text-white shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/6 px-6 py-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/10">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-600/15 border border-blue-500/20 text-xl shadow-inner">
                  {guide.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">Panduan: {guide.title}</h3>
                    <code className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-white/5 text-slate-400 border border-white/5">
                      {guide.url}
                    </code>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Penjelasan tata letak data dan kolom metrik</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 px-4 py-3 text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-blue-400">Tentang Halaman Ini:</span> {guide.summary}
              </div>

              {guide.sections.map((section, idx) => (
                <SectionBlock key={idx} {...section} />
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-white/6 bg-white/[0.02] px-6 py-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Pencarian detail lengkap tersedia di User Guide utama.
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-white/8 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  Tutup Panduan
                </button>
                <Link
                  href="/help"
                  className="flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/10 hover:bg-blue-500 transition-all"
                >
                  Buka Panduan Lengkap
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
