"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useTenantConfig } from "@/contexts/TenantConfigContext";
import { FAQS } from "@/lib/helpContent";

// ─── Expandable FAQ Item ───────────────────────────────────────────────────────
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border/50 py-3 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none gap-3"
      >
        <span className="text-sm font-medium text-foreground leading-snug">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pt-2 text-sm text-muted-foreground leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main FAB Component ────────────────────────────────────────────────────────
export function HelpCenterFAB() {
  const { tenantConfig } = useTenantConfig();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-colors"
        aria-label="Help and Resources"
      >
        <HelpCircle className="h-6 w-6" />
        <span className="absolute -inset-1 animate-ping rounded-full bg-blue-400 opacity-20" />
      </motion.button>

      {/* Drawer Overlay + Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-background/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Help &amp; Resources</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">User Guide &amp; Documentation</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                {/* Full User Guide Banner */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Documentation
                  </h3>
                  <Link
                    href="/help"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-blue-500/30 bg-blue-600/10 px-4 py-3 hover:bg-blue-600/20 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-blue-500 dark:text-blue-400">
                        Read Full User Guide
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Panduan membaca data per halaman, tab, dan kolom tabel
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {/* FAQs */}
                <div className="space-y-2 pb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" /> Frequently Asked Questions
                  </h3>
                  <div className="rounded-xl border border-border/50 bg-card px-4">
                    {FAQS.map((faq, index) => (
                      <FAQItem key={index} question={faq.question} answer={faq.answer} />
                    ))}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="border-t border-border/50 bg-secondary/30 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  {tenantConfig?.brandName || "DPI Dashboard"} &copy; 2026
                  <br />
                  {tenantConfig?.footerCopyright || "PT. Data Bisnis Solusi"}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
