"use client";

import { useState, useEffect } from "react";
import { useLookupCategories } from "@/lib/api";
import { getViewAsHeaders } from "@/lib/admin-api";
import { Card, CardContent } from "@/components/ui/Card";
import { DropdownFilterSelect } from "@/components/ui/DropdownFilterSelect";
import { Loader2, ShieldAlert, Plus, CheckCircle, AlertCircle } from "lucide-react";
import { BlacklistRule, BlacklistRulesTable } from "./BlacklistRulesTable";

export function BlacklistConfiguration() {
  const [rules, setRules] = useState<BlacklistRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");

  const [type, setType] = useState<'category' | 'domain'>('domain');
  const [customDomain, setCustomDomain] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: categories, isLoading: categoriesLoading } = useLookupCategories();

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/blacklist", {
        headers: getViewAsHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load blacklist rules");
      const json = await res.json();
      if (json.ok) {
        setRules(json.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    fetch('/api/auth/me', { headers: getViewAsHeaders() })
      .then(res => res.json())
      .then(d => {
        if (d.user?.role) {
          setUserRole(d.user.role);
        }
      })
      .catch(err => console.error("Failed to fetch user context:", err));
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'AGENT_VIEWER') return;
    setError(null);
    setSuccess(null);
    const value = type === 'category' ? selectedCategory : customDomain.trim();

    if (!value) {
      setError(`Please ${type === 'category' ? 'select a category' : 'input a domain'}`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/dashboard/blacklist", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getViewAsHeaders()
        },
        body: JSON.stringify({ type, value }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to add blacklist rule");
      }

      if (json.ok) {
        setSuccess(`Successfully added blacklist rule for ${value}`);
        setCustomDomain("");
        setSelectedCategory("");
        fetchRules();
      }
    } catch (err: any) {
      setError(err.message || "Failed to save blacklist rule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (userRole !== 'AGENT_VIEWER') return;
    setError(null);
    setSuccess(null);
    if (!confirm("Are you sure you want to remove this blacklist rule?")) return;

    try {
      const res = await fetch(`/api/dashboard/blacklist/${id}`, {
        method: "DELETE",
        headers: getViewAsHeaders(),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to delete blacklist rule");
      }
      setSuccess("Blacklist rule removed successfully");
      fetchRules();
    } catch (err: any) {
      setError(err.message || "Failed to delete blacklist rule");
    }
  };

  const canEdit = userRole === 'AGENT_VIEWER';

  return (
    <div className="space-y-6">
      {!canEdit && userRole && (
        <div className="flex items-start gap-3 p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl text-amber-400 text-sm leading-relaxed animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Management Restricted (Read-Only)</p>
            <p className="mt-1">
              You are currently viewing this dashboard as an administrator/analyst. Only Network Agents (or Admins in **View As Agent** mode) are authorized to modify blacklist rules.
            </p>
            {(userRole === 'SUPER_ADMIN' || userRole === 'TENANT_ADMIN') && (
              <p className="mt-2 text-xs text-amber-300/80">
                💡 To customize this blacklist, go to the <a href="/agents" className="underline hover:text-white font-semibold">Agents Inventory</a> tab and click the **View As** button on a specific agent.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className={`border-border/50 bg-card/60 backdrop-blur-xl transition-opacity duration-300 ${!canEdit ? 'opacity-60' : ''}`}>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Add Blacklist Rule
              </h3>

              <form onSubmit={handleAddRule} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Rule Type</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-lg border border-border/30">
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => { setType('domain'); setError(null); }}
                      className={`py-1.5 text-xs font-bold rounded-md transition-all disabled:opacity-50 ${
                        type === 'domain' ? "bg-primary text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Custom Domain
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => { setType('category'); setError(null); }}
                      className={`py-1.5 text-xs font-bold rounded-md transition-all disabled:opacity-50 ${
                        type === 'category' ? "bg-primary text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Category Group
                    </button>
                  </div>
                </div>

                {type === 'domain' ? (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Domain / Keyword</label>
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder={canEdit ? "E.g., tiktok.com or torrent" : "Restricted - View As Agent to edit"}
                      className="w-full bg-slate-900 border border-border/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none hover:border-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Select Category</label>
                    {categoriesLoading ? (
                      <div className="flex justify-center p-2"><Loader2 className="w-4 h-4 animate-spin text-slate-500" /></div>
                    ) : (
                      <DropdownFilterSelect
                        value={selectedCategory || "Select Category"}
                        onChange={canEdit ? setSelectedCategory : () => {}}
                        options={categories || []}
                        placeholder="Choose category..."
                      />
                    )}
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-500/30 rounded-lg text-xs text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-lg text-xs text-emerald-400">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                {canEdit ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Apply Rule</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-500 bg-secondary/15 rounded-lg border border-border/10 font-medium">
                    Read-only mode
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <BlacklistRulesTable
            rules={rules}
            loading={loading}
            canEdit={canEdit}
            onDeleteRule={handleDeleteRule}
          />
        </div>
      </div>
    </div>
  );
}
