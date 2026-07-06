import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Image as ImageIcon, Upload, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

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

  // Reset state when modal closes or opens
  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Account Settings">

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
                onClick={() => onClose()}
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
                onClick={() => onClose()}
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
                onClick={() => onClose()}
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
                onClick={() => onClose()}
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
  );
}
