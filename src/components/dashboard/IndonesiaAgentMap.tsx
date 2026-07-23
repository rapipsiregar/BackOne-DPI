"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { MapPin, AlertTriangle, ChevronDown, ChevronUp, Plus, Info, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { getViewAsHeaders } from "@/lib/admin-api";
import { 
  getFlowTooltipContent, 
  getAgentTooltipContent, 
  MAP_CSS_INJECT, 
  type FlowDetail 
} from "./IndonesiaAgentMapHelpers";
import { Agent } from "@/lib/actions/agentsCore";

interface LocationData {
  agent_uuid: string;
  latitude: number;
  longitude: number;
  label?: string;
}

interface FlowData {
  source: string;
  target: string;
  bytes: number;
  flowsCount: number;
  details: FlowDetail[];
}

interface IndonesiaAgentMapProps {
  agents: Agent[];
  locations: LocationData[];
  onEditLocation: (agentUuid: string, label: string) => void;
  role?: string | null;
}

export function IndonesiaAgentMap({
  agents,
  locations,
  onEditLocation,
  role,
}: IndonesiaAgentMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [loadingFlows, setLoadingFlows] = useState(true);
  const [flows, setFlows] = useState<FlowData[]>([]);
  const [mapError, setMapError] = useState(false);
  
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const canvasRendererRef = useRef<any>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  // Agents that have no registered coordinate yet
  const unregisteredAgents = useMemo(() => {
    const registeredUuids = new Set(locations.map(l => l.agent_uuid));
    return agents.filter(a => {
      const uuid = a.uuid || a.serial || "";
      return uuid && !registeredUuids.has(uuid);
    });
  }, [agents, locations]);

  const [panelOpen, setPanelOpen] = useState(true);

  // Fetch Inter-Agent Flows
  useEffect(() => {
    setLoadingFlows(true);
    fetch("/api/dashboard/agent-flows", { headers: getViewAsHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data) {
          setFlows(data.data);
        }
      })
      .catch((e) => console.error("[Map Flows Fetch]", e.message))
      .finally(() => setLoadingFlows(false));
  }, [locations]);

  // Handle Map Resize & Alignment
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const triggerInvalidate = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    const timeout = setTimeout(triggerInvalidate, 150);
    window.addEventListener("resize", triggerInvalidate);

    let observer: ResizeObserver | null = null;
    if (mapContainerRef.current) {
      observer = new ResizeObserver(() => triggerInvalidate());
      observer.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", triggerInvalidate);
      if (observer) observer.disconnect();
    };
  }, [agents, locations, flows]);

  // Initialize and Update Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let mounted = true;

    const buildMarkerHtml = (online: boolean): string => {
      return `
        <div class="custom-agent-marker ${online ? 'online' : 'offline'}">
          <div class="marker-beacon-ring"></div>
          <div class="marker-glass-disc">
            <div class="marker-core-dot"></div>
          </div>
        </div>
      `;
    };

    const boot = async () => {
      if (!mounted) return;
      const L = (await import("leaflet")).default;
      if (!mounted || !mapContainerRef.current) return;

      // Inject CSS once
      if (!document.getElementById("lf-css-dpi")) {
        const lnk = document.createElement("link");
        lnk.id = "lf-css-dpi"; lnk.rel = "stylesheet";
        lnk.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(lnk);
      }
      if (!document.getElementById("dpi-map-extra-css")) {
        const s = document.createElement("style");
        s.id = "dpi-map-extra-css";
        s.textContent = `
          @keyframes dpi-beacon { 0%,100%{opacity:.18;transform:scale(1);transform-origin:20px 20px;} 50%{opacity:.05;transform:scale(1.65);transform-origin:20px 20px;} }
          .dpi-beacon { animation: dpi-beacon 2.2s ease-in-out infinite; }
          @keyframes flowDash { to { stroke-dashoffset:-24; } }
          .animated-flow-line { animation: flowDash 1.2s linear infinite; }
          .agent-label-tooltip { background:transparent!important;border:none!important;box-shadow:none!important;padding:0!important; }
          .agent-label-tooltip::before { display:none!important; }
          .dpi-agent-label { display:inline-block;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;border:1px solid;white-space:nowrap;letter-spacing:0.02em; }
          .leaflet-control-attribution { display:none!important; }
          .leaflet-custom-popup .leaflet-popup-content-wrapper { background:#0a1224!important; border:1px solid rgba(99,102,241,0.25)!important; box-shadow:0 12px 36px rgba(0,0,0,0.65)!important; padding:0!important; border-radius:12px!important; }
          .leaflet-custom-popup .leaflet-popup-content { margin:0!important;padding:0!important; }
          
          /* Premium Map Marker Styles */
          .custom-agent-marker {
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            width: 32px;
            height: 32px;
          }
          .marker-beacon-ring {
            position: absolute;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            opacity: 0;
            pointer-events: none;
          }
          .online .marker-beacon-ring {
            border: 2px solid #10b981;
            animation: beacon-ping 2.5s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
          }
          .offline .marker-beacon-ring {
            border: 2px solid #ef4444;
            animation: beacon-ping 2.5s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
          }
          @keyframes beacon-ping {
            0% { transform: scale(0.4); opacity: 0.85; }
            50% { opacity: 0.45; }
            100% { transform: scale(1.8); opacity: 0; }
          }
          .marker-glass-disc {
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: rgba(10, 18, 36, 0.85);
            border: 2px solid;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.7), inset 0 1px 2px rgba(255, 255, 255, 0.15);
            transition: all 0.2s ease-in-out;
          }
          .online .marker-glass-disc {
            border-color: #10b981;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.5), 0 4px 10px rgba(0, 0, 0, 0.6);
          }
          .offline .marker-glass-disc {
            border-color: #ef4444;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.5), 0 4px 10px rgba(0, 0, 0, 0.6);
          }
          .marker-core-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            transition: all 0.2s ease-in-out;
          }
          .online .marker-core-dot {
            background: #10b981;
            box-shadow: 0 0 6px #10b981;
          }
          .offline .marker-core-dot {
            background: #ef4444;
            box-shadow: 0 0 6px #ef4444;
          }
          .custom-agent-marker:hover .marker-glass-disc {
            transform: scale(1.25);
          }
        `;
        document.head.appendChild(s);
      }

      // Build agent map
      const agentMap: Record<string, { lat: number; lng: number; label: string; agentLabel: string; status: string }> = {};
      agents.forEach((agent) => {
        const uuid = agent.uuid || agent.serial || "";
        const loc = locations.find((l) => l.agent_uuid === uuid);
        if (loc) {
          agentMap[uuid] = {
            lat: loc.latitude,
            lng: loc.longitude,
            label: loc.label || "",
            agentLabel: agent.label || "",
            status: agent.activated ? "Online" : "Offline",
          };
        }
      });

      const activeCoords = Object.values(agentMap);
      const centerLat = activeCoords.length > 0 ? activeCoords.reduce((s, v) => s + v.lat, 0) / activeCoords.length : -6.2088;
      const centerLng = activeCoords.length > 0 ? activeCoords.reduce((s, v) => s + v.lng, 0) / activeCoords.length : 106.8456;

      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: false,
          zoomAnimation: false,    // prevents _leaflet_pos crash on React StrictMode remount
          fadeAnimation: false,
          markerZoomAnimation: false,
        }).setView([centerLat, centerLng], 10, { animate: false });

        const tiles = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
        tileLayerRef.current = tiles;
        L.control.zoom({ position: "bottomright" }).addTo(map);
        mapInstanceRef.current = map;
        layerGroupRef.current = L.layerGroup().addTo(map);
      } else {
        const map = mapInstanceRef.current;
        if (tileLayerRef.current) tileLayerRef.current.setUrl(tileUrl);
        if (activeCoords.length > 0) map.panTo([centerLat, centerLng]);
      }

      if (!mounted) return;
      const group = layerGroupRef.current;
      group.clearLayers();
      const registeredUuids = new Set(locations.map(l => l.agent_uuid));

      // ── A. FLOW LINES ────────────────────────────────────────────────────────
      flows.forEach((flow) => {
        const src = agentMap[flow.source];
        const dst = agentMap[flow.target];
        if (!src || !dst || !registeredUuids.has(flow.source) || !registeredUuids.has(flow.target)) return;
        const weight = Math.min(Math.max(flow.bytes / 1024 / 1024 / 80, 2.5), 8);
        const color  = isDark ? "#38bdf8" : "#1d4ed8";

        L.polyline([[src.lat, src.lng], [dst.lat, dst.lng]], {
          color: isDark ? "#0ea5e9" : "#3b82f6", weight: weight + 4, opacity: 0.12,
        }).addTo(group);

        const baseLine = L.polyline([[src.lat, src.lng], [dst.lat, dst.lng]], {
          color, weight, opacity: 0.5,
        }).addTo(group);

        const animLine = L.polyline([[src.lat, src.lng], [dst.lat, dst.lng]], {
          color, weight: weight * 0.55, opacity: 0.95, dashArray: "10 15",
          className: "animated-flow-line",
        }).addTo(group);

        const tooltipHtml = getFlowTooltipContent(
          src.agentLabel, dst.agentLabel, flow.bytes, flow.flowsCount, flow.details || []
        );
        [baseLine, animLine].forEach(line => {
          line.bindTooltip(tooltipHtml, { sticky: true, className: "leaflet-custom-popup shadow-2xl" });
        });
      });

      // ── B. PREMIUM SVG MARKERS ───────────────────────────────────────────────
      Object.entries(agentMap).forEach(([uuid, info]) => {
        if (!mounted) return;
        const isOnline   = info.status === "Online";
        const labelColor = isOnline ? "#34d399" : "#f87171";
        const borderCol  = isOnline ? "#10b981" : "#ef4444";

        const icon = L.divIcon({
          html: buildMarkerHtml(isOnline),
          className: "",
          iconSize:      [32, 32],
          iconAnchor:    [16, 16],
          tooltipAnchor: [0, -18],
          popupAnchor:   [0, -18],
        });

        const marker = L.marker([info.lat, info.lng], { icon });

        const shortLabel = info.agentLabel.length > 24 ? info.agentLabel.slice(0, 22) + "…" : info.agentLabel;
        marker.bindTooltip(
          `<div class="dpi-agent-label" style="background:rgba(10,18,36,0.92);color:${labelColor};border-color:${borderCol};box-shadow:0 0 10px ${borderCol}44,0 2px 8px rgba(0,0,0,0.7);">` +
          `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${borderCol};margin-right:5px;${isOnline?`box-shadow:0 0 6px ${borderCol}`:""}"></span>` +
          `${shortLabel}</div>`,
          { permanent: true, direction: "top", offset: [0, -10], className: "agent-label-tooltip", interactive: false }
        );

        const popupHtml = getAgentTooltipContent(
          uuid, info.agentLabel, info.status, isOnline, info.label, info.lat, info.lng
        );
        marker.bindPopup(popupHtml, { closeButton: false, className: "leaflet-custom-popup", offset: [0, -8] });
        marker.on("popupopen", () => {
          const btn = document.getElementById(`btn-edit-${uuid}`);
          if (btn) btn.addEventListener("click", () => onEditLocation(uuid, info.agentLabel));
        });

        marker.addTo(group);
      });

      // Fit bounds
      if (activeCoords.length > 1 && mounted) {
        const L2 = L as any;
        const bounds = L2.latLngBounds(activeCoords.map((c: any) => [c.lat, c.lng]));
        mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: false });
      }
    };

    boot();
    return () => {
      mounted = false;
      // Properly destroy the Leaflet instance so React StrictMode double-invoke
      // and HMR remounts don't leave orphaned panes that trigger _leaflet_pos errors.
      if (mapInstanceRef.current) {
        try { mapInstanceRef.current.remove(); } catch (_) {}
        mapInstanceRef.current = null;
        layerGroupRef.current  = null;
        tileLayerRef.current   = null;
      }
    };
  }, [agents, locations, flows, isDark]);

  if (mapError) {
    return (
      <div className={`flex h-[320px] w-full flex-col items-center justify-center rounded-2xl border p-6 text-center text-red-400 ${
        isDark ? "bg-slate-900/50 border-white/5" : "bg-white/50 border-slate-200"
      }`}>
        <Info className="mb-2 h-8 w-8" />
        <p className="text-sm font-semibold">Map failed to initialize.</p>
        <p className="text-xs text-slate-500 mt-1">Please reload the page.</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full rounded-2xl border p-4 shadow-md transition-all duration-300 ${
      isDark 
        ? "bg-slate-900/40 border-white/5 shadow-black/40 backdrop-blur-xl" 
        : "bg-white border-slate-200 shadow-slate-100"
    }`}>
      <style dangerouslySetInnerHTML={{ __html: MAP_CSS_INJECT }} />

      {/* Header Info */}
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className={`h-4 w-4 ${isDark ? "text-primary" : "text-blue-600"}`} />
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? "text-white" : "text-slate-800"
            }`}>
              Agent Location & Topology Map
            </h3>
            <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Physical deployment and real-time inter-agent routing flows across Indonesia.
            </p>
          </div>
        </div>

        {loadingFlows && (
          <div className={`flex items-center gap-1.5 text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span>Updating flows...</span>
          </div>
        )}
      </div>

      {/* Map Element */}
      <div className={`relative overflow-hidden rounded-xl border ${
        isDark ? "border-white/5" : "border-slate-200"
      }`}>
        <div 
          ref={mapContainerRef} 
          className="h-[320px] w-full"
          id="indonesia-agent-map"
          style={{ background: isDark ? "#090d16" : "#e8edf2" }}
        />
      </div>

      {/* Agents Without Coordinates Panel */}
      {unregisteredAgents.length > 0 && (
        <div className={`mt-3 rounded-xl border transition-colors duration-200 ${
          isDark
            ? "border-amber-500/20 bg-amber-500/5"
            : "border-blue-200 bg-blue-50"
        }`}>
          {/* Panel Header */}
          <button
            onClick={() => setPanelOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-left"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${isDark ? "text-amber-500" : "text-blue-500"}`} />
              <span className={`text-xs font-semibold ${
                isDark ? "text-amber-400" : "text-blue-700"
              }`}>
                {unregisteredAgents.length} Agent{unregisteredAgents.length > 1 ? "s" : ""} Without Coordinates{role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN' ? " — Click to Configure" : ""}
              </span>
            </div>
            {panelOpen
              ? <ChevronUp className={`h-3.5 w-3.5 ${isDark ? "text-amber-500" : "text-blue-400"}`} />
              : <ChevronDown className={`h-3.5 w-3.5 ${isDark ? "text-amber-500" : "text-blue-400"}`} />}
          </button>

          {/* Agent Chips */}
          {panelOpen && (
            <div className="flex flex-wrap gap-2 px-4 pb-3 pt-0.5">
              {unregisteredAgents.map(agent => {
                const uuid = agent.uuid || agent.serial || "";
                const isOnline = agent.activated;
                const isWritable = role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN';
                return (
                  <button
                    key={uuid}
                    onClick={isWritable ? () => onEditLocation(uuid, agent.label || uuid) : undefined}
                    disabled={!isWritable}
                    className={`group flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                      isDark
                        ? isWritable
                          ? "border-white/10 bg-slate-900/60 text-slate-300 hover:border-primary/40 hover:bg-primary/10 hover:text-primary cursor-pointer"
                          : "border-white/5 bg-slate-900/40 text-slate-500 cursor-default"
                        : isWritable
                          ? "border-blue-200 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                          : "border-slate-200 bg-slate-50 text-slate-400 cursor-default"
                    }`}
                  >
                    <MapPin className={`h-3.5 w-3.5 shrink-0 ${
                      isOnline ? "text-emerald-500 animate-pulse" : "text-red-400"
                    }`} />
                    <span className="max-w-[160px] truncate" title={agent.label}>{agent.label}</span>
                    <span className={`font-mono text-[10px] truncate max-w-[80px] ${
                      isDark ? "text-slate-500" : "text-slate-400"
                    }`} title={uuid}>{uuid}</span>
                    {isWritable && (
                      <Plus className={`h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isDark ? "" : "text-blue-500"
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
