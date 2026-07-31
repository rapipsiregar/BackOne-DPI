"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Loader2, Plus } from "lucide-react";
import { Agent } from "@/lib/actions/agentsCore";

interface AgentsTableSectionProps {
  agents: Agent[];
  isLoading: boolean;
  columns: Column<Agent>[];
  role: string | null;
  isViewAsActive?: boolean;
  onProvisionClick?: () => void;
}

export default function AgentsTableSection({
  agents,
  isLoading,
  columns,
  role,
  isViewAsActive,
  onProvisionClick,
}: AgentsTableSectionProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-white">Provisioned Network Agents ({agents.length})</CardTitle>
        {!isViewAsActive && (role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') && onProvisionClick && (
          <button 
            onClick={onProvisionClick}
            className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/10"
          >
            <Plus className="w-4 h-4" />
            Provision Agent
          </button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            data={agents}
            columns={columns}
            searchPlaceholder="Search agents..."
            searchFilter={(row, query) => {
              const q = query.toLowerCase();
              return (
                (row.uuid || "").toLowerCase().includes(q) ||
                (row.serial || "").toLowerCase().includes(q) ||
                (row.label || "").toLowerCase().includes(q)
              );
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
