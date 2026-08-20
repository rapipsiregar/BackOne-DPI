"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { Loader2, ShieldAlert, Tag, Globe, Trash2 } from "lucide-react";

export interface BlacklistRule {
  _id: string;
  type: 'category' | 'domain';
  value: string;
  is_active: boolean;
  agent_uuid?: string;
  created_at?: string;
}

interface BlacklistRulesTableProps {
  rules: BlacklistRule[];
  loading: boolean;
  canEdit: boolean;
  onDeleteRule: (id: string) => void;
}

export function BlacklistRulesTable({ rules, loading, canEdit, onDeleteRule }: BlacklistRulesTableProps) {
  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-xl">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Active Blacklist Rules</h3>

        {loading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center p-16 text-slate-500 bg-secondary/10 border border-border/30 rounded-xl">
            <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="font-semibold text-white/90">No blacklist rules configured</p>
            <p className="text-xs mt-1">Incoming flows matching blacklisted applications or categories will not trigger threats.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-300">
              <thead className="bg-secondary/40 text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-border/30">
                <tr>
                  <th className="p-3 w-[15%] text-center">Type</th>
                  <th className="p-3 w-[45%] text-center">Value</th>
                  <th className="p-3 w-[25%] text-center">Agent</th>
                  {canEdit && <th className="p-3 w-[15%] text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {rules.map((rule) => (
                  <tr key={rule._id} className="hover:bg-secondary/10 transition-colors">
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${
                        rule.type === 'category' 
                          ? "bg-purple-950/40 text-purple-400 border border-purple-500/20" 
                          : "bg-blue-950/40 text-blue-400 border border-blue-500/20"
                      }`}>
                        {rule.type === 'category' ? <Tag className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                        {rule.type}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-white text-xs">{rule.value}</td>
                    <td className="p-3 text-center font-mono text-slate-400 text-[11px] truncate max-w-[120px]" title={rule.agent_uuid}>
                      {rule.agent_uuid || "-"}
                    </td>
                    {canEdit && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onDeleteRule(rule._id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
