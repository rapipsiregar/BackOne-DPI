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
import { ZoomIn, ZoomOut } from "lucide-react";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface WorldMapProps {
  data: {
    countryCode: string;
    value: number;
    download?: number;
    upload?: number;
    label: string;
  }[];
}

const WorldMapComponent = ({ data }: WorldMapProps) => {
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [logBounds, setLogBounds] = useState({ min: 0, max: 1 });
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ coordinates: [0, 30] as [number, number], zoom: 1 });

  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (data.length > 0) {
      const logs = data.filter(d => d.value > 0).map(d => Math.log10(d.value));
      if (logs.length > 0) {
        const minLog = Math.min(...logs);
        const maxLog = Math.max(...logs);
        setLogBounds({ 
          min: minLog, 
          max: maxLog > minLog ? maxLog : minLog + 1 
        });
      }
    }
  }, [data]);

  const { min, max } = logBounds;
  const step = (max - min) / 4;
  const colorScale = scaleLinear<string>()
    .domain([min, min + step, min + step * 2, min + step * 3, max])
    .range(isLight 
      ? ["#e0f2fe", "#bae6fd", "#7dd3fc", "#38bdf8", "#0284c7"] // Light Mode: Clean Sky Blues
      : ["#0f172a", "#1e3a8a", "#1d4ed8", "#2563eb", "#60a5fa"] // Dark Mode: Deep Blues
    );

  const defaultLandColor = isLight ? "#f1f5f9" : "#111827";
  const oceanColor = isLight ? "#f8fafc" : "transparent";
  const strokeColor = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.05)";

  function handleZoomIn() {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  }

  function handleZoomOut() {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  }

  function handleMoveEnd(pos: { coordinates: [number, number]; zoom: number }) {
    setPosition(pos);
  }

  if (!mounted) return null;

  return (
    <div 
      className="relative w-full aspect-[2/1] bg-card rounded-xl overflow-hidden border border-border/50 shadow-inner group"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseLeave={() => setTooltipData(null)}
    >
      {/* Legend */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 flex items-center gap-2 pointer-events-none bg-background/90 px-3 py-1.5 rounded-full border border-border/50 backdrop-blur-md shadow-md text-[10px] sm:text-xs text-muted-foreground font-medium">
        <span className="font-semibold text-foreground hidden sm:inline">Intensity:</span>
        <span>Low</span>
        <div 
          className="w-14 sm:w-20 h-1.5 sm:h-2 rounded-full shadow-sm"
          style={{ 
            background: 'linear-gradient(to right, #1e3a8a, #1d4ed8, #2563eb, #60a5fa)' 
          }}
        />
        <span>High</span>
      </div>
      
      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button 
          onClick={handleZoomIn}
          className="p-2 bg-background/80 hover:bg-secondary border border-border/50 rounded-lg backdrop-blur-md text-foreground transition-colors shadow-sm"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 bg-background/80 hover:bg-secondary border border-border/50 rounded-lg backdrop-blur-md text-foreground transition-colors shadow-sm"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Mouse Tooltip */}
      {tooltipData && (
        <div 
          style={{ top: mousePos.y + 15, left: mousePos.x + 15 }}
          className="absolute z-50 bg-background/95 backdrop-blur-xl border border-border px-4 py-3 rounded-xl shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-100 min-w-[200px]"
        >
          <div className="text-sm font-bold text-foreground mb-2 flex items-center gap-2 border-b border-border/50 pb-2">
            {tooltipData.label}
          </div>
          {tooltipData.value > 0 ? (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Download</span>
                <span className="font-semibold text-sky-400">{fmtBytes(tooltipData.download || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Upload</span>
                <span className="font-semibold text-emerald-400">{fmtBytes(tooltipData.upload || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 mt-1 border-t border-border/30">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-rose-400">{fmtBytes(tooltipData.value)}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">No traffic recorded</div>
          )}
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
          center: [0, 30]
        }}
        width={800}
        height={400}
        className="w-full h-full outline-none cursor-grab active:cursor-grabbing"
      >
        <ZoomableGroup 
          zoom={position.zoom} 
          center={position.coordinates} 
          onMoveEnd={handleMoveEnd}
          maxZoom={6} 
          translateExtent={[[-200, -100], [1000, 600]]}
        >
          <Sphere stroke={strokeColor} strokeWidth={0.5} id="sphere" fill={oceanColor} />
          <Graticule stroke={strokeColor} strokeWidth={0.5} />
          
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const d = data.find((s) => {
                  if (!geo.properties.name) return false;
                  const geoName = geo.properties.name.toLowerCase();
                  const sLabel = s.label.toLowerCase();
                  
                  return geoName === sLabel || 
                         (sLabel === 'united states' && geoName === 'united states of america') ||
                         (sLabel === 'the netherlands' && geoName === 'netherlands') ||
                         (sLabel === 'south korea' && geoName === 'korea');
                });

                const hasData = d && d.value > 0;
                const fillColor = hasData ? colorScale(Math.log10(d.value)) : defaultLandColor;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none", transition: "fill 300ms" },
                      hover: {
                        fill: hasData ? "#38bdf8" : (isLight ? "#e2e8f0" : "#334155"), // Sky-400 glow or fallback
                        stroke: "#ffffff",
                        strokeWidth: 1,
                        outline: "none",
                        transition: "all 150ms ease",
                        filter: hasData ? "drop-shadow(0 0 8px rgba(56,189,248,0.6))" : "none"
                      },
                      pressed: { outline: "none" }
                    }}
                    onMouseEnter={() => {
                      setTooltipData(d ? d : { label: geo.properties.name, value: 0 });
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
