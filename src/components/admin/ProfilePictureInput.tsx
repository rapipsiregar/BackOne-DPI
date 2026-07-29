"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";

interface ProfilePictureInputProps {
  previewPic: string | null;
  onChange: (file: File) => void;
}

export default function ProfilePictureInput({
  previewPic,
  onChange,
}: ProfilePictureInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-16 h-16 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-amber-500 transition-colors overflow-hidden bg-slate-800"
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
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
