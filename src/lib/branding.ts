// src/lib/branding.ts
export interface Branding {
  name: string;
  logo: string;
  title: string;
  copyright: string;
  primaryColor: string;
}

export function getSiteBranding(selectedSiteUuid?: string): Branding {
  if (typeof window !== "undefined") {
    const siteUuid = selectedSiteUuid || localStorage.getItem('backone_site_uuid');

    // Source 2 — SIAB site UUID
    const isSiab = siteUuid === '6681452d_9cae_4ff4_8ae8_0d504774265e';

    // Source 2 — Office site UUID (same branding as SIAB)
    const isOffice = siteUuid === '1959bb55_045b_47c7_bbdd_f33b7db197b9';

    // Source 1 — Nexus site UUID (kept for backward compat, should not appear in Source 2)
    const isNexus = !isSiab && !isOffice && (
                    siteUuid === 'd7902405_0dc2_458b_8584_ed4d24b64f24' ||
                    window.location.search.includes("nexus")
    );

    if (isNexus) {
      return {
        name: "Nexus",
        logo: "/nexus-logo.png",
        title: "Nexus Dashboard",
        copyright: "PT. Nexus Solusi",
        primaryColor: "#8B5CF6"
      };
    }

    if (isSiab || isOffice) {
      return {
        name: "BackOne",
        logo: "/backone-logo.png",
        title: "BackOne Dashboard",
        copyright: "PT. Data Bisnis Solusi",
        primaryColor: "#E11D48"
      };
    }
  }
  return {
    name: "BackOne",
    logo: "/backone-logo.png",
    title: "BackOne Dashboard",
    copyright: "PT. Data Bisnis Solusi",
    primaryColor: "#E11D48"
  };
}
