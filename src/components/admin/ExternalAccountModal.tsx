"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import type { ManagedUser } from "@/lib/admin-api";
import { useExternalAccountForm } from "./useExternalAccountForm";
import { ExternalAccountFormFields } from "./ExternalAccountFormFields";

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

              <ExternalAccountFormFields
                isEdit={isEdit}
                adminRole={adminRole}
                modalContext={modalContext}
                previewPic={previewPic}
                handlePicChange={handlePicChange}
                accountName={accountName}
                setAccountName={setAccountName}
                role={role}
                setRole={setRole}
                companyName={companyName}
                setCompanyName={setCompanyName}
                availableAgents={availableAgents}
                selectedAgents={selectedAgents}
                handleAgentCheck={handleAgentCheck}
                agentNamesMap={agentNamesMap}
                username={username}
                setUsername={setUsername}
                password={password}
                setPassword={setPassword}
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
