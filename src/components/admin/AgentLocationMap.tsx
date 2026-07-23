// src/components/admin/AgentLocationMap.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { getViewAsHeaders } from "@/lib/admin-api";
import {
  EmptyMap,
  MAP_CSS,
  drawFlowLines,
  drawMarkers,
  type AgentLocationPin
} from "./AgentLocationMapHelpers";

interface Props {
  pins: AgentLocationPin[];
  onEditLocation?: (agentUuid: string, agentLabel: string) => void;
  canEdit?: boolean;
}

const AgentLocationMap = React.memo(function AgentLocationMap({
  pins,
  onEditLocation,
  canEdit = false,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const [flows, setFlows] = React.useState<any[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/dashboard/agent-flows", { headers: getViewAsHeaders() })
      .then((res) => res.json())
      .then((json) => {
        if (active && json.ok && json.data) {
          setFlows(json.data);
        }
      })
      .catch((err) => console.error("Failed to load agent flows for map:", err));
    return () => {
      active = false;
    };
  }, [pins]);

  const resetView = () => {
    if (!instanceRef.current || !pins.length || !LRef.current) return;
    const L = LRef.current;
    if (pins.length === 1) {
      instanceRef.current.setView([pins[0].latitude, pins[0].longitude], 14, { animate: false });
    } else {
      instanceRef.current.fitBounds(L.latLngBounds(pins.map((p) => [p.latitude, p.longitude])), {
        padding: [70, 70],
        maxZoom: 14,
        animate: false,
      });
    }
  };

  useEffect(() => {
    let mounted = true;
    if (!mapRef.current) return;

    // Inject styles
    const styleId = "leaflet-custom-markers-css";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.innerHTML = MAP_CSS;
      document.head.appendChild(s);
    }

    const boot = async () => {
      if (!mounted || !mapRef.current) return;

      // Inject Leaflet CSS
      if (!document.getElementById("lf-css-admin")) {
        const lnk = document.createElement("link");
        lnk.id = "lf-css-admin";
        lnk.rel = "stylesheet";
        lnk.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(lnk);
      }

      const L = (await import("leaflet")).default;
      if (!mounted || !mapRef.current) return;
      LRef.current = L;

      if (instanceRef.current) {
        try {
          instanceRef.current.remove();
        } catch (_) {}
      }

      const map = L.map(mapRef.current, {
        center: pins[0] ? [pins[0].latitude, pins[0].longitude] : [-2.548926, 118.0148634],
        zoom: pins.length === 1 ? 14 : 8,
        zoomControl: false,
        attributionControl: false,
        minZoom: 2,
        maxZoom: 20,
        maxBounds: [[-90, -180], [90, 180]],
        maxBoundsViscosity: 1.0,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
      });
      instanceRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 20,
        noWrap: true,
      }).addTo(map);

      if (pins.length > 1) {
        map.fitBounds(L.latLngBounds(pins.map((p) => [p.latitude, p.longitude])), {
          padding: [70, 70],
          maxZoom: 14,
          animate: false,
        });
      }

      // ── Get heartbeats for agent uptime from window or fetch ───────────────
      const uptimeMap: Record<string, number> = {};
      try {
        const res = await fetch("/api/dashboard/agent-heartbeats");
        if (res.ok) {
          const json = await res.json();
          if (json.ok && json.data) {
            json.data.forEach((item: any) => {
              uptimeMap[item.agent_uuid] = item.uptime_percent ?? 100;
            });
          }
        }
      } catch (_) {}

      if (!mounted) return;

      // Draw Flow lines
      drawFlowLines(map, L, pins, flows);

      // Draw Markers
      drawMarkers(map, L, pins, uptimeMap, canEdit, onEditLocation);
    };

    boot();
    return () => {
      mounted = false;
      if (instanceRef.current) {
        try {
          instanceRef.current.remove();
        } catch (_) {}
        instanceRef.current = null;
      }
    };
  }, [pins, flows, canEdit]);

  if (!pins.length) return <EmptyMap />;

  return (
    <div className="relative w-full rounded-xl overflow-hidden" style={{ height: 420 }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%", background: "#0a1628" }} />

      {/* Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5">
        {[
          { t: "Zoom In", l: "+", fn: () => instanceRef.current?.zoomIn() },
          { t: "Zoom Out", l: "−", fn: () => instanceRef.current?.zoomOut() },
        ].map((b) => (
          <button
            key={b.t}
            onClick={b.fn}
            title={b.t}
            className="w-9 h-9 flex items-center justify-center rounded-lg font-bold text-xl text-white hover:bg-indigo-600/30 transition-colors"
            style={{
              background: "rgba(13,21,38,0.92)",
              border: "1px solid rgba(99,102,241,0.35)",
              backdropFilter: "blur(8px)",
            }}
          >
            {b.l}
          </button>
        ))}
        <button
          onClick={resetView}
          title="Fit all agents"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-indigo-400 hover:text-indigo-300 transition-colors"
          style={{
            background: "rgba(13,21,38,0.92)",
            border: "1px solid rgba(99,102,241,0.35)",
            backdropFilter: "blur(8px)",
          }}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-3 left-3 z-[1000] flex gap-4 text-xs px-3.5 py-2 rounded-xl"
        style={{
          background: "rgba(10,17,32,0.88)",
          border: "1px solid rgba(99,102,241,0.2)",
          backdropFilter: "blur(8px)",
        }}
      >
        {[
          ["#10b981", "Online", true],
          ["#ef4444", "Offline", false],
        ].map(([c, l, glow]: any) => (
          <span key={l} className="flex items-center gap-1.5 text-slate-400">
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: c,
                boxShadow: glow ? `0 0 7px ${c}` : undefined,
              }}
            />
            {l}
          </span>
        ))}
        {flows.length > 0 && (
          <span className="flex items-center gap-1.5 text-slate-500">
            <span
              style={{
                display: "inline-block",
                width: 16,
                height: 2,
                background: "rgba(99,102,241,0.7)",
                borderTop: "1px dashed rgba(99,102,241,0.9)",
              }}
            />
            Traffic flow
          </span>
        )}
        <span className="font-semibold font-mono" style={{ color: "#818cf8" }}>
          {pins.length} agent{pins.length !== 1 ? "s" : ""} mapped
        </span>
      </div>
    </div>
  );
});

export default AgentLocationMap;
