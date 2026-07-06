"use client";

import { useState, useEffect, useRef } from "react";
import { X, User, Key, Tag, Cpu, Upload, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { ManagedUser } from "@/lib/admin-api";
import { createAdminAgentUser, updateAdminAgentUser, deleteAdminAgentUser } from "@/lib/admin-api";

interface AgentAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agentUuid: string;
  agentLabel: string;
  existingUser: ManagedUser | null; // null = create mode
}

export default function AgentAccountModal({
  isOpen,
  onClose,
  onSuccess,
  agentUuid,
  agentLabel,
  existingUser,
}: AgentAccountModalProps) {
  const isEdit = !!existingUser;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accountName, setAccountName] = useState("");
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
    if (existingUser) {
      setUsername(existingUser.username);
      setAccountName(existingUser.account_name || "");
      setPassword("");
      setPreviewPic(
        existingUser.profile_picture
          ? `/api/auth/uploads/${existingUser.profile_picture}`
          : null
      );
    } else {
      setUsername("");
      setAccountName(agentLabel !== agentUuid ? agentLabel : "");
      setPassword("");
      setPreviewPic(null);
    }
  }, [isOpen, existingUser, agentUuid, agentLabel]);

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicFile(file);
    setPreviewPic(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      if (isEdit) {
        const fd = new FormData();
        fd.append("user_id", String(existingUser!.id));
        if (username.trim()) fd.append("username", username.trim());
        if (password) fd.append("password", password);
        fd.append("account_name", accountName.trim());
        fd.append("agent_uuid", agentUuid);
        if (picFile) fd.append("profile_picture", picFile);
        await updateAdminAgentUser(fd);
        setSuccess("Akun berhasil diperbarui!");
      } else {
        await createAdminAgentUser({
          username: username.trim(),
          password,
          account_name: accountName.trim() || undefined,
          agent_uuid: agentUuid,
        });
        setSuccess("Akun Network Agent berhasil dibuat!");
      }
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingUser) return;
    if (!confirm(`Hapus akun "${existingUser.username}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    setIsDeleting(true);
    try {
      await deleteAdminAgentUser(existingUser.id);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-gradient-to-r from-blue-900/40 to-slate-900">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEdit ? "Edit Akun Agent" : "Buat Akun Agent Baru"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{agentUuid}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden bg-slate-800"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewPic ? (
                <img src={previewPic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-6 h-6 text-slate-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">Foto Profil</p>
              <p className="text-xs text-slate-500">Klik untuk upload gambar</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
          </div>

          {/* Account Name (Label) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <Tag className="w-3.5 h-3.5 inline mr-1" />
              Nama Akun (Label Agent)
            </label>
            <input
              type="text"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder="Contoh: Gateway 007"
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-slate-500 mt-1">Nama ini akan tampil sebagai label di tab Agents</p>
          </div>

          {/* Agent UUID (readonly info) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <Cpu className="w-3.5 h-3.5 inline mr-1" />
              UUID Agent
            </label>
            <input
              type="text"
              value={agentUuid}
              readOnly
              className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 font-mono text-sm cursor-not-allowed"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1" />
              Username Login
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username untuk login"
              required={!isEdit}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <Key className="w-3.5 h-3.5 inline mr-1" />
              Password {isEdit && <span className="text-slate-500">(kosongkan jika tidak ingin mengubah)</span>}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={isEdit ? "••••••••" : "Password baru"}
              required={!isEdit}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
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
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm hover:bg-red-900/50 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Hapus
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? "Simpan Perubahan" : "Buat Akun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
