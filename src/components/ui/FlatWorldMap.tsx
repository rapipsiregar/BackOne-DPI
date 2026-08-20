"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import { fmtBytes } from "@/lib/utils";

interface GlobeDataInput {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  fromLabel: string;
  toLabel: string;
  value: number;
  download: number;
  upload: number;
  countryCode?: string;
}

interface FlatWorldMapProps {
  data: GlobeDataInput[];
}

export const FlatWorldMap = ({ data }: FlatWorldMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const labelLayerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  useEffect(() => {
    let isMounted = true;

    async function runMapSetup() {
      if (!mapContainerRef.current || !isMounted) return;

      const L = (await import("leaflet")).default;
      if (!isMounted) return;

      // Inject Leaflet CSS if not already present
      if (!document.getElementById("leaflet-css-flat")) {
        const lnk = document.createElement("link");
        lnk.id = "leaflet-css-flat";
        lnk.rel = "stylesheet";
        lnk.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(lnk);
        lnk.onload = () => {
          if (isMounted) runMapSetup();
        };
        return;
      }

      // Use dark_nolabels for base to allow overlaying clear light-colored labels
      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

      if (!mapInstanceRef.current) {
        // Initialize map centered at Southeast Asia / Indonesia [15, 120]
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
          minZoom: 2,
          maxZoom: 10,
          worldCopyJump: true,
        }).setView([-2.5, 118.0], 3);

        const tiles = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
        tileLayerRef.current = tiles;

        // If dark mode, overlay the high-contrast light labels layer
        if (isDark) {
          const labels = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png", {
            maxZoom: 19,
            pane: 'shadowPane' // Places text on top of polylines
          }).addTo(map);
          labelLayerRef.current = labels;
        }

        L.control.zoom({ position: "bottomright" }).addTo(map);
        mapInstanceRef.current = map;
        layerGroupRef.current = L.layerGroup().addTo(map);
      } else {
        // Update tile layers url if theme changes
        tileLayerRef.current.setUrl(tileUrl);
        if (isDark) {
          if (!labelLayerRef.current) {
            labelLayerRef.current = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png", {
              maxZoom: 19,
              pane: 'shadowPane'
            }).addTo(mapInstanceRef.current);
          } else {
            labelLayerRef.current.setUrl("https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png");
          }
        } else {
          if (labelLayerRef.current) {
            mapInstanceRef.current.removeLayer(labelLayerRef.current);
            labelLayerRef.current = null;
          }
        }
        layerGroupRef.current.clearLayers();
      }

      const map = mapInstanceRef.current;
      const layerGroup = layerGroupRef.current;

      // Draw active origin marker (Indonesia)
      const originIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-60"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-lg shadow-blue-500/50"></span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const firstFlow = data[0];
      const originLat = firstFlow ? firstFlow.startLat : -6.2253265;
      const originLng = firstFlow ? firstFlow.startLng : 106.8061484;
      const originLabel = firstFlow ? firstFlow.fromLabel : "IFG LT.18 Agent HQ";

      const originMarker = L.marker([originLat, originLng], { icon: originIcon }).addTo(layerGroup);
      
      // Bind permanent light label for origin (positioned ABOVE the marker)
      originMarker.bindTooltip(`<div class="px-2 py-0.5 bg-blue-600/90 border border-blue-400/50 text-white rounded text-[10px] font-bold shadow-lg shadow-blue-900/50 uppercase tracking-wider">${originLabel}</div>`, {
        permanent: true,
        direction: 'top',
        offset: [0, -10],
        className: 'custom-node-label-tooltip'
      });

      // Draw lines and points for destination traffic flows
      data.forEach((flow) => {
        const start: [number, number] = [flow.startLat, flow.startLng];
        const end: [number, number] = [flow.endLat, flow.endLng];
        const flowColor = isDark ? '#38bdf8' : '#0284c7';

        // Custom DivIcon for remote country destination
        const destIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `
            <div class="relative flex items-center justify-center">
              <span class="animate-pulse absolute inline-flex h-4 w-4 rounded-full" style="background-color: ${flowColor}; opacity: 0.4;"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5" style="background-color: ${flowColor}; box-shadow: 0 0 8px ${flowColor};"></span>
            </div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });

        // Add remote marker
        const destMarker = L.marker(end, { icon: destIcon }).addTo(layerGroup);
        
        // Add Polyline
        const line = L.polyline([start, end], {
          color: flowColor,
          weight: 1.5,
          opacity: 0.65,
          className: 'traffic-flow-polyline',
        }).addTo(layerGroup);

        // Dynamic tooltip positioning to prevent overlap/collision
        let tooltipDirection: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
        let tooltipOffset: [number, number] = [0, 8];

        const labelLower = flow.toLabel.toLowerCase();
        if (labelLower.includes('internal network') || labelLower.includes('intranet')) {
          tooltipDirection = 'bottom';
          tooltipOffset = [0, 10];
        } else if (labelLower.includes('tangerang') || labelLower.includes('balaraja')) {
          tooltipDirection = 'left';
          tooltipOffset = [-8, 0];
        } else if (labelLower.includes('bandung')) {
          tooltipDirection = 'right';
          tooltipOffset = [8, 0];
        } else if (labelLower.includes('surabaya')) {
          tooltipDirection = 'bottom';
          tooltipOffset = [0, 8];
        }

        // Bind permanent high-contrast country name label with smart offsets
        destMarker.bindTooltip(`<div class="px-1.5 py-0.5 bg-slate-900/95 border border-slate-700/80 text-slate-100 rounded text-[9.5px] font-semibold shadow-md uppercase tracking-wide">${flow.toLabel}</div>`, {
          permanent: true,
          direction: tooltipDirection,
          offset: tooltipOffset,
          className: 'custom-node-label-tooltip'
        });

        // Bind hover HTML tooltip for deep flow stats
        const dlStr = fmtBytes(flow.download);
        const ulStr = fmtBytes(flow.upload);
        const hoverTooltipHtml = `
          <div class="px-3 py-2 bg-slate-950/95 border border-slate-700/50 backdrop-blur-md rounded-lg shadow-xl text-slate-100 text-xs flex flex-col gap-1">
            <span class="font-bold text-white tracking-wide">${flow.toLabel}</span>
            <div class="flex items-center gap-1.5 mt-0.5 text-slate-400">
              <span>DL: <strong class="text-blue-400">${dlStr}</strong></span>
              <span class="text-slate-600">|</span>
              <span>UL: <strong class="text-emerald-400">${ulStr}</strong></span>
            </div>
            <div class="text-[10px] text-slate-500 mt-0.5">Coordinates: ${end[0].toFixed(2)}, ${end[1].toFixed(2)}</div>
          </div>
        `;

        // Register hover trigger popups/tooltips on mouseover
        destMarker.on('mouseover', function (e) {
          const popup = L.popup({
            closeButton: false,
            className: 'custom-hover-flow-popup',
            offset: [0, -10]
          })
          .setLatLng(end)
          .setContent(hoverTooltipHtml)
          .openOn(map);
          
          destMarker.on('mouseout', () => map.closePopup(popup));
        });

        line.bindTooltip(hoverTooltipHtml, { sticky: true, opacity: 0.95 });
      });

      setLoading(false);
    }

    // Inject Leaflet CSS if not already present, and wait for it to load before booting
    if (!document.getElementById("leaflet-css-flat")) {
      const lnk = document.createElement("link");
      lnk.id = "leaflet-css-flat";
      lnk.rel = "stylesheet";
      lnk.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(lnk);
      lnk.onload = () => {
        if (isMounted) runMapSetup();
      };
    } else {
      runMapSetup();
    }

    return () => {
      isMounted = false;
    };
  }, [data, isDark]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {}
        mapInstanceRef.current = null;
        layerGroupRef.current = null;
        tileLayerRef.current = null;
        labelLayerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden border border-white/5 bg-[#090d16] flex items-center justify-center">
      {/* Dynamic inline stylesheet to customize leaflet default styles, hover tooltips, and animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* CRITICAL RESET: Override the global '*' 500ms transition from globals.css to fix marker/line drag lag */
        .leaflet-container *,
        .leaflet-container *::before,
        .leaflet-container *::after {
          transition: none !important;
        }

        .leaflet-container {
          background-color: ${isDark ? "#090d16" : "#f1f5f9"} !important;
          font-family: inherit;
        }
        .leaflet-bar {
          border: 1px solid rgba(255,255,255,0.08) !important;
          background-color: rgba(24, 24, 27, 0.9) !important;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }
        .leaflet-bar a {
          background-color: transparent !important;
          color: #f4f4f5 !important;
          border-bottom: 1px solid rgba(255,255,255,0.08) !important;
          transition: all 0.2s;
        }
        .leaflet-bar a:hover {
          background-color: rgba(255,255,255,0.05) !important;
          color: #ffffff !important;
        }
        .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip-pane {
          z-index: 650;
        }
        .custom-node-label-tooltip {
          pointer-events: none !important;
          user-select: none !important;
          white-space: nowrap !important;
        }
        .custom-hover-flow-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .custom-hover-flow-popup .leaflet-popup-content {
          margin: 0 !important;
          padding: 0 !important;
        }
        .custom-hover-flow-popup .leaflet-popup-tip {
          background: #020617 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        .traffic-flow-polyline {
          stroke-dasharray: 4, 4;
          animation: polyFlow 30s linear infinite;
        }
        @keyframes polyFlow {
          to {
            stroke-dashoffset: -100;
          }
        }
      `}} />

      {loading && (
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm z-[1000] flex items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span>Loading map interface...</span>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full" id="flat-world-map" />
    </div>
  );
};
