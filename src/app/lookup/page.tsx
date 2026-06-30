"use client";

import { useState, useEffect } from "react";
import { useLookupApplications, LookupApp } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, Search, AppWindow, HelpCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export default function LookupPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 24; // 24 items per page fits a 2, 3, or 4 column grid perfectly

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search query input to avoid spamming requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on new search
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data, isLoading, error } = useLookupApplications(page, limit, debouncedSearch);

  if (!mounted) return null;

  const applications = data?.applications || [];
  const pagination = data?.pagination || { total_records: 0, total_pages: 1, current_page: 1 };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          Application Database
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
        </h1>
        <p className="text-slate-400 mt-2">
          Search Netify's extensive classification database of over 2,500+ apps, protocols, and services.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-md w-full animate-slide-up" style={{ animationDelay: '50ms' }}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by app name or tag (e.g. facebook, openvpn)..."
          className="w-full bg-card/60 backdrop-blur-xl border border-border/60 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 transition-all duration-200"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Cards Grid */}
      {error ? (
        <div className="p-8 bg-red-950/20 border border-red-500/30 rounded-xl text-center text-red-400">
          <p className="font-semibold">Failed to load application lookup database</p>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      ) : applications.length === 0 && !isLoading ? (
        <div className="p-16 bg-card/40 border border-border/50 rounded-2xl text-center text-slate-400 max-w-lg mx-auto">
          <AppWindow className="h-12 w-12 mx-auto mb-4 text-slate-500" />
          <p className="font-semibold text-white">No applications found</p>
          <p className="text-sm mt-1">Try refining your search keyword or clearing the input.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            {applications.map((app: LookupApp) => (
              <Card 
                key={app.id} 
                className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-primary/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="p-5 flex flex-col h-full justify-between gap-4">
                  {/* Top: Icon + Title */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-lg bg-secondary/80 flex items-center justify-center overflow-hidden border border-border/40 group-hover:border-primary/20 transition-all">
                        {app.favicon || app.logo ? (
                          <img 
                            src={app.favicon || app.logo} 
                            alt={app.label} 
                            className="h-6 w-6 object-contain"
                            onError={(e) => {
                              // If image fails, replace with default icon
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <AppWindow className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                        {app.application_category?.label || "Unclassified"}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-white group-hover:text-primary transition-colors text-base line-clamp-1">
                        {app.label}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{app.tag}</p>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mt-2">
                      {app.description || "No description provided for this application definition."}
                    </p>
                  </div>

                  {/* Bottom: ID and system information */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/30 text-[10px] text-slate-500 font-mono">
                    <span>ID: {app.id}</span>
                    <span>{app.name || "N/A"}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50 text-slate-400 text-sm animate-slide-up" style={{ animationDelay: '150ms' }}>
              <div>
                Showing <span className="text-white font-medium">{((page - 1) * limit) + 1}</span> to{" "}
                <span className="text-white font-medium">
                  {Math.min(page * limit, pagination.total_records)}
                </span>{" "}
                of <span className="text-white font-medium">{pagination.total_records}</span> entries
              </div>

              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1 || isLoading}
                  className="p-2 rounded-lg bg-card border border-border/50 text-slate-400 hover:bg-secondary disabled:opacity-30 disabled:hover:bg-card transition-colors"
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Prev Page */}
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1 || isLoading}
                  className="p-2 rounded-lg bg-card border border-border/50 text-slate-400 hover:bg-secondary disabled:opacity-30 disabled:hover:bg-card transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page indicators */}
                <span className="px-4 py-1.5 rounded-lg bg-secondary/50 border border-border/30 text-white font-mono">
                  {page} / {pagination.total_pages}
                </span>

                {/* Next Page */}
                <button
                  onClick={() => setPage(p => Math.min(p + 1, pagination.total_pages))}
                  disabled={page === pagination.total_pages || isLoading}
                  className="p-2 rounded-lg bg-card border border-border/50 text-slate-400 hover:bg-secondary disabled:opacity-30 disabled:hover:bg-card transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setPage(pagination.total_pages)}
                  disabled={page === pagination.total_pages || isLoading}
                  className="p-2 rounded-lg bg-card border border-border/50 text-slate-400 hover:bg-secondary disabled:opacity-30 disabled:hover:bg-card transition-colors"
                  title="Last Page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
