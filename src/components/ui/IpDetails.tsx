"use client";

import { useState, useEffect } from "react";

// Client-side cache to prevent duplicate fetches for the same IP
const geoIpCache: Record<string, { isp: string; country: string; as_org: string }> = {};

export function IpDetails({ ip }: { ip: string }) {
  const [details, setDetails] = useState<{ isp: string; country: string; as_org: string } | null>(null);

  useEffect(() => {
    if (!ip) return;

    // Check memory cache first
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
          setDetails({
            isp: "Public IP",
            country: "Remote",
            as_org: "Public Network",
          });
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
    <div className="text-[10px] leading-tight mt-0.5 max-w-[180px] truncate">
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
}
