"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, User, Key, Tag, Loader2, AlertCircle, CheckCircle2, Trash2, Shield } from "lucide-react";
import type { ManagedUser } from "@/lib/admin-api";
import { useExternalAccountForm } from "./useExternalAccountForm";
import RoleSelect from "./RoleSelect";
import AgentChecklist from "./AgentChecklist";
import ProfilePictureInput from "./ProfilePictureInput";

interface ExternalAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: ManagedUser | null;
  targetSiteUuid?: string | null;
  targetCreatedBy?: string | null;
  targetCompany?: string | null;
  modalContext?: 'agents' | 'user-accounts';
}

export default function ExternalAccountModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  targetSiteUuid,
  targetCreatedBy,
  targetCompany,
  modalContext = 'user-accounts',
}: ExternalAccountModalProps) {
  const {
    adminRole,
    username,
    setUsername,
    password,
    setPassword,
    accountName,
    setAccountName,
    role,
    setRole,
    companyName,
    setCompanyName,
    selectedAgents,
    previewPic,
    isSubmitting,
    isDeleting,
    success,
    error,
    availableAgents,
    agentNamesMap,
    handlePicChange,
    handleAgentCheck,
    handleSubmit,
    handleDelete,
  } = useExternalAccountForm({
    isOpen,
    onClose,
    onSuccess,
    user,
    targetCompany,
    modalContext,
  });

  const isEdit = !!user;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-700 bg-gradient-to-r from-amber-900/40 to-slate-900 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isEdit
                    ? "Manage Account"
                    : modalContext === 'agents'
                      ? "Create Technical Account"
                      : "Create Company Account"}
                </h3>
                {isEdit && (
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Role:{" "}
                    <span className="font-semibold text-amber-400">
                      {user.role.replace("_", " ")}
                    </span>
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar"
            >
              {isEdit && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex gap-3 text-xs text-amber-200/80 mb-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <p>
                    <strong>Password Recovery:</strong> For security reasons, original passwords cannot
                    be viewed. To recover an account, enter a new password below to reset it.
                  </p>
                </div>
              )}

              <ProfilePictureInput previewPic={previewPic} onChange={handlePicChange} />

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  <Tag className="w-3.5 h-3.5 inline mr-1" />
                  Account Name
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {!isEdit && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    <Shield className="w-3.5 h-3.5 inline mr-1" />
                    Account Role
                  </label>
                  <RoleSelect adminRole={adminRole} value={role} onChange={setRole} modalContext={modalContext} />
                </div>
              )}

              {/* Company Name: hanya untuk User Accounts context */}
              {modalContext === 'user-accounts' && adminRole === "SUPER_ADMIN" && (role === "COMPANY_ADMIN" || isEdit) && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    🏢 Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Nama Perusahaan (e.g. IFG)"
                    required
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              )}

              {/* Agent Checklist: hanya untuk User Accounts context (COMPANY_*) */}
              {modalContext === 'user-accounts' && (
                role === "COMPANY_ADMIN" ||
                role === "COMPANY_OPERATOR" ||
                role === "COMPANY_VIEWER"
              ) && (
                <AgentChecklist
                  availableAgents={availableAgents}
                  selectedAgents={selectedAgents}
                  onAgentCheck={handleAgentCheck}
                  agentNamesMap={agentNamesMap}
                />
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  <User className="w-3.5 h-3.5 inline mr-1" />
                  Login Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username for login"
                  required
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  <Key className="w-3.5 h-3.5 inline mr-1" />
                  {isEdit ? "Reset Password" : "Password"}{" "}
                  {isEdit && (
                    <span className="text-slate-500">(leave blank to keep unchanged)</span>
                  )}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEdit ? "Type new password to override" : "Create password"}
                  required={!isEdit}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

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

              <div className="flex gap-2 pt-2 shrink-0">
                {isEdit && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting || isSubmitting}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm hover:bg-red-900/50 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isDeleting || isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-600 text-slate-300 text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
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
