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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            App Lookup
          </h1>
          <p className="text-slate-400 mt-2">
            Search {branding.name === "BackOne" ? "BackOne's" : `${branding.name}'s`} extensive classification database of over 2,500+ apps, protocols, and services, and manage your blacklist configuration.
          </p>
        </div>
        <HelpTrigger pageId="lookup" />
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
