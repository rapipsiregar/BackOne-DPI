"use client";

import { X, Info, Box, Tag, Shield, Server, AppWindow } from "lucide-react";
import { LookupApp } from "@/lib/api";

interface AppLookupDetailModalProps {
  selectedApp: LookupApp;
  isClosingModal: boolean;
  handleCloseModal: () => void;
}

export function AppLookupDetailModal({ selectedApp, isClosingModal, handleCloseModal }: AppLookupDetailModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={handleCloseModal}>
      <div 
        className={`absolute inset-0 bg-black/40 dark:bg-black/75 backdrop-blur-sm ${isClosingModal ? 'animate-overlay-out' : 'animate-overlay-in'}`} 
      />
      <div 
        className={`relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl shadow-black/60 overflow-hidden ${isClosingModal ? 'animate-modal-out' : 'animate-modal-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Background */}
        <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent relative">
          <button 
            onClick={handleCloseModal}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 sm:px-8 sm:pb-8 relative -mt-16">
          {/* Icon/Logo */}
          <div className="w-24 h-24 bg-card rounded-2xl border-4 border-card flex items-center justify-center overflow-hidden shadow-xl relative z-10 mb-4 bg-secondary">
            {selectedApp.logo || selectedApp.favicon ? (
              <img 
                src={selectedApp.logo || selectedApp.favicon} 
                alt={selectedApp.label} 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  const img = e.target as HTMLElement;
                  img.style.display = 'none';
                  const sibling = img.nextSibling as HTMLElement;
                  if (sibling) sibling.style.display = 'block';
                }}
              />
            ) : null}
            <AppWindow className="w-12 h-12 text-slate-400" style={{ display: (selectedApp.logo || selectedApp.favicon) ? 'none' : 'block' }} />
          </div>

          {/* Title & Category */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{selectedApp.label}</h2>
              {selectedApp.application_category?.label && (
                <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest rounded-full">
                  {selectedApp.application_category.label}
                </span>
              )}
            </div>
            {selectedApp.full_name && selectedApp.full_name !== selectedApp.label && (
              <p className="text-slate-400 font-medium">{selectedApp.full_name}</p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Description */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-start gap-3 text-slate-300 bg-secondary/30 p-4 rounded-xl border border-border/30">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">
                  {selectedApp.description || "No detailed description provided for this application or service."}
                </p>
              </div>
            </div>

            {/* Metadata Info */}
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">System Metadata</h3>
              
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/20">
                <div className="flex items-center gap-2 text-slate-400">
                  <Box className="w-4 h-4" />
                  <span className="text-sm">App ID</span>
                </div>
                <span className="text-sm font-mono text-white bg-secondary/50 px-2 py-0.5 rounded">{selectedApp.id}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/20">
                <div className="flex items-center gap-2 text-slate-400">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm">System Name</span>
                </div>
                <span className="text-sm font-mono text-white bg-secondary/50 px-2 py-0.5 rounded">{selectedApp.name || 'N/A'}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/20">
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Tag / Alias</span>
                </div>
                <span className="text-sm font-mono text-white bg-secondary/50 px-2 py-0.5 rounded">{selectedApp.tag || 'N/A'}</span>
              </div>
            </div>

            {/* Application Category Detail */}
            {selectedApp.application_category && (
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Category Info</h3>
                
                <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/20">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Server className="w-4 h-4" />
                    <span className="text-sm">Category ID</span>
                  </div>
                  <span className="text-sm font-mono text-white bg-secondary/50 px-2 py-0.5 rounded">{selectedApp.application_category.id}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/20">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Info className="w-4 h-4" />
                    <span className="text-sm">Category Tag</span>
                  </div>
                  <span className="text-sm font-mono text-white bg-secondary/50 px-2 py-0.5 rounded">{selectedApp.application_category.tag}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
