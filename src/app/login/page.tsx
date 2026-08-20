"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff, ShieldAlert, Timer } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (lockoutSeconds === null || lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setError("");
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds !== null && lockoutSeconds > 0) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      let data: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { error: text || `Server error (${res.status})` };
      }

      if (!res.ok) {
        if (data.lockout_seconds) {
          setLockoutSeconds(data.lockout_seconds);
        }
        throw new Error(data.error || data.message || "Login failed");
      }

      // Selalu bersihkan state view-as lama saat login akun baru
      if (typeof window !== "undefined") {
        localStorage.removeItem("backone_view_as");
      }

      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isLockedOut = lockoutSeconds !== null && lockoutSeconds > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-red-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-700/20 blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-md p-8 bg-sidebar/80 backdrop-blur-2xl rounded-2xl border border-border/50 shadow-2xl relative">
        <div className="flex flex-col items-center mb-8">
          <img src="/backone-logo.png" alt="BackOne" className="w-16 h-16 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)] mb-4" />
          <h1 className="text-2xl text-center font-bold font-backone text-white tracking-normal leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            BackOne Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs sm:text-sm space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
            {isLockedOut && (
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-red-500/20 font-mono font-bold text-red-300 text-base">
                <Timer className="w-4 h-4 animate-pulse" />
                <span>Unlock in {formatSeconds(lockoutSeconds)}</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              disabled={isLockedOut || loading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
              placeholder="Username"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              disabled={isLockedOut || loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
              placeholder="Password"
              required
            />
            <button
              type="button"
              disabled={isLockedOut || loading}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-white transition-colors focus:outline-none disabled:opacity-50"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || isLockedOut}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-blue-700 hover:from-red-500 hover:to-blue-600 text-white font-medium rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all duration-300 flex items-center justify-center mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLockedOut ? (
              `Locked (${formatSeconds(lockoutSeconds)})`
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
