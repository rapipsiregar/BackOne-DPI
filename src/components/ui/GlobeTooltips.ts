import { fmtBytes } from "@/lib/utils";

export const getArcTooltip = (d: any): string => `
  <div style="background: rgba(0,0,0,0.85); color: white; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; min-width: 180px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 6px; margin-bottom: 6px; color: #facc15;">
      ${d.fromLabel} 
    </div>
    <div style="font-weight: 600; font-size: 14px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 6px; margin-bottom: 6px; color: #38bdf8;">
      ${d.toLabel}
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
      <span style="color: #9ca3af;">Total Traffic:</span> <span>${fmtBytes(d.value)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
      <span style="color: #38bdf8;">Download:</span> <span>${fmtBytes(d.download)}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span style="color: #4ade80;">Upload:</span> <span>${fmtBytes(d.upload)}</span>
    </div>
  </div>
`;

export const getPointTooltip = (d: any): string => `
  <div style="background: rgba(0,0,0,0.85); color: white; padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 500; min-width: ${d.value > 0 ? '180px' : 'auto'}; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="font-weight: 600; font-size: 14px; ${d.value > 0 ? 'border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 6px; margin-bottom: 6px;' : ''}">${d.name}</div>
    ${d.value > 0 ? `
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #9ca3af;">Total Traffic:</span> <span>${fmtBytes(d.value)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="color: #38bdf8;">Download:</span> <span>${fmtBytes(d.download)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #4ade80;">Upload:</span> <span>${fmtBytes(d.upload)}</span>
      </div>
    ` : ''}
  </div>
`;
