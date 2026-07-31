"use client";

import React, { useState, useEffect, memo } from "react";

// Memory cache to prevent duplicate fetches for the same IP across component re-renders
const geoIpCache: Record<string, { isp: string; country: string; as_org: string }> = {};

function isPrivateIp(ip: string): boolean {
  if (!ip) return false;
  return (
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("127.") ||
    ip === "0.0.0.0" ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
  );
}

const LOCAL_RESOLVED = {
  isp: "Local Network",
  country: "Local",
  as_org: "Local Area Network"
};

export const IpDetails = memo(function IpDetails({ ip }: { ip: string }) {
  const [details, setDetails] = useState<{ isp: string; country: string; as_org: string } | null>(() => {
    if (!ip) return null;
    if (isPrivateIp(ip)) return LOCAL_RESOLVED;
    if (geoIpCache[ip]) return geoIpCache[ip];
    return null;
  });

  useEffect(() => {
    if (!ip) return;
    if (isPrivateIp(ip)) {
      setDetails(LOCAL_RESOLVED);
      return;
    }

    if (geoIpCache[ip]) {
      setDetails(geoIpCache[ip]);
      return;
    }

    let isMounted = true;

    fetch(`/api/auth/geoip?ip=${encodeURIComponent(ip)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const resolved = {
          isp: data.isp || "Unknown ISP",
          country: data.country || "Remote",
          as_org: data.as_org || "Public Network",
        };
        geoIpCache[ip] = resolved;
        setDetails(resolved);
      })
      .catch((err) => {
        console.warn("GeoIP lookup client error:", err);
        if (isMounted) {
          const fallback = {
            isp: "Public IP",
            country: "Remote",
            as_org: "Public Network",
          };
          geoIpCache[ip] = fallback;
          setDetails(fallback);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [ip]);

  if (!details) {
    return <span className="text-[10px] text-slate-500 animate-pulse">loading...</span>;
  }

  const isLocal = details.country === "Local";

  return (
    <div
      className="text-[10px] leading-tight mt-0.5 max-w-[180px] truncate"
      title={`${details.isp}${!isLocal ? ` • ${details.country}` : ""}`}
    >
      <span className={isLocal ? "text-emerald-500/90 font-medium" : "text-cyan-400/90 font-medium"}>
        {details.isp}
      </span>
      {!isLocal && (
        <span className="text-slate-400 font-normal">
          {" • "}{details.country}
        </span>
      )}
    </div>
  );
});
