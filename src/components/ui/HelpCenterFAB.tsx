"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Search, PlayCircle, ChevronDown, ChevronUp, FileText, BookOpen } from 'lucide-react';
import { useTheme } from 'next-themes';

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

  const faqs = [
    {
      q: "Kenapa data Threats kosong (0)?",
      a: "Jika indikator Threats menunjukkan angka 0, artinya jaringan Anda aman dalam rentang waktu yang dipilih. Sistem tidak mendeteksi adanya paket data yang cocok dengan profil serangan yang diketahui."
    },
    {
      q: "Apa perbedaan Events dan Threats?",
      a: "Events adalah semua log aktivitas koneksi biasa yang tercatat di jaringan Anda (termasuk yang aman). Threats adalah sekumpulan Events khusus yang telah difilter dan diklasifikasikan sebagai aktivitas berbahaya oleh sistem Deep Packet Inspection (DPI)."
    },
    {
      q: "Bagaimana cara membaca Heatmap Geo Traffic?",
      a: "Warna biru muda menunjukkan trafik rendah, sedangkan warna biru pekat/tua menunjukkan volume trafik (download/upload) yang sangat tinggi dari/ke negara tersebut."
    },
    {
      q: "Berapa lama data disimpan?",
      a: "Untuk menjaga performa sistem, database MongoDB dikonfigurasi untuk secara otomatis menghapus data telemetri jaringan yang usianya lebih dari 7 hari."
    }
  ];

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
                  <p className="text-xs text-muted-foreground mt-0.5">BackOne Guide & Documentation</p>
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

                {/* Getting Started Video Cards */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" /> Getting Started
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="group cursor-pointer space-y-2">
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-800 dark:bg-slate-900 border border-border flex items-center justify-center group-hover:border-blue-500 transition-colors">
                        <PlayCircle className="h-8 w-8 text-white/70 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      </div>
                      <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">Dashboard Overview Tour</p>
                    </div>
                    <div className="group cursor-pointer space-y-2">
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-800 dark:bg-slate-900 border border-border flex items-center justify-center group-hover:border-blue-500 transition-colors">
                        <PlayCircle className="h-8 w-8 text-white/70 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      </div>
                      <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">How to Analyze Metadata</p>
                    </div>
                  </div>
                </div>

                {/* Documentation Links */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Quick Links
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors text-left">
                      <FileText className="h-4 w-4 text-blue-500" />
                      Read the Full Documentation
                    </button>
                    <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors text-left">
                      <FileText className="h-4 w-4 text-emerald-500" />
                      Integration with BackOne API
                    </button>
                  </div>
                </div>

                {/* FAQs */}
                <div className="space-y-3 pb-8">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" /> Frequently Asked Questions
                  </h3>
                  <div className="rounded-xl border border-border/50 bg-card px-4">
                    {faqs.map((faq, index) => (
                      <FAQItem key={index} question={faq.q} answer={faq.a} />
                    ))}
                  </div>
                </div>

              </div>
              
              {/* Footer */}
              <div className="border-t border-border/50 bg-secondary/30 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  BackOne &copy; 2026<br/>
                  PT. Data Bisnis Solusi
                </p>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
