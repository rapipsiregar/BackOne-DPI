"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

interface Props {
  onClose: () => void;
}

export default function PasswordTab({ onClose }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isMinLength = newPassword.length >= 6;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = isMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErrorMsg(data.error || "Failed to change password.");
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
        <label className="text-xs font-medium text-slate-300">Current Password</label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all focus:outline-none pr-10"
            placeholder="Enter current password"
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

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-300">New Password</label>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all focus:outline-none pr-10"
            placeholder="Enter new password"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
          >
            {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-300">Confirm New Password</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all focus:outline-none pr-10"
            placeholder="Re-enter new password"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
          >
            {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-secondary/40 to-background p-4 border border-border/50 shadow-inner space-y-3">
        <span className="text-xs font-semibold text-slate-200">Password Strength Requirements:</span>
        <ul className="text-xs space-y-2">
          <li className={cn("flex items-center transition-colors duration-200", isMinLength ? "text-green-400 font-medium" : "text-slate-400")}>
            <span className="mr-2.5 text-sm">{isMinLength ? "✓" : "○"}</span> At least 6 characters
          </li>
          <li className={cn("flex items-center transition-colors duration-200", hasUppercase ? "text-green-400 font-medium" : "text-slate-400")}>
            <span className="mr-2.5 text-sm">{hasUppercase ? "✓" : "○"}</span> Contains uppercase letter (A-Z)
          </li>
          <li className={cn("flex items-center transition-colors duration-200", hasLowercase ? "text-green-400 font-medium" : "text-slate-400")}>
            <span className="mr-2.5 text-sm">{hasLowercase ? "✓" : "○"}</span> Contains lowercase letter (a-z)
          </li>
          <li className={cn("flex items-center transition-colors duration-200", hasNumber ? "text-green-400 font-medium" : "text-slate-400")}>
            <span className="mr-2.5 text-sm">{hasNumber ? "✓" : "○"}</span> Contains number (0-9)
          </li>
          <li className={cn("flex items-center transition-colors duration-200", passwordsMatch ? "text-green-400 font-medium" : "text-slate-400")}>
            <span className="mr-2.5 text-sm">{passwordsMatch ? "✓" : "○"}</span> Passwords match
          </li>
        </ul>
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
          disabled={!isPasswordValid || isSubmitting}
          className="rounded-lg px-6 py-2 text-sm font-medium text-[#fff] shadow-lg bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none transition-all duration-300 flex items-center"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          ) : null}
          {isSubmitting ? "Saving..." : "Save Password"}
        </button>
      </div>
    </form>
  );
}
