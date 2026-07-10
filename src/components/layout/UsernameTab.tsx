"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  user: any;
  setUser: (user: any) => void;
  onClose: () => void;
}

export default function UsernameTab({ user, setUser, onClose }: Props) {
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch('/api/auth/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newUsername }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Username changed successfully!");
        setCurrentPassword("");
        setNewUsername("");
        if (user) {
          setUser({ ...user, username: data.newUsername });
        }
      } else {
        setErrorMsg(data.error || "Failed to change username.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "A system error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {errorMsg && (
        <div className="rounded-lg bg-red-500/10 p-3 text-red-400 border border-red-500/20">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg bg-green-500/10 p-3 text-green-400 border border-green-500/20">
          {successMsg}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-300">New Username</label>
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all focus:outline-none"
          placeholder="Enter new username (min. 4 characters)"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-300">Current Password (Authorization)</label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all focus:outline-none pr-10"
            placeholder="Enter password to continue"
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
          >
            {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-secondary hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!newUsername || !currentPassword || isSubmitting}
          className="rounded-lg px-6 py-2 text-sm font-medium text-[#fff] shadow-lg bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none transition-all duration-300 flex items-center"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          ) : null}
          {isSubmitting ? "Saving..." : "Save Username"}
        </button>
      </div>
    </form>
  );
}
