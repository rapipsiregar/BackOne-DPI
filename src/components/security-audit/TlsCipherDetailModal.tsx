"use client";

import { useState } from "react";
import { TlsCipherStat } from "@/lib/api";
import { fmtBytes } from "@/lib/utils";
import { X, ShieldAlert, ShieldCheck, Shield, Lock, Activity, Download, Upload } from "lucide-react";

interface Props {
  cipher: TlsCipherStat;
  onClose: () => void;
}

export function TlsCipherDetailModal({ cipher, onClose }: Props) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => { onClose(); }, 480);
  };

  const status = cipher.security_status || 'Unknown';
  
  let Icon = Shield;
  let bgGradient = "from-slate-900/50 to-slate-800/30";
  let textColor = "text-slate-400";
  let badgeColor = "bg-slate-500/10 text-slate-400 border-slate-500/20";
  let recommendation = "No specific recommendation available.";

  if (status === 'Secure') {
    Icon = ShieldCheck;
    bgGradient = "from-emerald-900/30 to-green-900/20";
    textColor = "text-emerald-400";
    badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    recommendation = "This cipher suite provides strong modern encryption. It is recommended to keep this enabled for secure communications.";
  } else if (status === 'Weak') {
    Icon = ShieldAlert;
    bgGradient = "from-amber-900/30 to-orange-900/20";
    textColor = "text-amber-400";
    badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    recommendation = "This cipher suite uses legacy algorithms that may be vulnerable to theoretical attacks. Consider deprecating its use if compatibility allows.";
  } else if (status === 'Vulnerable') {
    Icon = ShieldAlert;
    bgGradient = "from-red-900/30 to-rose-900/20";
    textColor = "text-red-400";
    badgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
    recommendation = "CRITICAL: This cipher suite uses obsolete and highly insecure algorithms (e.g., NULL, RC4, DES, MD5). It must be disabled immediately across all infrastructure to prevent data breaches.";
  }

  // Parse cipher suite parts roughly
  const parts = cipher.tls_cipher.split('_');
  const isTls = parts[0] === 'TLS';
  const keyExchange = isTls && parts.length > 2 ? parts[1] : 'Unknown';
  let encryption = 'Unknown';
  let mac = 'Unknown';
  
  if (cipher.tls_cipher.includes('WITH')) {
    const withSplit = cipher.tls_cipher.split('_WITH_');
    if (withSplit.length > 1) {
      const rest = withSplit[1].split('_');
      if (rest.length > 2) {
        mac = rest.pop() || 'Unknown';
        encryption = rest.join('_');
      } else {
        encryption = rest[0];
        mac = rest[1] || 'Unknown';
      }
    }
  } else if (isTls) {
    if (parts.length >= 5) { // e.g. TLS_AES_256_GCM_SHA384
      encryption = parts[1] + '_' + parts[2] + '_' + parts[3];
      mac = parts[4];
    }
  }

  return (
    <>
      <div className="fixed top-0 left-0 w-screen h-[100dvh] z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={handleClose}>
        <div className={"fixed top-0 left-0 w-screen h-[100dvh] bg-black/40 dark:bg-black/75 backdrop-blur-sm " + (isClosing ? 'animate-overlay-out' : 'animate-overlay-in')} />
        
        <div
          className={"relative bg-card border border-border rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl shadow-black/60 my-auto " + (isClosing ? 'animate-modal-out' : 'animate-modal-in')}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={"flex items-center justify-between px-6 py-5 border-b border-border bg-gradient-to-r rounded-t-2xl " + bgGradient}>
            <div className="flex flex-col gap-1.5 min-w-0 pr-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-black/20 ring-1 ring-white/10">
                  <Icon className={"w-5 h-5 " + textColor} />
                </div>
                <h3 className="text-lg font-semibold text-white truncate max-w-[400px] font-mono tracking-tight" title={cipher.tls_cipher}>
                  {cipher.tls_cipher}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={"px-2 py-0.5 text-xs font-medium rounded-full border uppercase tracking-wider " + badgeColor}>
                  {status}
                </span>
                <span className="text-xs text-slate-400">Cipher Intelligence</span>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors flex-shrink-0 focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20">
            
            {/* Description Card */}
            <div className="bg-secondary/20 border border-border/50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-purple-400" />
                Security Assessment
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                {cipher.description || 'No detailed assessment available.'}
              </p>
              <div className="mt-3 p-3 bg-black/30 rounded-lg border border-white/5">
                <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">Recommendation</h5>
                <p className={"text-sm " + textColor}>{recommendation}</p>
              </div>
            </div>

            {/* Algorithm Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-secondary/20 border border-border/50 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                <Lock className="w-5 h-5 text-blue-400 mb-2" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Key Exchange</span>
                <span className="text-sm font-semibold text-white mt-1 font-mono">{keyExchange}</span>
              </div>
              <div className="bg-secondary/20 border border-border/50 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                <Shield className="w-5 h-5 text-amber-400 mb-2" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Encryption</span>
                <span className="text-sm font-semibold text-white mt-1 font-mono">{encryption}</span>
              </div>
              <div className="bg-secondary/20 border border-border/50 rounded-xl p-4 flex flex-col justify-center items-center text-center">
                <Activity className="w-5 h-5 text-emerald-400 mb-2" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">Hashing (Auth)</span>
                <span className="text-sm font-semibold text-white mt-1 font-mono">{mac}</span>
              </div>
            </div>

            {/* Traffic Volume */}
            <div className="bg-secondary/20 border border-border/50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-white mb-4">Network Traffic Volume</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5"><Download className="w-3.5 h-3.5 text-blue-400"/> Download</span>
                  <span className="text-base font-semibold text-blue-400">{fmtBytes(cipher.download)}</span>
                </div>
                <div className="flex flex-col gap-1 border-l border-white/10 pl-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5"><Upload className="w-3.5 h-3.5 text-green-400"/> Upload</span>
                  <span className="text-base font-semibold text-green-400">{fmtBytes(cipher.upload)}</span>
                </div>
                <div className="flex flex-col gap-1 border-l border-white/10 pl-4">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-purple-400"/> Total</span>
                  <span className="text-base font-semibold text-white">{fmtBytes(cipher.total)}</span>
                </div>
              </div>
            </div>

            {/* Devices Limitation Note */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-300/80 italic">
                Device-level mapping for cipher suites is currently not collected by the proxy layer. 
                Data shown above reflects aggregated network-wide telemetry.
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
