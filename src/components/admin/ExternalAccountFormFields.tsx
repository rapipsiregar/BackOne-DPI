"use client";

import { User, Key, Tag, Shield } from "lucide-react";
import RoleSelect from "./RoleSelect";
import AgentChecklist from "./AgentChecklist";
import ProfilePictureInput from "./ProfilePictureInput";

interface ExternalAccountFormFieldsProps {
  isEdit: boolean;
  adminRole: string;
  modalContext: 'agents' | 'user-accounts';
  previewPic: string | null;
  handlePicChange: (file: File) => void;
  accountName: string;
  setAccountName: (val: string) => void;
  role: string;
  setRole: (val: string) => void;
  companyName: string;
  setCompanyName: (val: string) => void;
  availableAgents: string[];
  selectedAgents: string[];
  handleAgentCheck: (agentUuid: string, checked: boolean) => void;
  agentNamesMap: Record<string, string>;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
}

export function ExternalAccountFormFields({
  isEdit,
  adminRole,
  modalContext,
  previewPic,
  handlePicChange,
  accountName,
  setAccountName,
  role,
  setRole,
  companyName,
  setCompanyName,
  availableAgents,
  selectedAgents,
  handleAgentCheck,
  agentNamesMap,
  username,
  setUsername,
  password,
  setPassword,
}: ExternalAccountFormFieldsProps) {
  return (
    <>
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
    </>
  );
}
