"use client";

import React from "react";
import { getFlowTooltipContent } from "../dashboard/IndonesiaAgentMapHelpers";
import { EmptyMap } from "./AgentEmptyMap";
import { MAP_CSS } from "./AgentMapCss";

export { EmptyMap, MAP_CSS };

export interface AgentLocationPin {
  agent_uuid: string;
  label: string;
  latitude: number;
  longitude: number;
  isOnline?: boolean;
  uptimePercent?: number;
  site_uuid?: string;
}

export function buildMarkerHtml(online: boolean) {
  return `
    <div class="custom-agent-marker ${online ? 'online' : 'offline'}">
      <div class="marker-beacon-ring"></div>
      <div class="marker-glass-disc">
        <div class="marker-core-dot"></div>
      </div>
    </div>
  `;
}

// ── Draw Flow lines ONLY if they exist in active flows ────────────────
export function drawFlowLines(map: any, L: any, pins: AgentLocationPin[], flows: any[]) {
  flows.forEach((flow) => {
    const src = pins.find((p) => p.agent_uuid === flow.source);
    const dst = pins.find((p) => p.agent_uuid === flow.target);
    if (!src || !dst) return;

    const bothOn = src.isOnline && dst.isOnline;
    const bothOff = !src.isOnline && !dst.isOnline;
    const lineColor = bothOn ? "#34d399" : bothOff ? "#f87171" : "#fbbf24";
    const weight = Math.min(Math.max(flow.bytes / 1024 / 1024 / 80, 2.0), 6);

    // Background polyline for hover trigger area
    const baseLine = L.polyline(
      [[src.latitude, src.longitude], [dst.latitude, dst.longitude]],
      { color: lineColor, weight: weight + 4, opacity: 0.15 }
    ).addTo(map);

    // Main colored line
    const activeLine = L.polyline(
      [[src.latitude, src.longitude], [dst.latitude, dst.longitude]],
      { color: lineColor, weight: weight, opacity: 0.5 }
    ).addTo(map);

    // Moving animation line
    const animLine = L.polyline(
      [[src.latitude, src.longitude], [dst.latitude, dst.longitude]],
      {
        color: lineColor,
        weight: weight * 0.6,
        opacity: 0.85,
        dashArray: "8 12",
        className: "flow-line",
      }
    ).addTo(map);

    const tooltipHtml = getFlowTooltipContent(
      src.label,
      dst.label,
      flow.bytes,
      flow.flowsCount,
      flow.details || []
    );

    [baseLine, activeLine, animLine].forEach((line) => {
      line.bindTooltip(tooltipHtml, { sticky: true, className: "leaflet-custom-popup shadow-2xl" });
    });
  });
}

// ── Draw Markers with Popups & Tooltips ───────────────────────────────
export function drawMarkers(
  map: any,
  L: any,
  pins: AgentLocationPin[],
  uptimeMap: Record<string, number>,
  canEdit: boolean,
  onEditLocation?: (agentUuid: string, agentLabel: string) => void
) {
  pins.forEach((pin) => {
    const online = pin.isOnline ?? false;
    const color = online ? "#10b981" : "#ef4444";
    const colorL = online ? "#34d399" : "#f87171";

    const icon = L.divIcon({
      html: buildMarkerHtml(online),
      className: "",
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
      tooltipAnchor: [0, -18],
    });

    const marker = L.marker([pin.latitude, pin.longitude], { icon });

    // ── Permanent label tooltip ──────────────────────────────────────────
    const shortLabel = pin.label.length > 22 ? pin.label.slice(0, 20) + "…" : pin.label;
    marker.bindTooltip(
      `<div style="
        padding:4px 10px 4px 8px; border-radius:8px; white-space:nowrap;
        background:rgba(10,18,36,0.93); border:1.5px solid ${colorL};
        color:${colorL}; font-size:11px; font-weight:700;
        font-family:Georgia,serif; letter-spacing:0.02em;
        box-shadow:0 0 10px ${color}55, 0 2px 12px rgba(0,0,0,0.7);
        display:flex; align-items:center; gap:6px;">
        <span style="width:7px;height:7px;border-radius:50%;background:${color};
          flex-shrink:0;${online ? `box-shadow:0 0 6px ${color}` : ""};"></span>
        ${shortLabel}
      </div>`,
      { permanent: true, direction: "top", offset: [0, -10], className: "agent-label-tooltip", interactive: false }
    );

    // ── Click popup ──────────────────────────────────────────────────────
    const uptime = uptimeMap[pin.agent_uuid];
    const uptimeColor =
      (uptime ?? 100) >= 98
        ? "#34d399"
        : (uptime ?? 100) >= 90
        ? "#fbbf24"
        : "#f87171";
    const editBtn =
      canEdit && onEditLocation
        ? `<button id="el-${pin.agent_uuid.replace(/\W/g, "")}"
           style="margin-top:10px;width:100%;padding:6px;background:rgba(99,102,241,0.15);
                  border:1px solid rgba(99,102,241,0.35);border-radius:8px;color:#818cf8;
                  font-size:11px;font-weight:700;cursor:pointer;font-family:Georgia,serif;"
           onmouseover="this.style.background='rgba(99,102,241,0.3)'"
           onmouseout="this.style.background='rgba(99,102,241,0.15)'">✎ Update Location</button>`
        : "";

    marker.bindPopup(
      `<div style="background:#0d1526;border:1px solid ${colorL}44;border-radius:14px;padding:14px 16px;min-width:200px;font-family:Georgia,serif;box-shadow:0 20px 60px rgba(0,0,0,0.85);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="width:9px;height:9px;border-radius:50%;background:${color};${
        online ? `box-shadow:0 0 8px ${color};` : ""
      };flex-shrink:0;"></span>
          <span style="font-size:13px;font-weight:800;color:${colorL};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:170px;">${
        pin.label
      }</span>
        </div>
        <div style="display:grid;grid-template-columns:auto 1fr;gap:3px 12px;font-size:10.5px;font-family:monospace;">
          <span style="color:#475569;">UUID</span><span style="color:#93c5fd;">${pin.agent_uuid}</span>
          <span style="color:#475569;">Status</span><span style="color:${color};font-weight:700;">${
        online ? "● Online" : "○ Offline"
      }</span>
          <span style="color:#475569;">Lat</span><span style="color:#cbd5e1;">${pin.latitude.toFixed(6)}</span>
          <span style="color:#475569;">Lng</span><span style="color:#cbd5e1;">${pin.longitude.toFixed(6)}</span>
          ${
            uptime !== undefined
              ? `<span style="color:#475569;">Uptime</span><span style="color:${uptimeColor};font-weight:700;">${uptime.toFixed(
                  1
                )}%</span>`
              : ""
          }
        </div>${editBtn}
      </div>`,
      { className: "agent-popup", maxWidth: 260 }
    );

    marker.on("popupopen", () => {
      const id = `el-${pin.agent_uuid.replace(/\W/g, "")}`;
      setTimeout(() => {
        document.getElementById(id)?.addEventListener("click", () => {
          onEditLocation?.(pin.agent_uuid, pin.label);
          map.closePopup();
        });
      }, 50);
    });

    marker.addTo(map);
  });
}
