"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useTenantConfig } from '@/contexts/TenantConfigContext';
import { FAQS } from '@/lib/helpContent';

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-border/50 py-3">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <span className="text-sm font-medium text-foreground">{question}</span>
        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pt-2 text-sm text-muted-foreground leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function HelpCenterFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalActive, setIsModalActive] = useState(false);
  const { tenantConfig } = useTenantConfig();

  useEffect(() => {
    const checkModalState = () => {
      const isLocked = document.body.style.overflow === "hidden";
      const hasModalInDom = Boolean(
        document.querySelector(".animate-modal-in") || 
        document.querySelector('[role="dialog"]')
      );
      setIsModalActive(isLocked || hasModalInDom);
    };
    
    checkModalState();

    const observer = new MutationObserver(checkModalState);
    observer.observe(document.body, { attributes: true, attributeFilter: ["style", "class"], childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const brandName = tenantConfig?.brandName || "System";
  const footerCopyright = tenantConfig?.footerCopyright || `${brandName} &copy; 2026`;

  const filteredFaqs = FAQS.filter(
    faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isModalActive) return null;

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="help-center-fab fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-30 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-colors"
        aria-label="Help and Resources"
      >
        <HelpCircle className="h-6 w-6" />
        {/* Pulse effect */}
        <span className="absolute -inset-1 animate-ping rounded-full bg-blue-400 opacity-20"></span>
      </motion.button>

      {/* Drawer Overlay */}
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
            
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Help & Resources</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{brandName} Guide & Documentation</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search articles or FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>




                {/* FAQs */}
                <div className="space-y-3 pb-8">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" /> Frequently Asked Questions
                  </h3>
                  <div className="rounded-xl border border-border/50 bg-card px-4">
                    {filteredFaqs.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-4 text-center">No matching FAQs found</p>
                    ) : (
                      filteredFaqs.map((faq, index) => (
                        <FAQItem key={index} question={faq.question} answer={faq.answer} />
                      ))
                    )}
                  </div>
                </div>

              </div>
              
              {/* Footer */}
              <div className="border-t border-border/50 bg-secondary/30 p-4 text-center">
                <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: footerCopyright }} />
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
