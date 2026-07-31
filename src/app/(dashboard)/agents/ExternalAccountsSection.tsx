"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Plus, Loader2 } from "lucide-react";
import { type ManagedUser } from "@/lib/admin-api";

import { getSiteBranding } from "@/lib/branding";

interface ExternalAccountsSectionProps {
  role: string | null;
  isLoading: boolean;
  externalUsers: ManagedUser[];
  superadminUsers: ManagedUser[];
  siabUsers: ManagedUser[];
  nexusUsers: ManagedUser[];
  externalColumns: Column<ManagedUser>[];
  setExternalModalUser: (user: ManagedUser | null) => void;
  setTargetSiteUuid: (uuid: string | null) => void;
  setTargetCreatedBy: (createdBy: string | null) => void;
  setExternalModalOpen: (open: boolean) => void;
}

export default function ExternalAccountsSection({
  role,
  isLoading,
  externalUsers,
  superadminUsers,
  siabUsers,
  nexusUsers,
  externalColumns,
  setExternalModalUser,
  setTargetSiteUuid,
  setTargetCreatedBy,
  setExternalModalOpen,
}: ExternalAccountsSectionProps) {
  const siteUuid = typeof window !== 'undefined' ? (localStorage.getItem('backone_site_uuid') || undefined) : undefined;
  const branding = getSiteBranding(siteUuid);

  if (role === 'SUPER_ADMIN') {
    return (
      <div className="space-y-6">
        {/* Table 1: Superadmin Accounts */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <span>Superadmin ({branding.name}) External Accounts ({superadminUsers.length})</span>
            </CardTitle>
            <button
              onClick={() => {
                setExternalModalUser(null);
                setTargetSiteUuid(null);
                setTargetCreatedBy('admin');
                setExternalModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Technical Account
            </button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <DataTable
                data={superadminUsers}
                columns={externalColumns}
                searchPlaceholder="Search accounts..."
                searchFilter={(row, query) => {
                  const q = query.toLowerCase();
                  return (
                    (row.username || "").toLowerCase().includes(q) ||
                    (row.account_name || "").toLowerCase().includes(q) ||
                    (row.role || "").toLowerCase().includes(q)
                  );
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Table 2: SIAB Accounts */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white">SIAB Tenant External Accounts ({siabUsers.length})</CardTitle>
            <button
              onClick={() => {
                setExternalModalUser(null);
                setTargetSiteUuid('6681452d_9cae_4ff4_8ae8_0d504774265e');
                setTargetCreatedBy('siab');
                setExternalModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Technical Account
            </button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <DataTable
                data={siabUsers}
                columns={externalColumns}
                searchPlaceholder="Search accounts..."
                searchFilter={(row, query) => {
                  const q = query.toLowerCase();
                  return (
                    (row.username || "").toLowerCase().includes(q) ||
                    (row.account_name || "").toLowerCase().includes(q) ||
                    (row.role || "").toLowerCase().includes(q)
                  );
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Table 3: Nexus Accounts */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white">Nexus Tenant External Accounts ({nexusUsers.length})</CardTitle>
            <button
              onClick={() => {
                setExternalModalUser(null);
                setTargetSiteUuid('d7902405_0dc2_458b_8584_ed4d24b64f24');
                setTargetCreatedBy('nexus');
                setExternalModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Technical Account
            </button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <DataTable
                data={nexusUsers}
                columns={externalColumns}
                searchPlaceholder="Search accounts..."
                searchFilter={(row, query) => {
                  const q = query.toLowerCase();
                  return (
                    (row.username || "").toLowerCase().includes(q) ||
                    (row.account_name || "").toLowerCase().includes(q) ||
                    (row.role || "").toLowerCase().includes(q)
                  );
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role === 'TENANT_ADMIN') {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-white">External Accounts Inventory ({externalUsers.length})</CardTitle>
          <button
            onClick={() => {
              setExternalModalUser(null);
              setTargetSiteUuid(null);
              setTargetCreatedBy(null);
              setExternalModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Technical Account
          </button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              data={externalUsers}
              columns={externalColumns}
              searchPlaceholder="Search accounts..."
              searchFilter={(row, query) => {
                const q = query.toLowerCase();
                return (
                  (row.username || "").toLowerCase().includes(q) ||
                  (row.account_name || "").toLowerCase().includes(q) ||
                  (row.role || "").toLowerCase().includes(q)
                );
              }}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // EXECUTIVE: read-only view of all accounts, no create/edit buttons
  if (role === 'EXECUTIVE') {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <span>External Accounts Directory ({externalUsers.length})</span>
          </CardTitle>
          <span className="text-xs text-slate-500 italic px-3 py-1.5 border border-slate-700/50 rounded-lg">Read-Only View</span>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              data={externalUsers}
              columns={externalColumns}
              searchPlaceholder="Search accounts..."
              searchFilter={(row, query) => {
                const q = query.toLowerCase();
                return (
                  (row.username || "").toLowerCase().includes(q) ||
                  (row.account_name || "").toLowerCase().includes(q) ||
                  (row.role || "").toLowerCase().includes(q)
                );
              }}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
