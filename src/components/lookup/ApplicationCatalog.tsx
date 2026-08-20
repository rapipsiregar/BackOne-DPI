"use client";

import { useState, useEffect } from "react";
import { useLookupApplications, useLookupCategories, LookupApp } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { DropdownFilterSelect } from "@/components/ui/DropdownFilterSelect";
import { Loader2, Search, AppWindow, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { ApplicationDetailModal } from "./ApplicationDetailModal";

export function ApplicationCatalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState<LookupApp | null>(null);
  const [isClosingModal, setIsClosingModal] = useState(false);
  const limit = 24;

  const handleCloseModal = () => {
    setIsClosingModal(true);
    setTimeout(() => {
      setSelectedApp(null);
      setIsClosingModal(false);
    }, 480);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data, isLoading, error } = useLookupApplications(page, limit, debouncedSearch, selectedCategory);
  const { data: categories, error: categoriesError } = useLookupCategories();

  useEffect(() => {
    if (categoriesError) {
      console.error("Failed to fetch categories:", categoriesError);
    }
  }, [categoriesError]);

  const applications = data?.applications || [];
  const pagination = data?.pagination || { total_records: 0, total_pages: 1, current_page: 1 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 animate-slide-up relative z-50" style={{ animationDelay: '50ms' }}>
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by app name or tag (e.g. facebook, openvpn)..."
            className="w-full bg-slate-900 border border-border/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none hover:border-slate-700 transition-all duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="relative w-full sm:w-64 z-50">
          <DropdownFilterSelect
            value={selectedCategory || "All"}
            onChange={(val) => {
              setSelectedCategory(val === "All" ? "" : val);
              setPage(1);
            }}
            options={categories || []}
            placeholder="All Categories"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-8 bg-red-950/20 border border-red-500/30 rounded-xl text-center text-red-400">
          <p className="font-semibold">Failed to load application lookup database</p>
          <p className="text-sm mt-1">{(error as any).message}</p>
        </div>
      ) : applications.length === 0 ? (
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
                onClick={() => setSelectedApp(app)}
                className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border-border/50 hover:bg-card/100 hover:border-primary/40 transition-all duration-300 flex flex-col justify-between cursor-pointer"
              >
                <div className="p-5 flex flex-col h-full justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 rounded-lg bg-secondary/80 flex items-center justify-center overflow-hidden border border-border/40 group-hover:border-primary/20 transition-all">
                        {app.favicon || app.logo ? (
                          <>
                            <img 
                              src={app.favicon || app.logo} 
                              alt={app.label} 
                              className="h-6 w-6 object-contain"
                              onError={(e) => {
                                const img = e.target as HTMLElement;
                                img.style.display = 'none';
                                const sibling = img.nextSibling as HTMLElement;
                                if (sibling) sibling.style.display = 'block';
                              }}
                            />
                            <AppWindow className="h-5 w-5 text-slate-400" style={{ display: 'none' }} />
                          </>
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
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {app.tag?.replace(/^backone\./i, "")}
                      </p>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mt-2">
                      {app.description || "No description provided for this application definition."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/30 text-[10px] text-slate-500 font-mono">
                    <span>ID: {app.id}</span>
                    <span>{app.name || "N/A"}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

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
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1 || isLoading}
                  className="p-2 rounded-lg bg-card border border-border/50 text-slate-400 hover:bg-secondary disabled:opacity-30 disabled:hover:bg-card transition-colors"
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1 || isLoading}
                  className="p-2 rounded-lg bg-card border border-border/50 text-slate-400 hover:bg-secondary disabled:opacity-30 disabled:hover:bg-card transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="px-4 py-1.5 rounded-lg bg-secondary/50 border border-border/30 text-white font-mono">
                  {page} / {pagination.total_pages}
                </span>

                <button
                  onClick={() => setPage(p => Math.min(p + 1, pagination.total_pages))}
                  disabled={page === pagination.total_pages || isLoading}
                  className="p-2 rounded-lg bg-card border border-border/50 text-slate-400 hover:bg-secondary disabled:opacity-30 disabled:hover:bg-card transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

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

      <ApplicationDetailModal
        app={selectedApp}
        isClosing={isClosingModal}
        onClose={handleCloseModal}
      />
    </div>
  );
}
