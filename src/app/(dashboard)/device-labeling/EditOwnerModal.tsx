"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Loader2 } from "lucide-react";
import { getViewAsHeaders } from "@/lib/admin-api";
import { DeviceLabelItem } from "./columns";

interface EditOwnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: DeviceLabelItem | null;
  onSaveSuccess: (mac: string, newLabel: string) => void;
}

export default function EditOwnerModal({
  isOpen,
  onClose,
  device,
  onSaveSuccess,
}: EditOwnerModalProps) {
  const [customLabelValue, setCustomLabelValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && device) {
      setCustomLabelValue(device.custom_label || "");
      setError(null);
      setSaveSuccessMsg(null);
    }
  }, [isOpen, device]);

  const handleSaveLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccessMsg(null);

    try {
      const res = await fetch("/api/dashboard/devices/update-label", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getViewAsHeaders(),
        },
        body: JSON.stringify({
          mac_address: device.mac_address,
          device_label: customLabelValue.trim(),
        }),
      });

      const resData = await res.json();
      if (resData.ok) {
        setSaveSuccessMsg("Owner label updated successfully!");
        onSaveSuccess(device.mac_address, customLabelValue.trim());
        
        // Delay closing modal slightly so user sees success state
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setError(resData.error || "Failed to update label.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update device label.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSaving && onClose()}
      title="Edit Device Owner Label"
    >
      {device && (
        <form onSubmit={handleSaveLabel} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              MAC Address
            </label>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <code className="text-sm text-slate-200 font-mono">{device.mac_address}</code>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Default System Label
            </label>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg text-sm text-slate-400">
              {device.default_label}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Custom Owner Label
            </label>
            <input
              type="text"
              value={customLabelValue}
              onChange={(e) => setCustomLabelValue(e.target.value)}
              placeholder="e.g. Finance Department Laptop"
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              disabled={isSaving}
              autoFocus
            />
            <p className="text-[10px] text-slate-500">
              Leave empty to clear the custom label and restore the system default.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs">
              ⚠️ {error}
            </div>
          )}

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold">
              ✓ {saveSuccessMsg}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-white/5 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-semibold shadow-md shadow-primary/10 transition-all"
              disabled={isSaving}
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
