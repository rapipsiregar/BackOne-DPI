"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { getAdminUsers, getViewAsHeaders, startViewAsUser, unlockUser, type ManagedUser } from "@/lib/admin-api";

import { HelpTrigger } from "@/components/help/HelpTrigger";
import ExternalAccountModal from "@/components/admin/ExternalAccountModal";
import { getColumns } from "./columns";
import CompanyCard, { CompanyGroup } from "./CompanyCard";
import { EmptyState } from "./EmptyState";

export default function UserAccountsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState<ManagedUser | null>(null);
  const [targetCompany, setTargetCompany] = useState<string | null>(null);
  const [viewAsLoading, setViewAsLoading] = useState<string | null>(null);
  const [unlockLoading, setUnlockLoading] = useState<string | number | null>(null);
  const [agentRegistry, setAgentRegistry] = useState<Record<string, string>>({});

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const users = await getAdminUsers();
      setManagedUsers(users);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve user data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    document.title = "User Accounts | BackOne - Deep Package Inspection";
    
    fetch("/api/auth/me", { headers: getViewAsHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          const userRole = data.user.role || null;
          setRole(userRole);
          setCurrentUsername(data.user.username || null);
          if (userRole !== "SUPER_ADMIN" && userRole !== "EXECUTIVE" && userRole !== "COMPANY_ADMIN") {
            router.push("/");
          } else {
            loadData();
            fetch("/api/dashboard/agents/list", { headers: getViewAsHeaders() })
              .then(r => r.json())
              .then(json => {
                if (json.ok && Array.isArray(json.data)) {
                  const map: Record<string, string> = {};
                  json.data.forEach((a: any) => {
                    if (a.uuid) map[a.uuid] = a.label || a.uuid;
                  });
                  setAgentRegistry(map);
                }
              })
              .catch(() => {});
          }
        } else {
          setIsLoading(false);
        }
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [router]);

  if (!mounted) return null;

  const COMPANY_ROLES = ['COMPANY_ADMIN', 'COMPANY_OPERATOR', 'COMPANY_VIEWER'];
  const companyUsers = managedUsers.filter(u => COMPANY_ROLES.includes(u.role || '') && u.company_name);
  
  const companiesMap: Record<string, ManagedUser[]> = {};
  companyUsers.forEach(u => {
    if (u.company_name) {
      if (!companiesMap[u.company_name]) {
        companiesMap[u.company_name] = [];
      }
      companiesMap[u.company_name].push(u);
    }
  });

  const companies: CompanyGroup[] = Object.entries(companiesMap).map(([name, users]) => ({
    name,
    users
  }));

  const handleEditClick = (user: ManagedUser) => {
    setModalUser(user);
    setTargetCompany(user.company_name || null);
    setIsModalOpen(true);
  };

  const handleAddUserClick = (companyName: string) => {
    setModalUser(null);
    setTargetCompany(companyName);
    setIsModalOpen(true);
  };

  const handleViewAsUser = async (user: ManagedUser) => {
    const agentUuids = user.agent_uuids || [];
    if (agentUuids.length === 0) {
      alert(`User "${user.account_name || user.username}" has no assigned agents. Cannot enter View-As mode.`);
      return;
    }
    const targetAgentUuid = agentUuids[0];
    const agentLabel = agentRegistry[targetAgentUuid] || targetAgentUuid;
    const userName = user.account_name || user.username;
    const userRole = user.role;
    setViewAsLoading(user.username);
    try {
      await startViewAsUser(targetAgentUuid, agentLabel, userName, userRole, user.id);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      alert('Failed to enter View As mode: ' + err.message);
    } finally {
      setViewAsLoading(null);
    }
  };

  const handleUnlockUser = async (user: ManagedUser) => {
    setUnlockLoading(user.id);
    try {
      const res = await unlockUser(user.id);
      if (res.ok) {
        await loadData();
      } else {
        alert('Failed to unlock user: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Failed to unlock user: ' + err.message);
    } finally {
      setUnlockLoading(null);
    }
  };

  const columns = getColumns({
    role,
    currentUsername,
    viewAsLoading,
    unlockLoading: unlockLoading !== null ? String(unlockLoading) : null,
    onEditClick: handleEditClick,
    onViewAsClick: (role === "SUPER_ADMIN" || role === "COMPANY_ADMIN") ? handleViewAsUser : undefined,
    onUnlockClick: (role === "SUPER_ADMIN" || role === "COMPANY_ADMIN" || role === "TENANT_ADMIN") ? handleUnlockUser : undefined,
  });

  return (
    <div className="space-y-6 pb-24 sm:pb-10 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4 w-full">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2 sm:gap-3 truncate">
              <span>User Accounts Directory</span>
              {isLoading && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-amber-500 flex-shrink-0" />}
            </h2>
            {/* Mobile Actions: Inline next to Title */}
            <div className="flex items-center gap-1.5 flex-shrink-0 sm:hidden">
              <HelpTrigger pageId="user-accounts" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-normal sm:leading-relaxed">
            Manage company tenant user access, roles, and device ownership delegation.
          </p>
        </div>

        {/* Laptop/Tablet Actions: Floats on the right */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <HelpTrigger pageId="user-accounts" />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="space-y-8">
          {companies.length === 0 ? (
            <EmptyState role={role} onAddUserClick={handleAddUserClick} />
          ) : (
            companies.map((company) => (
              <CompanyCard
                key={company.name}
                company={company}
                role={role}
                columns={columns}
                onAddUserClick={handleAddUserClick}
              />
            ))
          )}
          
          {role === "SUPER_ADMIN" && companies.length > 0 && (
            <div className="flex justify-end pt-2 pb-6 sm:pb-0">
              <button
                type="button"
                onClick={() => handleAddUserClick("")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all shadow-lg shadow-amber-600/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add New Company Admin
              </button>
            </div>
          )}
        </div>
      )}

      <ExternalAccountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalUser(null);
          setTargetCompany(null);
        }}
        onSuccess={() => {
          setIsModalOpen(false);
          setModalUser(null);
          setTargetCompany(null);
          loadData();
        }}
        user={modalUser}
        targetCompany={targetCompany}
        targetSiteUuid={null}
        targetCreatedBy={role === "SUPER_ADMIN" ? "admin" : undefined}
      />
    </div>
  );
}
