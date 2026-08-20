"use client";

interface AgentLocationFormFieldsProps {
  latitude: string;
  setLatitude: (val: string) => void;
  longitude: string;
  setLongitude: (val: string) => void;
  label: string;
  setLabel: (val: string) => void;
}

export function AgentLocationFormFields({
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  label,
  setLabel,
}: AgentLocationFormFieldsProps) {
  return (
    <>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-300">Latitude</label>
        <div className="relative">
          <input
            type="text"
            required
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="e.g. -6.2263304"
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 py-2.5 px-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-primary/50 focus:bg-slate-950/60 focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-300">Longitude</label>
        <div className="relative">
          <input
            type="text"
            required
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="e.g. 106.4247322"
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 py-2.5 px-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-primary/50 focus:bg-slate-950/60 focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-300">Location Label (Optional)</label>
        <div className="relative">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Balaraja Office HQ"
            className="w-full rounded-xl border border-white/10 bg-slate-950/40 py-2.5 px-3.5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-primary/50 focus:bg-slate-950/60 focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>
    </>
  );
}
