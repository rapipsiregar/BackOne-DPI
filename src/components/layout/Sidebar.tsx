"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Activity,
  AppWindow,
  Globe,
  LayoutDashboard,
  Shield,
  ShieldAlert,
  Server,
  Zap,
  Radio,
  Lock,
  Search,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const [user, setUser] = useState<{ role?: string; agent_uuid?: string } | null>(null);

  // Change Password state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time checks for password strength validation
  const isMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid = isMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecial && passwordsMatch;

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
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setSuccessMsg("");
        }, 1500);
      } else {
        setErrorMsg(data.error || "Gagal mengubah password");
      }
    } catch (err) {
      setErrorMsg("Terjadi kesalahan koneksi");
    } finally {
      setIsSubmitting(false);
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
      <div className="flex flex-1 flex-col overflow-y-auto relative z-10">
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

      <div className="p-4 border-t border-border/50 relative z-10 shrink-0 space-y-1.5">
        <button
          onClick={() => {
            setErrorMsg("");
            setSuccessMsg("");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setIsChangePasswordOpen(true);
          }}
          className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-secondary/50 hover:text-white transition-all duration-200"
        >
          <Lock className="mr-3 h-5 w-5" />
          Change Password
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>

      <Modal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} title="Ubah Password">
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
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Password Baru</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Real-time Checklist */}
          <div className="rounded-lg bg-secondary/30 p-3.5 border border-border/50 space-y-2">
            <span className="text-xs font-semibold text-slate-300">Syarat Kekuatan Password:</span>
            <ul className="text-xs space-y-1.5">
              <li className={cn("flex items-center transition-colors duration-200", isMinLength ? "text-green-400 font-medium" : "text-slate-400")}>
                <span className="mr-2">{isMinLength ? "✓" : "○"}</span> Minimal 8 karakter
              </li>
              <li className={cn("flex items-center transition-colors duration-200", hasUppercase ? "text-green-400 font-medium" : "text-slate-400")}>
                <span className="mr-2">{hasUppercase ? "✓" : "○"}</span> Mengandung huruf besar (A-Z)
              </li>
              <li className={cn("flex items-center transition-colors duration-200", hasLowercase ? "text-green-400 font-medium" : "text-slate-400")}>
                <span className="mr-2">{hasLowercase ? "✓" : "○"}</span> Mengandung huruf kecil (a-z)
              </li>
              <li className={cn("flex items-center transition-colors duration-200", hasNumber ? "text-green-400 font-medium" : "text-slate-400")}>
                <span className="mr-2">{hasNumber ? "✓" : "○"}</span> Mengandung angka (0-9)
              </li>
              <li className={cn("flex items-center transition-colors duration-200", hasSpecial ? "text-green-400 font-medium" : "text-slate-400")}>
                <span className="mr-2">{hasSpecial ? "✓" : "○"}</span> Mengandung karakter spesial (contoh: @$!%*?&)
              </li>
              <li className={cn("flex items-center transition-colors duration-200", passwordsMatch ? "text-green-400 font-medium" : "text-slate-400")}>
                <span className="mr-2">{passwordsMatch ? "✓" : "○"}</span> Password cocok
              </li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsChangePasswordOpen(false)}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/80 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!isPasswordValid || isSubmitting}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200",
                isPasswordValid && !isSubmitting 
                  ? "bg-primary hover:bg-primary/90 shadow-primary/25 cursor-pointer" 
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              )}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Password"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
