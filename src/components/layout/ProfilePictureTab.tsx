"use client";

import { useState } from "react";
import { Upload, ImageIcon, Trash2 } from "lucide-react";
import { SafeImage } from "../ui/SafeImage";

interface Props {
  user: any;
  setUser: (user: any) => void;
  onClose: () => void;
}

export default function ProfilePictureTab({ user, setUser, onClose }: Props) {
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePicFile) return;

    setIsUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    formData.append('profile_picture', profilePicFile);

    try {
      const res = await fetch('/api/auth/upload-profile-picture', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Profile picture updated successfully!");
        setProfilePicFile(null);
        if (user) {
          setUser({ ...user, profile_picture: data.profile_picture });
        }
      } else {
        setErrorMsg(data.error || "Failed to upload profile picture.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "A system error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch('/api/auth/remove-profile-picture', {
        method: 'POST',
      });

      if (res.ok) {
        setSuccessMsg("Profile picture deleted successfully!");
        if (user) {
          setUser({ ...user, profile_picture: undefined });
        }
      } else {
        setErrorMsg("Failed to delete profile picture.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "A system error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {errorMsg && (
        <div className="rounded-lg bg-red-500/10 p-3 text-red-400 border border-red-500/20">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg bg-green-500/10 p-3 text-green-400 border border-green-500/20">
          {successMsg}
        </div>
      )}

      <div className="flex flex-col items-center justify-center py-4">
        <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-0.5 shadow-lg shadow-primary/20 mb-4 overflow-hidden relative group">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-background overflow-hidden relative">
            {user?.profile_picture ? (
              <SafeImage src={`/api/uploads/${user.profile_picture}`} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-white uppercase">
                {user?.account_name ? user.account_name.charAt(0) : (user?.username ? user.username.charAt(0) : 'A')}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-3 w-full">
          <form onSubmit={handleUpload} className="flex-1 flex flex-col space-y-3">
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
                  {profilePicFile ? profilePicFile.name : "Choose Image File"}
                </span>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!profilePicFile || isUploading}
              className="w-full rounded-lg px-4 py-2 text-sm font-medium text-[#fff] shadow-lg bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:shadow-none transition-all duration-300 flex items-center justify-center"
            >
              {isUploading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <ImageIcon className="w-4 h-4 mr-2" />
              )}
              {isUploading ? "Uploading..." : "Upload Photo"}
            </button>
          </form>

          {user?.profile_picture && (
            <button
              onClick={handleRemove}
              disabled={isUploading}
              className="flex flex-col items-center justify-center px-4 py-2 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors shrink-0 disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium">Delete</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex justify-end pt-2 border-t border-border/50">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-secondary hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
