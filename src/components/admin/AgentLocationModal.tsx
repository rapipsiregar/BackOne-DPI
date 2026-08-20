"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { getViewAsHeaders } from "@/lib/admin-api";
import { AgentLocationFormFields } from "./AgentLocationFormFields";

interface AgentLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agentUuid: string;
  agentLabel: string;
  currentLocation: { latitude: number; longitude: number; label: string } | null;
}

export default function AgentLocationModal({
  isOpen,
  onClose,
  onSuccess,
  agentUuid,
  agentLabel,
  currentLocation,
}: AgentLocationModalProps) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [label, setLabel] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSuccess("");
    if (currentLocation) {
      setLatitude(String(currentLocation.latitude));
      setLongitude(String(currentLocation.longitude));
      setLabel(currentLocation.label || "");
    } else {
      setLatitude("");
      setLongitude("");
      setLabel("");
    }
  }, [isOpen, currentLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latitude || !longitude) {
      setError("Latitude and Longitude are required.");
      return;
    }

    const latVal = parseFloat(latitude);
    const lngVal = parseFloat(longitude);

    if (isNaN(latVal) || latVal < -90 || latVal > 90) {
      setError("Latitude must be a valid number between -90 and 90.");
      return;
    }
    if (isNaN(lngVal) || lngVal < -180 || lngVal > 180) {
      setError("Longitude must be a valid number between -180 and 180.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/dashboard/agent-locations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getViewAsHeaders()
        },
        body: JSON.stringify({
          agent_uuid: agentUuid,
          latitude: latVal,
          longitude: lngVal,
          label: label.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update location.");
      }

      setSuccess("Location coordinates successfully updated!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset this agent coordinates to default (Jakarta)?")) return;

    setIsResetting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/dashboard/agent-locations/${agentUuid}`, {
        method: "DELETE",
        headers: getViewAsHeaders(),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to reset location.");
      }

      setSuccess("Location coordinates successfully reset to default.");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-xl"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-primary/25 p-2 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Agent Geolocation</h3>
                <p className="text-xs text-slate-400">Configure coordinates for <span className="text-primary font-medium">{agentLabel}</span></p>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/10 bg-red-500/5 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-green-500/10 bg-green-500/5 p-3 text-xs text-green-400">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <AgentLocationFormFields
                latitude={latitude}
                setLatitude={setLatitude}
                longitude={longitude}
                setLongitude={setLongitude}
                label={label}
                setLabel={setLabel}
              />

              <div className="mt-6 flex justify-between gap-3 pt-2">
                {currentLocation ? (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isResetting || isSubmitting}
                    className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 py-2.5 px-4 text-xs font-semibold text-slate-400 transition-colors disabled:opacity-50"
                  >
                    {isResetting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Reset Coordinates
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] py-2.5 px-4.5 text-xs font-semibold text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isResetting}
                    className="flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary-hover py-2.5 px-5 text-xs font-semibold text-white shadow-lg transition-colors disabled:opacity-50"
                  >
                    {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save Location
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
