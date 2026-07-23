export const MAP_CSS = `
  .leaflet-control-attribution { display:none !important; }
  .agent-popup .leaflet-popup-content-wrapper { background:#0a1224!important; border:1px solid rgba(99,102,241,0.25)!important; box-shadow:0 12px 36px rgba(0,0,0,0.65)!important; padding:0!important; border-radius:12px!important; }
  .agent-popup .leaflet-popup-content { margin:0!important; }
  .agent-popup .leaflet-popup-tip-container { display:none!important; }
  .agent-popup .leaflet-popup-close-button { color:#94a3b8!important; font-size:18px!important; top:8px!important; right:10px!important; }
  .agent-label-tooltip { background:transparent!important; border:none!important; box-shadow:none!important; padding:0!important; }
  .agent-label-tooltip::before { display:none!important; }
  @keyframes dash-flow { to { stroke-dashoffset:-20; } }
  .flow-line { animation: dash-flow 1.4s linear infinite; }
  
  /* Tooltip and popup custom classes */
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
