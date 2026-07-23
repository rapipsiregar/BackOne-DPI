"use client";

import React, { useState, useEffect } from "react";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackName?: string;
}

export function SafeImage({ src, fallbackName, ...props }: SafeImageProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!src || src.endsWith("/undefined") || src.endsWith("/null")) {
      setError(true);
      return;
    }

    let active = true;
    let objectUrl = "";

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load image");
        return res.blob();
      })
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
        setError(false);
      })
      .catch((err) => {
        console.warn("Failed to load profile image gracefully:", err.message);
        if (active) setError(true);
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (error || !imageSrc) {
    const initials = fallbackName 
      ? fallbackName.substring(0, 2).toUpperCase() 
      : "Profile";
    return (
      <div 
        className={props.className} 
        style={{ 
          backgroundColor: "rgba(30, 41, 59, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          {initials}
        </span>
      </div>
    );
  }

  return <img src={imageSrc} {...props} />;
}
