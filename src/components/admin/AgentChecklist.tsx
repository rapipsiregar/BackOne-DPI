"use client";

interface AgentChecklistProps {
  availableAgents: string[];
  selectedAgents: string[];
  onAgentCheck: (uuid: string, checked: boolean) => void;
  agentNamesMap: Record<string, string>;
}

export default function AgentChecklist({
  availableAgents,
  selectedAgents,
  onAgentCheck,
  agentNamesMap,
}: AgentChecklistProps) {
  const filteredAgents = availableAgents
    .filter(Boolean)
    .filter((uuid) => uuid.trim() !== "");

  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-2">
        🎯 Assign Network Agents ({selectedAgents.length} selected)
      </label>
      <div className="w-full max-h-40 overflow-y-auto bg-slate-800/40 border border-slate-700 rounded-lg p-3 space-y-2.5 custom-scrollbar">
        {filteredAgents.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No network agents available</p>
        ) : (
          filteredAgents.map((uuid) => {
            const isChecked = selectedAgents.includes(uuid);
            const agentName = agentNamesMap[uuid] || uuid;
            return (
              <label
                key={uuid}
                className="flex items-center gap-3 cursor-pointer group text-xs text-slate-300 select-none"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onAgentCheck(uuid, e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500/50 w-4 h-4 cursor-pointer"
                />
                <span className="group-hover:text-white transition-colors">
                  {agentName}
                </span>
                {agentName !== uuid && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({uuid})
                  </span>
                )}
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}
