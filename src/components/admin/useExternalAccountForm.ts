import { useState, useEffect } from "react";
import type { ManagedUser } from "@/lib/admin-api";
import { updateAdminAgentUser, deleteAdminAgentUser, createAdminExternalUser, getViewAsHeaders } from "@/lib/admin-api";

interface UseExternalAccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: ManagedUser | null;
  targetCompany?: string | null;
  modalContext?: 'agents' | 'user-accounts';
}

export function useExternalAccountForm({
  isOpen,
  onClose,
  onSuccess,
  user,
  targetCompany,
  modalContext = 'user-accounts',
}: UseExternalAccountFormProps) {
  const [adminRole, setAdminRole] = useState<string>("");
  const [adminCompany, setAdminCompany] = useState<string>("");
  const [adminAgentUuids, setAdminAgentUuids] = useState<string[]>([]);
  const [globalAgents, setGlobalAgents] = useState<string[]>([]);
  const [agentNamesMap, setAgentNamesMap] = useState<Record<string, string>>({});

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accountName, setAccountName] = useState("");
  const [role, setRole] = useState("COMPANY_ADMIN");
  const [companyName, setCompanyName] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [previewPic, setPreviewPic] = useState<string | null>(null);
  const [picFile, setPicFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Get current admin user context & global agent registry
  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/auth/me", { headers: getViewAsHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setAdminRole(data.user.role || "");
          setAdminCompany(data.user.company_name || "");
          setAdminAgentUuids(data.user.agent_uuids || []);
          
          // Default role berdasarkan konteks modal
          if (modalContext === 'agents') {
            // Agents: default ke TENANT_ADMIN (role teknikal)
            setRole("TENANT_ADMIN");
          } else if (data.user.role === "COMPANY_ADMIN") {
            setRole("COMPANY_OPERATOR");
          } else {
            setRole("COMPANY_ADMIN");
          }
        }
      })
      .catch(console.error);

    fetch("/api/dashboard/agents", { headers: getViewAsHeaders() })
      .then(res => res.json())
      .then(json => {
        if (json.ok && json.agents) {
          setGlobalAgents(json.agents);
        }
      })
      .catch(console.error);

    fetch("/api/auth/admin/users", { credentials: "include", headers: getViewAsHeaders() })
      .then(res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data && data.ok && Array.isArray(data.data)) {
          const map: Record<string, string> = {};
          data.data.forEach((u: any) => {
            if (u.role === "AGENT_VIEWER" && u.agent_uuid) {
              map[u.agent_uuid] = u.account_name || u.agent_uuid;
            }
          });
          setAgentNamesMap(map);
        }
      })
      .catch(console.error);
  }, [isOpen]);

  // Load existing user data when in edit mode
  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSuccess("");
    setPicFile(null);
    if (user) {
      setUsername(user.username);
      setAccountName(user.account_name || "");
      setRole(user.role);
      setCompanyName(user.company_name || "");
      setSelectedAgents(user.agent_uuids || []);
      setPassword("");
      setPreviewPic(
        user.profile_picture
          ? `/api/auth/uploads/${user.profile_picture}`
          : null
      );
    } else {
      setUsername("");
      setAccountName("");
      setCompanyName(targetCompany || "");
      setSelectedAgents([]);
      setPassword("");
      setPreviewPic(null);
    }
  }, [isOpen, user, targetCompany]);

  const handlePicChange = (file: File) => {
    setPicFile(file);
    setPreviewPic(URL.createObjectURL(file));
  };

  const handleAgentCheck = (agentUuid: string, checked: boolean) => {
    if (checked) {
      setSelectedAgents(prev => [...prev, agentUuid]);
    } else {
      setSelectedAgents(prev => prev.filter(uuid => uuid !== agentUuid));
    }
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
      
      const finalCompany = adminRole === "COMPANY_ADMIN" ? adminCompany : companyName;
      if (finalCompany) fd.append("company_name", finalCompany);
      fd.append("agent_uuids", JSON.stringify(selectedAgents));

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

  const availableAgents = adminRole === "COMPANY_ADMIN" ? adminAgentUuids : globalAgents;

  return {
    adminRole,
    adminCompany,
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
    setPreviewPic,
    isSubmitting,
    isDeleting,
    success,
    error,
    setError,
    availableAgents,
    agentNamesMap,
    handlePicChange,
    handleAgentCheck,
    handleSubmit,
    handleDelete,
  };
}
