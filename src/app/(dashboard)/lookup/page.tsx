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
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            App Lookup
          </h1>
          <div className="shrink-0">
            <HelpTrigger pageId="lookup" />
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          Search {branding.name === "BackOne" ? "BackOne's" : `${branding.name}'s`} extensive classification database of over 2,500+ apps, protocols, and services, and manage your blacklist configuration.
        </p>
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
