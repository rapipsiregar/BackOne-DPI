"use client";

import React, { memo, useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
  ZoomableGroup,
  Line,
  Marker
} from "react-simple-maps";
import { fmtBytes } from "@/lib/utils";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const COUNTRY_COORDS: Record<string, [number, number]> = {
  "ID": [113.9213, -0.7893],
  "US": [-95.7129, 37.0902],
  "HK": [114.1095, 22.3964],
  "SG": [103.8198, 1.3521],
  "JP": [138.2529, 36.2048],
  "SC": [55.4920, -4.6796],
  "GB": [-3.4360, 55.3781],
  "IT": [12.5674, 41.8719],
  "CN": [104.1954, 35.8617],
  "KR": [127.7669, 35.9078],
  "CA": [-106.3468, 56.1304],
  "LU": [6.1296, 49.8153],
  "NL": [5.2913, 52.1326],
  "TR": [35.2433, 38.9637],
  "UA": [31.1656, 48.3794]
};

interface LineMapProps {
  data: {
    countryCode: string;
    value: number;
    label: string;
  }[];
}

const LineMapComponent = ({ data }: LineMapProps) => {
  const [tooltipContent, setTooltipContent] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Origin point: Indonesia (Jakarta)
  const origin: [number, number] = [106.8456, -6.2088];

  return (
    <div className="relative w-full aspect-[2/1] bg-secondary/20 rounded-xl overflow-hidden border border-border/50 backdrop-blur-sm">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none bg-card/80 p-3 rounded-lg border border-border/50 backdrop-blur-md">
        <div className="text-sm font-medium text-white flex items-center gap-2">
          Global Connections
        </div>
      </div>
      
      {/* Tooltip Overlay */}
      {tooltipContent && (
        <div className="absolute bottom-4 left-4 z-10 bg-card/90 backdrop-blur-md border border-border/50 px-4 py-2.5 rounded-lg shadow-lg pointer-events-none animate-fade-in">
          <div className="text-sm font-semibold text-white">{tooltipContent.split(':')[0]}</div>
          <div className="text-xs text-sky-400 mt-1 font-medium">{tooltipContent.split(':')[1]}</div>
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 130,
          center: [0, 30]
        }}
        width={800}
        height={400}
        className="w-full h-full"
      >
        <ZoomableGroup zoom={1} maxZoom={4} translateExtent={[[-100, -100], [900, 500]]}>
          <Sphere stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} id="sphere" fill="transparent" />
          <Graticule stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
          
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e293b"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#1e293b" },
                    pressed: { outline: "none" }
                  }}
                />
              ))
            }
          </Geographies>

          {data.map((d, i) => {
            if (d.countryCode === "ID") return null;
            const dest = COUNTRY_COORDS[d.countryCode];
            if (!dest) return null;

            return (
              <g key={i}>
                <Line
                  from={origin}
                  to={dest}
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  style={{ opacity: 0.6 }}
                />
                <Marker coordinates={dest}>
                  <circle 
                    r={3} 
                    fill="#38bdf8" 
                    onMouseEnter={() => setTooltipContent(`${d.label}: ${fmtBytes(d.value)}`)}
                    onMouseLeave={() => setTooltipContent("")}
                    className="cursor-pointer hover:fill-blue-500 transition-colors"
                  />
                </Marker>
              </g>
            );
          })}
          
          {/* Origin Marker */}
          <Marker coordinates={origin}>
            <circle r={4} fill="#f43f5e" />
            <circle r={8} fill="#f43f5e" opacity={0.3} className="animate-ping" />
          </Marker>

        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

export const LineMap = memo(LineMapComponent);
