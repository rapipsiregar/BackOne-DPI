"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users, Plus } from "lucide-react";
import { getAdminUsers, getViewAsHeaders, startViewAsUser, type ManagedUser } from "@/lib/admin-api";

import { HelpTrigger } from "@/components/help/HelpTrigger";
import ExternalAccountModal from "@/components/admin/ExternalAccountModal";
import { getColumns } from "./columns";
import CompanyCard, { CompanyGroup } from "./CompanyCard";

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
  // Registry agents untuk lookup label agent (digunakan pada View-As banner)
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
            // Juga load agent registry untuk label lookup (digunakan pada banner View-As)
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

  // User Accounts = HANYA akun customer/client (COMPANY_* roles)
  // Role teknikal/operasional (SOC_ANALYST, EXECUTIVE, ENGINEER, dll) ada di halaman Agents
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
    // View-As berdasarkan agent_uuids pertama yang di-assign ke user target
    const agentUuids = user.agent_uuids || [];
    if (agentUuids.length === 0) {
      alert(`User "${user.account_name || user.username}" has no assigned agents. Cannot enter View-As mode.`);
      return;
    }
    const targetAgentUuid = agentUuids[0];
    // Gunakan label agent dari registry (bukan UUID) untuk banner yang informatif
    const agentLabel = agentRegistry[targetAgentUuid] || targetAgentUuid;
    const userName = user.account_name || user.username;
    const userRole = user.role;
    setViewAsLoading(user.username);
    try {
      // startViewAsUser menyimpan: agent_label (label agent), user_name, user_role, view_as_type='user', target_user_id
      await startViewAsUser(targetAgentUuid, agentLabel, userName, userRole, user.id);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      alert('Failed to enter View As mode: ' + err.message);
    } finally {
      setViewAsLoading(null);
    }
  };


  const columns = getColumns({
    role,
    currentUsername,
    viewAsLoading,
    onEditClick: handleEditClick,
    onViewAsClick: (role === "SUPER_ADMIN" || role === "COMPANY_ADMIN") ? handleViewAsUser : undefined,
  });

  return (
    <div className="space-y-6 pb-24 sm:pb-10 animate-fade-in">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            User Accounts Directory
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-amber-500" />}
          </h2>
          <div className="shrink-0">
            <HelpTrigger pageId="user-accounts" />
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Manage company tenant user access, roles, and device ownership delegation.
        </p>
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
            <div className="max-w-md mx-auto py-12 px-6">
              <div className="relative overflow-hidden bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-3xl p-8 text-center shadow-2xl shadow-black/50">
                {/* Ambient glow highlight */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5 text-amber-400 shadow-lg shadow-amber-500/5 animate-pulse-subtle">
                  <Users className="w-8 h-8" />
                </div>
                
                <h3 className="relative text-white font-bold text-lg mb-1.5">No Company Accounts</h3>
                <p className="relative text-sm text-slate-400 mb-6 max-w-xs mx-auto">
                  Create the first company tenant admin account to get started.
                </p>
                
                {role === "SUPER_ADMIN" && (
                  <button
                    type="button"
                    onClick={() => handleAddUserClick("")}
                    className="relative inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/10 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Company Admin
                  </button>
                )}
              </div>
            </div>
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

      {/* Account Creation / Edit Modal */}
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
