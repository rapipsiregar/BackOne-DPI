"use client";

import React, { memo, useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  Graticule,
  ZoomableGroup
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { fmtBytes } from "@/lib/utils";
import { useTheme } from "next-themes";

// The topojson file containing the world shapes
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
  data: {
    countryCode: string; // ISO A2 code
    value: number;       // The value used for heatmap
    label: string;       // Country name for tooltip
  }[];
}

const WorldMapComponent = ({ data }: WorldMapProps) => {
  const [tooltipContent, setTooltipContent] = useState("");
  const [maxValue, setMaxValue] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    if (data.length > 0) {
      const max = Math.max(...data.map(d => d.value));
      setMaxValue(max);
    }
  }, [data]);

  const colorScale = scaleLinear<string>()
    .domain(maxValue > 0 ? [0, maxValue * 0.33, maxValue * 0.66, maxValue] : [0, 1, 2, 3])
    .range(isLight 
      ? ["#bbf7d0", "#fef08a", "#fb923c", "#ef4444"] // Light: Green -> Yellow -> Orange -> Red
      : ["#1e293b", "#0f172a", "#0284c7", "#38bdf8"] // Dark: Slate -> Sky
    );

  const defaultLandColor = isLight ? "#86efac" : "#1e293b";
  const oceanColor = isLight ? "#bfdbfe" : "transparent";
  const strokeColor = isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.1)";

  if (!mounted) return null;

  return (
    <div className="relative w-full aspect-[2/1] bg-secondary/20 rounded-xl overflow-hidden border border-border/50 backdrop-blur-sm">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none bg-card/80 p-3 rounded-lg border border-border/50 backdrop-blur-md">
        <div className="text-sm font-medium text-white flex items-center gap-2">
          Heatmap Activity
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="text-xs text-muted-foreground">Low</div>
          <div 
            className="w-24 h-2 rounded-full shadow-sm"
            style={{ 
              background: isLight 
                ? 'linear-gradient(to right, #bbf7d0, #fef08a, #fb923c, #ef4444)' 
                : 'linear-gradient(to right, #1e293b, #38bdf8)' 
            }}
          ></div>
          <div className="text-xs text-muted-foreground">High</div>
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
          <Sphere stroke={strokeColor} strokeWidth={0.5} id="sphere" fill={oceanColor} />
          <Graticule stroke={strokeColor} strokeWidth={0.5} />
          
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // geo.properties.name contains the country name in this TopoJSON
                // Try to find if we have data for this country
                const d = data.find((s) => {
                  if (!geo.properties.name) return false;
                  const geoName = geo.properties.name.toLowerCase();
                  const sLabel = s.label.toLowerCase();
                  
                  return geoName === sLabel || 
                         (sLabel === 'united states' && geoName === 'united states of america') ||
                         (sLabel === 'the netherlands' && geoName === 'netherlands') ||
                         (sLabel === 'south korea' && geoName === 'korea');
                });

                const color = d ? colorScale(d.value) : defaultLandColor;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={color}
                    stroke={strokeColor}
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: {
                        fill: "#0ea5e9", // sky-500 on hover
                        outline: "none",
                        transition: "all 200ms ease"
                      },
                      pressed: { outline: "none" }
                    }}
                    onMouseEnter={() => {
                      if (d) {
                        setTooltipContent(`${d.label}: ${fmtBytes(d.value)}`);
                      } else {
                        setTooltipContent(`${geo.properties.name}: No data`);
                      }
                    }}
                    onMouseLeave={() => {
                      setTooltipContent("");
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

export const WorldMap = memo(WorldMapComponent);
