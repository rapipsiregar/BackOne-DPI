"use client";

import { Users, Plus, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { type ManagedUser } from "@/lib/admin-api";
import { Column } from "@/components/ui/DataTable";

export interface CompanyGroup {
  name: string;
  users: ManagedUser[];
}

interface CompanyCardProps {
  company: CompanyGroup;
  role: string | null;
  columns: Column<ManagedUser>[];
  onAddUserClick: (companyName: string) => void;
}

export default function CompanyCard({
  company,
  role,
  columns,
  onAddUserClick,
}: CompanyCardProps) {
  const count = company.users.length;
  const isLimitReached = count >= 5;

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden shadow-xl shadow-black/10">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg shadow-sm">
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-white text-base font-bold">{company.name} Accounts</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                isLimitReached 
                  ? "bg-red-500/10 text-red-400 border-red-500/20" 
                  : "bg-slate-500/10 text-slate-400 border-slate-500/20"
              }`}>
                Accounts: {count} / 5
              </span>
              {isLimitReached && (
                <span className="text-[10px] text-red-400 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Max limit reached
                </span>
              )}
            </div>
          </div>
        </div>

        {role !== "EXECUTIVE" && (
          <button
            type="button"
            onClick={() => onAddUserClick(company.name)}
            disabled={isLimitReached}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border cursor-pointer ${
              isLimitReached
                ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                : "bg-amber-600/10 text-amber-400 hover:bg-amber-600/20 border-amber-500/30 hover:border-amber-500/50 shadow-md shadow-amber-600/5"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Add User for {company.name}
          </button>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <DataTable
          data={company.users}
          columns={columns}
          searchPlaceholder={`Search users in ${company.name}...`}
          searchFilter={(row, query) => {
            const q = query.toLowerCase();
            return (
              (row.username || "").toLowerCase().includes(q) ||
              (row.account_name || "").toLowerCase().includes(q) ||
              (row.role || "").toLowerCase().includes(q)
            );
          }}
        />
      </CardContent>
    </Card>
  );
}
