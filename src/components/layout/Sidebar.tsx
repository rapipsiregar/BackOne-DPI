"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Server,
  Activity,
  Globe,
  Radio,
  Zap,
  ShieldAlert,
  Shield,
  LogOut,
  Lock,
  Eye,
  EyeOff,
  AppWindow,
  Search,
  User,
  Image as ImageIcon,
  Upload,
  Trash2,
  Sun,
  Moon
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Modal } from "@/components/ui/Modal";

const navigation = [
  { name: "Summary", href: "/", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: Server },
  { name: "Devices", href: "/devices", icon: Server },
  { name: "Flows", href: "/flows", icon: Activity },
  { name: "Apps", href: "/apps", icon: AppWindow },
  { name: "App Database", href: "/lookup", icon: Search },
  { name: "Threats", href: "/threats", icon: ShieldAlert },
  { name: "Geography", href: "/geography", icon: Globe },
  { name: "DNS", href: "/dns", icon: Radio },
  { name: "Events", href: "/events", icon: Zap },
  { name: "Network Intelligence", href: "/network-intelligence", icon: Activity },
  { name: "Security Audit", href: "/security-audit", icon: Lock },
  { name: "Intelligence", href: "/intelligence", icon: Shield },
  { name: "Network Infra", href: "/network-infrastructure", icon: Server },
  { name: "DPI Analytics", href: "/dpi-analytics", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [user, setUser] = useState<{ username?: string; account_name?: string; profile_picture?: string; role?: string; agent_uuid?: string } | null>(null);

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'account_name' | 'username' | 'password' | 'profile_picture'>('account_name');

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Username state
  const [newUsername, setNewUsername] = useState("");
  const [usernameErrorMsg, setUsernameErrorMsg] = useState("");
  const [usernameSuccessMsg, setUsernameSuccessMsg] = useState("");
  const [isSubmittingUsername, setIsSubmittingUsername] = useState(false);

  // Account Name state
  const [newAccountName, setNewAccountName] = useState("");
  const [accountNameErrorMsg, setAccountNameErrorMsg] = useState("");
  const [accountNameSuccessMsg, setAccountNameSuccessMsg] = useState("");
  const [isSubmittingAccountName, setIsSubmittingAccountName] = useState(false);

  // Profile Picture state
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicErrorMsg, setProfilePicErrorMsg] = useState("");
  const [profilePicSuccessMsg, setProfilePicSuccessMsg] = useState("");
  const [isUploadingPic, setIsUploadingPic] = useState(false);

  // Change Password visibility state
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Real-time checks for password strength validation
  const isMinLength = newPassword.length >= 6;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = isMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Password berhasil diubah!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setErrorMsg(data.error || "Gagal mengubah password.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingUsername(true);
    setUsernameErrorMsg("");
    setUsernameSuccessMsg("");

    try {
      const res = await fetch('/api/auth/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newUsername }),
      });

      const data = await res.json();
      if (res.ok) {
        setUsernameSuccessMsg("Username berhasil diubah!");
        setCurrentPassword("");
        if (user) {
          setUser({ ...user, username: data.newUsername });
        }
      } else {
        setUsernameErrorMsg(data.error || "Gagal mengubah username.");
      }
    } catch (err: any) {
      setUsernameErrorMsg(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmittingUsername(false);
    }
  };

  const handleChangeAccountName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAccountName(true);
    setAccountNameErrorMsg("");
    setAccountNameSuccessMsg("");

    try {
      const res = await fetch('/api/auth/change-account-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newAccountName }),
      });

      const data = await res.json();
      if (res.ok) {
        setAccountNameSuccessMsg("Nama akun berhasil diubah!");
        setCurrentPassword("");
        if (user) {
          setUser({ ...user, account_name: data.newAccountName });
        }
      } else {
        setAccountNameErrorMsg(data.error || "Gagal mengubah nama akun.");
      }
    } catch (err: any) {
      setAccountNameErrorMsg(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmittingAccountName(false);
    }
  };

  const handleUploadProfilePicture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePicFile) return;

    setIsUploadingPic(true);
    setProfilePicErrorMsg("");
    setProfilePicSuccessMsg("");

    const formData = new FormData();
    formData.append('profile_picture', profilePicFile);

    try {
      const res = await fetch('/api/auth/upload-profile-picture', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setProfilePicSuccessMsg("Foto profil berhasil diperbarui!");
        setProfilePicFile(null);
        if (user) {
          setUser({ ...user, profile_picture: data.profile_picture });
        }
      } else {
        setProfilePicErrorMsg(data.error || "Gagal mengunggah foto profil.");
      }
    } catch (err: any) {
      setProfilePicErrorMsg(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsUploadingPic(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    setIsUploadingPic(true);
    setProfilePicErrorMsg("");
    setProfilePicSuccessMsg("");

    try {
      const res = await fetch('/api/auth/remove-profile-picture', {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        setProfilePicSuccessMsg("Foto profil berhasil dihapus!");
        if (user) {
          setUser({ ...user, profile_picture: undefined });
        }
      } else {
        setProfilePicErrorMsg(data.error || "Gagal menghapus foto profil.");
      }
    } catch (err: any) {
      setProfilePicErrorMsg(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsUploadingPic(false);
    }
  };

  const filteredNavigation = navigation.filter((item) => {
    if (user?.role === 'AGENT_VIEWER' && item.name === 'Agents') {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-full w-64 flex-col border-r border-border/50 bg-sidebar/80 backdrop-blur-2xl relative">
      {/* Subtle glow effect behind sidebar */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="flex h-[72px] shrink-0 items-center px-6 border-b border-border/50 relative z-10">
        <img src="/backone-logo.png" alt="BackOne Logo" className="w-8 h-8 mr-3 rounded-full drop-shadow-[0_0_10px_rgba(255,0,0,0.3)]" />
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 leading-tight">
            BackOne
          </span>
          <span className="text-[10px] font-medium text-muted-foreground tracking-wide mt-0.5">
            Deep Package Inspection
          </span>
        </div>
      </div>

      <div className="py-6 flex flex-col items-center border-b border-border/50 relative z-10">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-0.5 shadow-lg shadow-primary/20 overflow-hidden">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-background overflow-hidden relative">
              {user?.profile_picture ? (
                <img src={`/api/uploads/${user.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-white uppercase">
                  {user?.account_name ? user.account_name.charAt(0) : (user?.username ? user.username.charAt(0) : (user?.role === 'SUPER_ADMIN' ? 'A' : 'V'))}
                </span>
              )}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background bg-green-500 shadow-sm" />
        </div>
        
        <div className="mt-4 flex flex-col items-center w-full px-4 space-y-1.5">
          <span className="font-semibold text-white tracking-wide text-center leading-snug break-words max-w-full">
            {user?.account_name || user?.username || 'Loading...'}
          </span>
          <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-medium text-primary border border-primary/30 shrink-0">
            {user?.role === 'SUPER_ADMIN' ? 'PRO' : 'STD'}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto relative z-10 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20 transition-colors">
        <nav className="flex-1 space-y-1.5 px-3 py-6">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 overflow-hidden",
                  isActive
                    ? "bg-primary/10 text-white shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-white"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                )}
                
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 shrink-0 transition-all duration-300",
                    isActive 
                      ? "text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] scale-110" 
                      : "text-muted-foreground group-hover:text-white group-hover:scale-110"
                  )}
                  aria-hidden="true"
                />
                <span className="relative z-10">{item.name}</span>
                
                {/* Hover background effect */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none translate-x-[-100%] group-hover:translate-x-[100%] transition-transform" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="px-3 py-4 border-t border-border/50 relative z-10 shrink-0 space-y-1.5 flex flex-col">
        <button
          onClick={() => {
            setErrorMsg("");
            setSuccessMsg("");
            setUsernameErrorMsg("");
            setUsernameSuccessMsg("");
            setAccountNameErrorMsg("");
            setAccountNameSuccessMsg("");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setNewUsername("");
            setNewAccountName("");
            setProfilePicFile(null);
            setActiveTab("account_name");
            setIsAccountOpen(true);
          }}
          className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-secondary/50 hover:text-white transition-all duration-200"
        >
          <User className="mr-3 h-5 w-5" />
          Account Settings
        </button>
        <div className="flex w-full space-x-1.5">
          <button
            onClick={handleLogout}
            className="flex flex-1 items-center rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
          
          {mounted && (
            <button
              onClick={() => {
                const nextTheme = theme === 'dark' ? 'light' : 'dark';
                if (!document.startViewTransition) {
                  setTheme(nextTheme);
                  return;
                }
                document.startViewTransition(() => {
                  setTheme(nextTheme);
                });
              }}
              className="flex items-center justify-center rounded-lg px-3 py-2.5 text-slate-400 hover:bg-secondary/50 hover:text-white transition-all duration-200"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      <Modal isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} title="Account Settings">
        <div className="flex mb-6 border-b border-border/50">
          <button
            onClick={() => setActiveTab('account_name')}
            className={cn(
              "flex-1 pb-3 text-sm font-medium transition-colors relative",
              activeTab === 'account_name' ? "text-primary" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Ubah Nama
            {activeTab === 'account_name' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.5)]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('profile_picture')}
            className={cn(
              "flex-1 pb-3 text-sm font-medium transition-colors relative",
              activeTab === 'profile_picture' ? "text-primary" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Foto Profil
            {activeTab === 'profile_picture' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.5)]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('username')}
            className={cn(
              "flex-1 pb-3 text-sm font-medium transition-colors relative",
              activeTab === 'username' ? "text-primary" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Ubah Username
            {activeTab === 'username' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.5)]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={cn(
              "flex-1 pb-3 text-sm font-medium transition-colors relative",
              activeTab === 'password' ? "text-primary" : "text-slate-400 hover:text-slate-200"
            )}
          >
            Ubah Password
            {activeTab === 'password' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.5)]" />
            )}
          </button>
        </div>

        {activeTab === 'profile_picture' ? (
          <div className="space-y-4">
            {profilePicErrorMsg && (
              <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                {profilePicErrorMsg}
              </div>
            )}
            {profilePicSuccessMsg && (
              <div className="rounded-lg bg-green-500/10 p-3 text-xs text-green-400 border border-green-500/20">
                {profilePicSuccessMsg}
              </div>
            )}

            <div className="flex flex-col items-center justify-center py-4">
              <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-0.5 shadow-lg shadow-primary/20 mb-4 overflow-hidden relative group">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-background overflow-hidden relative">
                  {user?.profile_picture ? (
                    <img src={`/api/uploads/${user.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-white uppercase">
                      {user?.account_name ? user.account_name.charAt(0) : (user?.username ? user.username.charAt(0) : (user?.role === 'SUPER_ADMIN' ? 'A' : 'V'))}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3 w-full">
                <form onSubmit={handleUploadProfilePicture} className="flex-1 flex flex-col space-y-3">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfilePicFile(e.target.files ? e.target.files[0] : null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center justify-center w-full px-4 py-2 border border-dashed border-border rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <Upload className="w-4 h-4 mr-2 text-slate-400" />
                      <span className="text-sm text-slate-300 truncate">
                        {profilePicFile ? profilePicFile.name : "Pilih File Gambar"}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!profilePicFile || isUploadingPic}
                    className="w-full rounded-lg px-4 py-2 text-sm font-medium text-[#fff] shadow-lg bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none transition-all duration-300 flex items-center justify-center"
                  >
                    {isUploadingPic ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    ) : (
                      <ImageIcon className="w-4 h-4 mr-2" />
                    )}
                    {isUploadingPic ? "Mengunggah..." : "Unggah Foto"}
                  </button>
                </form>

                {user?.profile_picture && (
                  <button
                    onClick={handleRemoveProfilePicture}
                    disabled={isUploadingPic}
                    className="flex flex-col items-center justify-center px-4 py-2 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Hapus</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex justify-end pt-2 border-t border-border/50">
              <button
                type="button"
                onClick={() => setIsAccountOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-secondary hover:text-white transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : activeTab === 'account_name' ? (
          <form onSubmit={handleChangeAccountName} className="space-y-4">
            {accountNameErrorMsg && (
              <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                {accountNameErrorMsg}
              </div>
            )}
            {accountNameSuccessMsg && (
              <div className="rounded-lg bg-green-500/10 p-3 text-xs text-green-400 border border-green-500/20">
                {accountNameSuccessMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Nama Tampilan Baru</label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all focus:outline-none"
                placeholder="Misal: Super Admin Budi"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password Saat Ini (Otorisasi)</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all focus:outline-none pr-10"
                  placeholder="Ketik password untuk melanjutkan"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAccountOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-secondary hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!newAccountName || !currentPassword || isSubmittingAccountName}
                className="rounded-lg px-6 py-2 text-sm font-medium text-[#fff] shadow-lg bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none transition-all duration-300 flex items-center"
              >
                {isSubmittingAccountName ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : null}
                {isSubmittingAccountName ? "Menyimpan..." : "Simpan Nama Akun"}
              </button>
            </div>
          </form>
        ) : activeTab === 'username' ? (
          <form onSubmit={handleChangeUsername} className="space-y-4">
            {usernameErrorMsg && (
              <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                {usernameErrorMsg}
              </div>
            )}
            {usernameSuccessMsg && (
              <div className="rounded-lg bg-green-500/10 p-3 text-xs text-green-400 border border-green-500/20">
                {usernameSuccessMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Username Baru</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all focus:outline-none"
                placeholder="Masukkan username baru (min. 4 karakter)"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password Saat Ini (Otorisasi)</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all focus:outline-none pr-10"
                  placeholder="Ketik password untuk melanjutkan"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAccountOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-secondary hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!newUsername || !currentPassword || isSubmittingUsername}
                className="rounded-lg px-6 py-2 text-sm font-medium text-[#fff] shadow-lg bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none transition-all duration-300 flex items-center"
              >
                {isSubmittingUsername ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : null}
                {isSubmittingUsername ? "Menyimpan..." : "Simpan Username"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {errorMsg && (
              <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="rounded-lg bg-green-500/10 p-3 text-xs text-green-400 border border-green-500/20">
                {successMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password Saat Ini</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all focus:outline-none pr-10"
                  placeholder="Masukkan password saat ini"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password Baru</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all focus:outline-none pr-10"
                  placeholder="Ketik password baru"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Konfirmasi Password Baru</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background/50 backdrop-blur-sm px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all focus:outline-none pr-10"
                  placeholder="Ketik ulang password baru"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Real-time Checklist */}
            <div className="rounded-xl bg-gradient-to-br from-secondary/40 to-background p-4 border border-border/50 shadow-inner space-y-3">
              <span className="text-xs font-semibold text-slate-200">Syarat Kekuatan Password:</span>
              <ul className="text-xs space-y-2">
                <li className={cn("flex items-center transition-colors duration-200", isMinLength ? "text-green-400 font-medium" : "text-slate-400")}>
                  <span className="mr-2.5 text-sm">{isMinLength ? "✓" : "○"}</span> Minimal 6 karakter
                </li>
                <li className={cn("flex items-center transition-colors duration-200", hasUppercase ? "text-green-400 font-medium" : "text-slate-400")}>
                  <span className="mr-2.5 text-sm">{hasUppercase ? "✓" : "○"}</span> Mengandung huruf besar (A-Z)
                </li>
                <li className={cn("flex items-center transition-colors duration-200", hasLowercase ? "text-green-400 font-medium" : "text-slate-400")}>
                  <span className="mr-2.5 text-sm">{hasLowercase ? "✓" : "○"}</span> Mengandung huruf kecil (a-z)
                </li>
                <li className={cn("flex items-center transition-colors duration-200", hasNumber ? "text-green-400 font-medium" : "text-slate-400")}>
                  <span className="mr-2.5 text-sm">{hasNumber ? "✓" : "○"}</span> Mengandung angka (0-9)
                </li>
                <li className={cn("flex items-center transition-colors duration-200", passwordsMatch ? "text-green-400 font-medium" : "text-slate-400")}>
                  <span className="mr-2.5 text-sm">{passwordsMatch ? "✓" : "○"}</span> Password cocok
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAccountOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-secondary hover:text-white transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!isPasswordValid || isSubmitting}
                className="rounded-lg px-6 py-2 text-sm font-medium text-[#fff] shadow-lg bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none transition-all duration-300 flex items-center"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : null}
                {isSubmitting ? "Menyimpan..." : "Simpan Password"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
