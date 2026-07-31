"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

import AccountNameTab from "./AccountNameTab";
import ProfilePictureTab from "./ProfilePictureTab";
import UsernameTab from "./UsernameTab";
import PasswordTab from "./PasswordTab";
import ViewAsHistoryTab from "./ViewAsHistoryTab";

type Tab = 'account_name' | 'username' | 'password' | 'profile_picture' | 'view_as_history';

export function AccountSettingsModal({ 
  isOpen, 
  onClose,
  user,
  setUser
}: { 
  isOpen: boolean; 
  onClose: () => void;
  user: any;
  setUser: (user: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('account_name');
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'TENANT_ADMIN';
  const canViewHistory = isAdmin || user?.role === 'SOC_ANALYST';

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Account Settings"
      className="w-[95vw] max-w-3xl h-[85vh] max-h-[540px] md:h-[520px]"
    >
      <div className="flex flex-col md:flex-row gap-3 md:gap-6 h-full max-h-[440px] overflow-hidden">
        {/* Navigation Tabs (Horizontal on mobile, Vertical on desktop) */}
        <div className="w-full md:w-[190px] flex flex-row md:flex-col gap-1.5 border-b md:border-b-0 md:border-r border-border/50 pb-2.5 md:pb-0 md:pr-4 shrink-0 overflow-x-auto md:overflow-x-visible no-scrollbar">
          <button
            onClick={() => setActiveTab('account_name')}
            className={cn(
              "flex items-center justify-center md:justify-start px-3 py-2 md:px-3.5 md:py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-xl transition-all text-left whitespace-nowrap shrink-0",
              activeTab === 'account_name' 
                ? "bg-primary/10 text-primary border-b-2 md:border-b-0 md:border-l-2 border-primary" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
            )}
          >
            Change Name
          </button>
          
          <button
            onClick={() => setActiveTab('profile_picture')}
            className={cn(
              "flex items-center justify-center md:justify-start px-3 py-2 md:px-3.5 md:py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-xl transition-all text-left whitespace-nowrap shrink-0",
              activeTab === 'profile_picture' 
                ? "bg-primary/10 text-primary border-b-2 md:border-b-0 md:border-l-2 border-primary" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
            )}
          >
            Profile Picture
          </button>

          <button
            onClick={() => setActiveTab('username')}
            className={cn(
              "flex items-center justify-center md:justify-start px-3 py-2 md:px-3.5 md:py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-xl transition-all text-left whitespace-nowrap shrink-0",
              activeTab === 'username' 
                ? "bg-primary/10 text-primary border-b-2 md:border-b-0 md:border-l-2 border-primary" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
            )}
          >
            Username
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={cn(
              "flex items-center justify-center md:justify-start px-3 py-2 md:px-3.5 md:py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-xl transition-all text-left whitespace-nowrap shrink-0",
              activeTab === 'password' 
                ? "bg-primary/10 text-primary border-b-2 md:border-b-0 md:border-l-2 border-primary" 
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
            )}
          >
            Password
          </button>

          {canViewHistory && (
            <button
              onClick={() => setActiveTab('view_as_history')}
              className={cn(
                "flex items-center justify-center md:justify-start px-3 py-2 md:px-3.5 md:py-2.5 text-[11px] uppercase tracking-wider font-bold rounded-xl transition-all text-left whitespace-nowrap shrink-0",
                activeTab === 'view_as_history' 
                  ? "bg-primary/10 text-primary border-b-2 md:border-b-0 md:border-l-2 border-primary" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
              )}
            >
              View As History
            </button>
          )}
        </div>

        {/* Content Pane */}
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto pr-1 custom-scrollbar pt-1 md:pt-0">
          {activeTab === 'account_name' && (
            <AccountNameTab user={user} setUser={setUser} onClose={onClose} />
          )}

          {activeTab === 'profile_picture' && (
            <ProfilePictureTab user={user} setUser={setUser} onClose={onClose} />
          )}

          {activeTab === 'username' && (
            <UsernameTab user={user} setUser={setUser} onClose={onClose} />
          )}

          {activeTab === 'password' && (
            <PasswordTab onClose={onClose} />
          )}

          {activeTab === 'view_as_history' && canViewHistory && (
            <ViewAsHistoryTab onClose={onClose} />
          )}
        </div>
      </div>
    </Modal>
  );
}
