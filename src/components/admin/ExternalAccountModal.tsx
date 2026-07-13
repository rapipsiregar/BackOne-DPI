"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Key, Tag, Upload, Loader2, CheckCircle2, AlertCircle, Trash2, Shield } from "lucide-react";
import type { ManagedUser } from "@/lib/admin-api";
import { updateAdminAgentUser, deleteAdminAgentUser, createAdminExternalUser } from "@/lib/admin-api";

interface ExternalAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: ManagedUser | null;
}

export default function ExternalAccountModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: ExternalAccountModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accountName, setAccountName] = useState("");
  const [role, setRole] = useState("SOC_ANALYST");
  const [previewPic, setPreviewPic] = useState<string | null>(null);
  const [picFile, setPicFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSuccess("");
    setPicFile(null);
    if (user) {
      setUsername(user.username);
      setAccountName(user.account_name || "");
      setRole(user.role);
      setPassword(""); // Selalu kosong agar admin bisa memasukkan password baru untuk di-reset
      setPreviewPic(
        user.profile_picture
          ? `/api/auth/uploads/${user.profile_picture}`
          : null
      );
    } else {
      setUsername("");
      setAccountName("");
      setRole("SOC_ANALYST");
      setPassword("");
      setPreviewPic(null);
    }
  }, [isOpen, user]);

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicFile(file);
    setPreviewPic(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEdit = !!user;
    
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      if (username.trim()) fd.append("username", username.trim());
      if (password) fd.append("password", password);
      fd.append("account_name", accountName.trim());
      if (picFile) fd.append("profile_picture", picFile);
      
      if (isEdit) {
        fd.append("user_id", String(user.id));
        await updateAdminAgentUser(fd);
        setSuccess(password ? "Password successfully reset & Account updated!" : "Account successfully updated!");
      } else {
        fd.append("role", role);
        await createAdminExternalUser(fd);
        setSuccess("External account successfully created!");
      }
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm(`Delete account "${user.username}"? This action cannot be undone.`)) return;
    
    setIsDeleting(true);
    try {
      await deleteAdminAgentUser(user.id);
      setSuccess("Account successfully deleted!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const isEdit = !!user;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-gradient-to-r from-amber-900/40 to-slate-900">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEdit ? "Manage External Account" : "Create External Account"}
            </h3>
            {isEdit && <p className="text-xs text-slate-400 mt-0.5 font-mono">Role: <span className="font-semibold text-amber-400">{user.role.replace('_', ' ')}</span></p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {isEdit && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex gap-3 text-xs text-amber-200/80 mb-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <p><strong>Password Recovery:</strong> For security reasons, original passwords cannot be viewed. To recover an account, enter a new password below to reset it.</p>
            </div>
          )}

          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-amber-500 transition-colors overflow-hidden bg-slate-800"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewPic ? (
                <img src={previewPic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-6 h-6 text-slate-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Profile Picture</p>
              <p className="text-xs text-slate-500">Click to upload image</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <Tag className="w-3.5 h-3.5 inline mr-1" />
              Account Name
            </label>
            <input
              type="text"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Role (Only for Create mode) */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                <Shield className="w-3.5 h-3.5 inline mr-1" />
                Account Role
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="SOC_ANALYST">SOC Analyst</option>
                <option value="ENGINEER">Engineer</option>
                <option value="TENANT_ADMIN">Tenant Admin</option>
              </select>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1" />
              Login Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username for login"
              required
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Password Reset / Create */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <Key className="w-3.5 h-3.5 inline mr-1" />
              {isEdit ? "Reset Password" : "Password"} {isEdit && <span className="text-slate-500">(leave blank to keep unchanged)</span>}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isEdit ? "Type new password to override" : "Create password"}
              required={!isEdit}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-900/30 border border-green-800 text-green-300 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm hover:bg-red-900/50 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting || isSubmitting}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting || isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? "Update & Reset" : "Create Account"}
            </button>
          </div>
        </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
