"use client";

import { RefObject } from "react";
import { User, Key, Tag, Cpu, Upload } from "lucide-react";

interface AgentAccountFormFieldsProps {
  isEdit: boolean;
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  accountName: string;
  setAccountName: (val: string) => void;
  agentUuid: string;
  previewPic: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handlePicChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AgentAccountFormFields({
  isEdit,
  username,
  setUsername,
  password,
  setPassword,
  accountName,
  setAccountName,
  agentUuid,
  previewPic,
  fileInputRef,
  handlePicChange,
}: AgentAccountFormFieldsProps) {
  return (
    <>
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
          <p className="text-sm font-medium text-slate-300">Profile Picture</p>
          <p className="text-xs text-slate-500">Click to upload image</p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePicChange} />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          <Tag className="w-3.5 h-3.5 inline mr-1" />
          Account Name (Label Agent)
        </label>
        <input
          type="text"
          value={accountName}
          onChange={e => setAccountName(e.target.value)}
          placeholder="e.g., Gateway 007"
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
        <p className="text-xs text-slate-500 mt-1">This name will appear as a label in the Agents tab</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          <Cpu className="w-3.5 h-3.5 inline mr-1" />
          Agent UUID
        </label>
        <input
          type="text"
          value={agentUuid}
          readOnly
          className="w-full px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 font-mono text-sm cursor-not-allowed"
        />
      </div>

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
          required={!isEdit}
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          <Key className="w-3.5 h-3.5 inline mr-1" />
          Password {isEdit && <span className="text-slate-500">(leave blank to keep unchanged)</span>}
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={isEdit ? "••••••••" : "New password"}
          required={!isEdit}
          className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>
    </>
  );
}
