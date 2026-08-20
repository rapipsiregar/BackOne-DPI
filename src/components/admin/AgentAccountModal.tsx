"use client";

import { useState, useEffect, useRef } from "react";
import { X, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { ManagedUser } from "@/lib/admin-api";
import { createAdminAgentUser, updateAdminAgentUser, deleteAdminAgentUser } from "@/lib/admin-api";
import { AgentAccountFormFields } from "./AgentAccountFormFields";

interface AgentAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agentUuid: string;
  agentLabel: string;
  existingUser: ManagedUser | null;
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
        const payload: Record<string, any> = {
          user_id: String(existingUser!.id),
          account_name: accountName.trim(),
          agent_uuid: agentUuid,
        };
        if (username.trim()) payload.username = username.trim();
        if (password) payload.password = password;

        await updateAdminAgentUser(payload);

        if (picFile) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(picFile);
          });
          await fetch('/api/auth/upload-profile-picture', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profile_picture_base64: base64, user_id: String(existingUser!.id) }),
          });
        }

        setSuccess("Account successfully updated!");
      } else {
        await createAdminAgentUser({
          username: username.trim(),
          password,
          account_name: accountName.trim() || undefined,
          agent_uuid: agentUuid,
        });
        setSuccess("Network Agent account successfully created!");
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
    if (!confirm(`Delete account "${existingUser.username}"? This action cannot be undone.`)) return;
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-gradient-to-r from-blue-900/40 to-slate-900">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isEdit ? "Edit Agent Account" : "Create New Agent Account"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{agentUuid}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <AgentAccountFormFields
            isEdit={isEdit}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            accountName={accountName}
            setAccountName={setAccountName}
            agentUuid={agentUuid}
            previewPic={previewPic}
            fileInputRef={fileInputRef}
            handlePicChange={handlePicChange}
          />

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

          <div className="flex gap-2 pt-2">
            {isEdit && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm hover:bg-red-900/50 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? "Save Changes" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
