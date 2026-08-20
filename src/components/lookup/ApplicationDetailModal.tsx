"use client";

import { LookupApp } from "@/lib/api";
import { X, Info, Tag, Box, Shield, Server, AppWindow } from "lucide-react";

interface ApplicationDetailModalProps {
  app: LookupApp | null;
  isClosing: boolean;
  onClose: () => void;
}

export function ApplicationDetailModal({ app, isClosing, onClose }: ApplicationDetailModalProps) {
  if (!app) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div 
        className={`absolute inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-sm ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`} 
      />
      <div 
        className={`relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl shadow-black/60 overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6 sm:px-8 sm:pb-8 relative -mt-16">
          <div className="w-24 h-24 bg-card rounded-2xl border-4 border-card flex items-center justify-center overflow-hidden shadow-xl relative z-10 mb-4 bg-secondary">
            {app.logo || app.favicon ? (
              <img 
                src={app.logo || app.favicon} 
                alt={app.label} 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  const img = e.target as HTMLElement;
                  img.style.display = 'none';
                  const sibling = img.nextSibling as HTMLElement;
                  if (sibling) sibling.style.display = 'block';
                }}
              />
            ) : null}
            <AppWindow className="w-12 h-12 text-slate-400" style={{ display: (app.logo || app.favicon) ? 'none' : 'block' }} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{app.label}</h2>
              {app.application_category?.label && (
                <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest rounded-full">
                  {app.application_category.label}
                </span>
              )}
            </div>
            {app.full_name && app.full_name !== app.label && (
              <p className="text-slate-400 font-medium">{app.full_name}</p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-start gap-3 text-slate-300 bg-secondary/30 p-4 rounded-xl border border-border/30">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">
                  {app.description || "No detailed description provided for this application or service."}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">System Metadata</h3>
              
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/20">
                <div className="flex items-center gap-2 text-slate-400">
                  <Box className="w-4 h-4" />
                  <span className="text-sm">App ID</span>
                </div>
                <span className="text-sm font-mono text-white bg-secondary/50 px-2 py-0.5 rounded">{app.id}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/20">
                <div className="flex items-center gap-2 text-slate-400">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm">System Name</span>
                </div>
                <span className="text-sm font-mono text-white bg-secondary/50 px-2 py-0.5 rounded">{app.name || 'N/A'}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/20">
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Tag / Alias</span>
                </div>
                <span className="text-sm font-mono text-white bg-secondary/50 px-2 py-0.5 rounded">
                  {app.tag?.replace(/^backone\./i, "") || 'N/A'}
                </span>
              </div>
            </div>

            {app.application_category && (
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Category Info</h3>
                
                <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/20">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Server className="w-4 h-4" />
                    <span className="text-sm">Category ID</span>
                  </div>
                  <span className="text-sm font-mono text-white bg-secondary/50 px-2 py-0.5 rounded">{app.application_category.id}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/20">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Info className="w-4 h-4" />
                    <span className="text-sm">Category Tag</span>
                  </div>
                  <span className="text-sm font-mono text-white bg-secondary/50 px-2 py-0.5 rounded">
                    {app.application_category.tag?.replace(/^backone\./i, "")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
