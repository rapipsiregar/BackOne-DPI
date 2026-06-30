"use client";

import { useState, useEffect, useMemo } from "react";
import { useCountries } from "@/lib/api";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";
import { fmtBytes } from "@/lib/utils";
import { WorldMap } from "@/components/ui/WorldMap";

export default function GeographyPage() {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useCountries(50); // fetch 50 countries

  useEffect(() => {
    setMounted(true);
  }, []);

  const mapData = useMemo(() => {
    if (!data) return [];
    return data.map((row) => ({
      countryCode: row.country_code,
      value: row.download + row.upload,
      label: row.country_name,
    }));
  }, [data]);

  if (!mounted) return null;

  const columns: Column<typeof data[0]>[] = [
    { header: "#", accessor: (row, i) => i + 1 },
    { 
      header: "Country", 
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.country_code && (
            <img 
              src={`https://flagcdn.com/w20/${row.country_code.toLowerCase()}.png`} 
              alt={row.country_code}
              className="w-5 h-auto rounded-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <span>{row.country_name}</span>
        </div>
      )
    },
    { header: "Country Code", accessor: (row) => row.country_code },
    { 
      header: "Download", 
      accessor: (row) => <span className="text-blue-400">{fmtBytes(row.download)}</span> 
    },
    { 
      header: "Upload", 
      accessor: (row) => <span className="text-green-500">{fmtBytes(row.upload)}</span> 
    },
    { 
      header: "Total Data", 
      accessor: (row) => <span className="font-medium text-white">{fmtBytes(row.download + row.upload)}</span> 
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Geographic Traffic
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h2>
          <p className="text-muted-foreground mt-1">Visualize data flow and activity across the globe.</p>
        </div>
      </div>

      <Card className="bg-card/80 backdrop-blur-xl border-border/50 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <CardContent className="p-1 sm:p-4">
          <WorldMap data={mapData} />
        </CardContent>
      </Card>

      <Card className="bg-card/80 backdrop-blur-xl border-border/50 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <CardHeader className="border-b border-border/50 pb-4 mb-4">
          <CardTitle className="text-lg text-white">Traffic by Country ({data.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data}
            columns={columns}
            searchPlaceholder="Search by country name..."
            searchFilter={(row, query) => {
              const q = query.toLowerCase();
              return (row.country_name || "").toLowerCase().includes(q);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
