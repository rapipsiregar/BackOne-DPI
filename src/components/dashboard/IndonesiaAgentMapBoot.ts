import { Agent } from "@/lib/actions/agentsCore";
import { getFlowTooltipContent, getAgentTooltipContent, type FlowDetail } from "./IndonesiaAgentMapHelpers";

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

export function buildMarkerHtml(online: boolean): string {
  return `
    <div class="custom-agent-marker ${online ? 'online' : 'offline'}">
      <div class="marker-beacon-ring"></div>
      <div class="marker-glass-disc">
        <div class="marker-core-dot"></div>
      </div>
    </div>
  `;
}

export async function bootMapInstance({
  mounted,
  mapContainer,
  agents,
  locations,
  flows,
  isDark,
  onEditLocation,
  mapInstanceRef,
  tileLayerRef,
  layerGroupRef,
}: {
  mounted: () => boolean;
  mapContainer: HTMLDivElement;
  agents: Agent[];
  locations: LocationData[];
  flows: FlowData[];
  isDark: boolean;
  onEditLocation: (agentUuid: string, label: string) => void;
  mapInstanceRef: React.MutableRefObject<any>;
  tileLayerRef: React.MutableRefObject<any>;
  layerGroupRef: React.MutableRefObject<any>;
}) {
  if (!mounted()) return;
  const L = (await import("leaflet")).default;
  if (!mounted() || !mapContainer) return;

  if (!document.getElementById("lf-css-dpi")) {
    const lnk = document.createElement("link");
    lnk.id = "lf-css-dpi"; lnk.rel = "stylesheet";
    lnk.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(lnk);
  }

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
    const map = L.map(mapContainer, {
      zoomControl: false,
      attributionControl: false,
      zoomAnimation: false,
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

  if (!mounted()) return;
  const group = layerGroupRef.current;
  group.clearLayers();
  const registeredUuids = new Set(locations.map(l => l.agent_uuid));

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

  Object.entries(agentMap).forEach(([uuid, info]) => {
    if (!mounted()) return;
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

  if (activeCoords.length > 1 && mounted()) {
    const L2 = L as any;
    const bounds = L2.latLngBounds(activeCoords.map((c: any) => [c.lat, c.lng]));
    mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14, animate: false });
  }
}
