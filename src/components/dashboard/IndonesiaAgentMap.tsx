"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { MapPin, Info, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import { getViewAsHeaders } from "@/lib/admin-api";
import { MAP_CSS_INJECT, type FlowDetail } from "./IndonesiaAgentMapHelpers";
import { Agent } from "@/lib/actions/agentsCore";
import { UnregisteredAgentsPanel } from "./UnregisteredAgentsPanel";
import { bootMapInstance } from "./IndonesiaAgentMapBoot";

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
  const [mapError] = useState(false);
  
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  const unregisteredAgents = useMemo(() => {
    const registeredUuids = new Set(locations.map(l => l.agent_uuid));
    return agents.filter(a => {
      const uuid = a.uuid || a.serial || "";
      return uuid && !registeredUuids.has(uuid);
    });
  }, [agents, locations]);

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

  useEffect(() => {
    if (!mapContainerRef.current) return;
    let isMounted = true;

    bootMapInstance({
      mounted: () => isMounted,
      mapContainer: mapContainerRef.current!,
      agents,
      locations,
      flows,
      isDark,
      onEditLocation,
      mapInstanceRef,
      tileLayerRef,
      layerGroupRef,
    });

    return () => {
      isMounted = false;
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

      <UnregisteredAgentsPanel
        unregisteredAgents={unregisteredAgents}
        onEditLocation={onEditLocation}
        role={role}
        isDark={isDark}
      />
    </div>
  );
}
