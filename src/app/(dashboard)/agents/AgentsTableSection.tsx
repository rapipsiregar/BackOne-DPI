"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Loader2 } from "lucide-react";
import { Agent } from "@/lib/actions/agents";

interface AgentsTableSectionProps {
  agents: Agent[];
  isLoading: boolean;
  columns: Column<Agent>[];
}

export default function AgentsTableSection({
  agents,
  isLoading,
  columns,
}: AgentsTableSectionProps) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="text-white">Provisioned Network Agents ({agents.length})</CardTitle>
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
