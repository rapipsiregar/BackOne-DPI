"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight, Home, Radio, Shuffle, Package, Monitor,
  Globe2, BarChart3, Map, Shield, Bell, Lock, BookOpen,
  ChevronDown, ChevronUp, Info, ArrowLeft,
  Activity, Globe, Search
} from "lucide-react";
import { PAGE_GUIDES, UI_CONVENTIONS, type PageGuide } from "@/lib/helpContent";

const ICON_MAP: Record<string, React.ReactNode> = {
  overview: <Home className="h-4 w-4" />,
  agents: <Radio className="h-4 w-4" />,
  flows: <Shuffle className="h-4 w-4" />,
  apps: <Package className="h-4 w-4" />,
  devices: <Monitor className="h-4 w-4" />,
  dns: <Globe2 className="h-4 w-4" />,
  "network-intelligence": <BarChart3 className="h-4 w-4" />,
  "dpi-analytics": <Activity className="h-4 w-4" />,
  geography: <Map className="h-4 w-4" />,
  intelligence: <Shield className="h-4 w-4" />,
  events: <Bell className="h-4 w-4" />,
  "security-audit": <Lock className="h-4 w-4" />,
  "network-infrastructure": <Globe className="h-4 w-4" />,
  lookup: <Search className="h-4 w-4" />,
};

function SectionBlock({ heading, content, steps, columns, items }: PageGuide["sections"][0]) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-white/8 bg-gradient-to-b from-slate-900/80 to-slate-900/40 overflow-hidden shadow-lg">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-white/4 transition-colors text-left group"
      >
        <span className="text-xs sm:text-sm font-semibold text-white/90 group-hover:text-white transition-colors">{heading}</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 group-hover:bg-white/10 transition-colors shrink-0">
          {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </span>
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 space-y-3 border-t border-white/5">
          {content && <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{content}</p>}
          {steps && (
            <ol className="space-y-2">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 sm:gap-3 items-start">
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/30 border border-blue-500/40 text-[10px] font-bold text-blue-300 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-300 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          )}
          {columns && (
            <div className="rounded-xl overflow-hidden border border-white/8">
              <div className="hidden sm:grid grid-cols-[160px_1fr] bg-gradient-to-r from-blue-600/20 to-indigo-600/10 px-4 py-2 border-b border-white/8">
                <span className="text-[10.5px] font-bold uppercase tracking-widest text-blue-400">Column / Field</span>
                <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400">How to Read</span>
              </div>
              {columns.map((col, i) => (
                <div key={i} className={`flex flex-col sm:grid sm:grid-cols-[160px_1fr] px-3.5 sm:px-4 py-2.5 sm:py-3 gap-1 sm:gap-4 border-b border-white/5 last:border-0 ${i % 2 === 0 ? "bg-white/[0.02]" : ""} hover:bg-white/[0.04] transition-colors`}>
                  <span className="font-mono text-xs font-semibold text-blue-400 self-start truncate" title={col.column}>{col.column}</span>
                  <span className="text-xs text-slate-300 leading-relaxed">{col.description}</span>
                </div>
              ))}
            </div>
          )}
          {items && (
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-1 sm:gap-3 rounded-xl bg-white/[0.03] border border-white/6 px-3.5 sm:px-4 py-2.5 sm:py-3 hover:bg-white/[0.05] transition-colors">
                  <span className="text-xs font-semibold text-blue-400 sm:w-44 shrink-0">{item.label}</span>
                  <span className="text-xs text-slate-300 leading-relaxed">{item.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [activeId, setActiveId] = useState("overview");
  const activePage = PAGE_GUIDES.find(p => p.id === activeId);

  return (
    <div className="min-h-screen bg-[#080b14] text-white pb-12">
      {/* ── Hero Header ── */}
      <div className="relative border-b border-white/6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 shrink-0">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white">User Guide</h1>
              <p className="text-xs text-slate-400">Guide to reading Deep Packet Inspection dashboard data</p>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all group shrink-0">
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-5 lg:gap-6 px-4 sm:px-8 py-4 sm:py-6">
        {/* ── Responsive Page Navigation ── */}
        <aside className="w-full lg:w-52 shrink-0">
          <div className="lg:sticky lg:top-6 space-y-1">
            <p className="px-1 sm:px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Dashboard Pages</p>
            <div className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar whitespace-nowrap lg:whitespace-normal">
              {PAGE_GUIDES.map(page => {
                const isActive = activeId === page.id;
                return (
                  <button
                    key={page.id}
                    onClick={() => setActiveId(page.id)}
                    className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all shrink-0 lg:shrink lg:w-full ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-white border border-blue-500/30 shadow-md shadow-blue-500/10"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    {isActive && <span className="hidden lg:block absolute left-0 top-1/4 h-1/2 w-0.5 rounded-full bg-blue-500" />}
                    <span className={`shrink-0 ${isActive ? "text-blue-400" : "text-slate-500"}`}>{ICON_MAP[page.id] ?? <Info className="h-4 w-4" />}</span>
                    <span>{page.title}</span>
                    {isActive && <ChevronRight className="hidden lg:block ml-auto h-3 w-3 text-blue-400 shrink-0" />}
                  </button>
                );
              })}
              <button
                onClick={() => setActiveId("conventions")}
                className={`relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all shrink-0 lg:shrink lg:w-full ${
                  activeId === "conventions"
                    ? "bg-gradient-to-r from-blue-600/30 to-indigo-600/20 text-white border border-blue-500/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent"
                }`}
              >
                {activeId === "conventions" && <span className="hidden lg:block absolute left-0 top-1/4 h-1/2 w-0.5 rounded-full bg-blue-500" />}
                <Info className={`h-4 w-4 shrink-0 ${activeId === "conventions" ? "text-blue-400" : "text-slate-500"}`} />
                <span>Visual Conventions</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ── Content Area ── */}
        <main className="flex-1 min-w-0 space-y-4">
          {activeId === "conventions" ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-slate-900/80 to-slate-800/30 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-500/30 text-lg">🎨</span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">Visual Conventions</h2>
                    <p className="text-xs text-slate-400">Guide to reading indicators and symbols across dashboard pages</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 overflow-hidden shadow-lg">
                <div className="hidden sm:grid grid-cols-[160px_1fr] bg-gradient-to-r from-purple-600/20 to-indigo-600/10 px-4 py-2.5 border-b border-white/8">
                  <span className="text-[10.5px] font-bold uppercase tracking-widest text-purple-400">Symbol / Element</span>
                  <span className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400">Meaning</span>
                </div>
                {UI_CONVENTIONS.map((c, i) => (
                  <div key={i} className={`flex flex-col sm:grid sm:grid-cols-[160px_1fr] px-4 py-3 gap-1 sm:gap-4 border-b border-white/5 last:border-0 ${i % 2 === 0 ? "bg-white/[0.02]" : ""} hover:bg-white/[0.04] transition-colors`}>
                    <span className="font-mono text-xs font-semibold text-purple-400">{c.symbol}</span>
                    <span className="text-xs text-slate-300 leading-relaxed">{c.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : activePage ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-slate-900/80 to-slate-800/30 p-4 sm:p-5 shadow-xl">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-600/20 border border-blue-500/20 text-xl sm:text-2xl shrink-0">
                    {activePage.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-bold text-white">{activePage.title}</h2>
                      <code className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg font-mono bg-white/6 text-slate-400 border border-white/8">
                        {activePage.url}
                      </code>
                    </div>
                    <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">{activePage.summary}</p>
                  </div>
                </div>
              </div>
              {activePage.sections.map((section, i) => (
                <SectionBlock key={i} {...section} />
              ))}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
