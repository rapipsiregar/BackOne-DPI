"use client";

import { useState, useEffect } from "react";
import { Tabs, Tab } from "@/components/ui/Tabs";
import { ApplicationCatalog } from "@/components/lookup/ApplicationCatalog";
import { BlacklistConfiguration } from "@/components/lookup/BlacklistConfiguration";
import { HelpTrigger } from "@/components/help/HelpTrigger";

import { getSiteBranding } from "@/lib/branding";

export default function LookupPage() {
  const [mounted, setMounted] = useState(false);
  const branding = getSiteBranding();

  useEffect(() => {
    setMounted(true);
    document.title = `App Lookup | ${branding.name} - Deep Package Inspection`;
  }, [branding.name]);

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4 w-full">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight truncate">
              App Lookup
            </h1>
            {/* Mobile Actions: Inline next to Title */}
            <div className="flex items-center gap-1.5 flex-shrink-0 sm:hidden">
              <HelpTrigger pageId="lookup" />
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-normal sm:leading-relaxed">
            Search {branding.name === "BackOne" ? "BackOne's" : `${branding.name}'s`} extensive classification database of over 2,500+ apps, protocols, and services, and manage your blacklist configuration.
          </p>
        </div>

        {/* Laptop/Tablet Actions: Floats on the right */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <HelpTrigger pageId="lookup" />
        </div>
      </div>

      <Tabs>
        <Tab label="App Catalog">
          <ApplicationCatalog />
        </Tab>
        <Tab label="Blacklist Configuration">
          <BlacklistConfiguration />
        </Tab>
      </Tabs>
    </div>
  );
}
