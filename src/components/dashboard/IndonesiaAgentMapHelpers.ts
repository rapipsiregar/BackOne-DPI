export interface FlowDetail {
  src_ip: string;
  dst_ip: string;
  app: string;
  bytes: number;
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getFlowTooltipContent(
  srcLabel: string,
  dstLabel: string,
  totalBytes: number,
  flowsCount: number,
  details: FlowDetail[]
): string {
  const mb = (totalBytes / 1024 / 1024).toFixed(2);
  let html = `
    <div style="padding: 12px 16px; font-family: inherit; font-size: 13px; font-weight: 500; color: #fff; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); min-width: 280px; pointer-events: none;">
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 6px; color: #38bdf8;">
        <span>Inter-Agent Link</span>
        <span style="color: #facc15; font-family: monospace;">${mb} MB</span>
      </div>
      <div style="color: #cbd5e1; font-size: 11px; margin-bottom: 10px; font-weight: normal;">
        ${srcLabel} ➔ ${dstLabel} (${flowsCount} connections)
      </div>
      <div style="margin-top: 6px;">
        <p style="font-size: 9px; text-transform: uppercase; font-weight: 700; color: #94a3b8; margin-bottom: 6px; margin-top: 0; letter-spacing: 0.05em;">Top Active Flows:</p>
        <table style="width: 100%; text-align: left; font-family: monospace; font-size: 11px; color: #cbd5e1; border-collapse: collapse;">
          <tbody>
  `;

  if (details && details.length > 0) {
    details.forEach(d => {
      html += `
        <tr>
          <td style="padding: 3px 6px 3px 0; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #f1f5f9;" title="${d.src_ip}">${d.src_ip}</td>
          <td style="padding: 3px 6px; color: #64748b;">➔</td>
          <td style="padding: 3px 6px; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #f1f5f9;" title="${d.dst_ip}">${d.dst_ip}</td>
          <td style="padding: 3px 6px; color: #38bdf8;">${d.app}</td>
          <td style="padding: 3px 0 3px 6px; text-align: right; color: #4ade80; font-weight: 600;">${formatBytes(d.bytes)}</td>
        </tr>
      `;
    });
  } else {
    html += `<tr><td colspan="5" style="color: #64748b; font-style: italic; text-align: center; padding: 6px 0;">No detailed flow data</td></tr>`;
  }

  html += `
          </tbody>
        </table>
      </div>
    </div>
  `;
  return html;
}

export function getAgentTooltipContent(
  uuid: string,
  agentLabel: string,
  status: string,
  isOnline: boolean,
  customLabel: string,
  lat: number,
  lng: number
): string {
  return `
    <div style="padding: 12px 16px; font-family: inherit; font-size: 13px; font-weight: 500; color: #fff; background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); min-width: 200px;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 6px;">
        <span style="font-weight: 600; font-size: 14px; color: #f8fafc;">${agentLabel}</span>
        <span style="padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; ${
          isOnline ? "background: rgba(34,197,94,0.2); color: #4ade80;" : "background: rgba(239,68,68,0.2); color: #f87171;"
        }">${status}</span>
      </div>
      <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5; font-weight: normal;">
        <p style="margin: 3px 0;"><span style="color: #64748b; font-weight: 500;">UUID:</span> ${uuid}</p>
        <p style="margin: 3px 0;"><span style="color: #64748b; font-weight: 500;">Location:</span> ${customLabel || "No custom label set"}</p>
        <p style="margin: 3px 0;"><span style="color: #64748b; font-weight: 500;">Coord:</span> ${lat.toFixed(5)}, ${lng.toFixed(5)}</p>
      </div>
      <button 
        id="btn-edit-${uuid}"
        style="margin-top: 10px; width: 100%; background-color: #3b82f6; color: #fff; border: none; font-size: 11px; font-weight: 600; padding: 6px 10px; border-radius: 6px; cursor: pointer; text-align: center; transition: background-color 0.2s;"
        onmouseover="this.style.backgroundColor='#2563eb'"
        onmouseout="this.style.backgroundColor='#3b82f6'"
      >
        Configure Geolocation
      </button>
    </div>
  `;
}

export const MAP_CSS_INJECT = `
  @keyframes flowDash {
    to {
      stroke-dashoffset: -24;
    }
  }
  .animated-flow-line {
    animation: flowDash 1.2s linear infinite;
  }
  .leaflet-container {
    border-radius: 12px;
    font-family: inherit;
    transition: background 0.3s, border 0.3s;
  }
  .leaflet-custom-popup .leaflet-popup-content-wrapper {
    background: transparent !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  .leaflet-custom-popup .leaflet-popup-tip {
    background: #0f172a !important;
    border: 1px solid rgba(255,255,255,0.15);
  }
  .leaflet-custom-popup .leaflet-popup-content {
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
  }
  /* Agent label tooltips (permanent, below each circleMarker) */
  .agent-label-tooltip {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .agent-label-tooltip::before {
    display: none !important;
  }
  .agent-map-label {
    display: inline-block;
    font-size: 9px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    border-width: 1px;
    border-style: solid;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    letter-spacing: 0.02em;
    box-shadow: 0 1px 4px rgba(0,0,0,0.25);
  }
  /* Zero-out default leaflet div icon styling (kept for compatibility) */
  .custom-div-icon {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }
`;
