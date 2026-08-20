"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { useRegions, useCities } from "@/lib/api-advanced";
import { fmtBytes } from "@/lib/utils";

export function RoutingGeoTab() {
  const { data: regions, isLoading: loadingRegions } = useRegions();
  const { data: cities, isLoading: loadingCities } = useCities();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Regions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={regions} 
            isLoading={loadingRegions}
            columns={[
              { header: "Region", accessor: (row: any) => <span title={row.region_name}>{row.region_name}</span> },
              { header: "Country", accessor: (row: any) => <span title={row.country_name}>{row.country_name}</span> },
              { header: "Download", accessor: (row) => fmtBytes(row.download) },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Top Cities</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={cities} 
            isLoading={loadingCities}
            columns={[
              { header: "City", accessor: (row: any) => <span title={row.city_name}>{row.city_name}</span> },
              { header: "Region", accessor: (row: any) => <span title={row.region_name}>{row.region_name}</span> },
              { header: "Country", accessor: (row: any) => <span title={row.country_name}>{row.country_name}</span> },
              { header: "Download", accessor: (row) => fmtBytes(row.download) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
