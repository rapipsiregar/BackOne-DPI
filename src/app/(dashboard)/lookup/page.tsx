"use client";

import { useState, useEffect } from "react";
import { Tabs, Tab } from "@/components/ui/Tabs";
import { HelpTrigger } from "@/components/help/HelpTrigger";
import { ApplicationCatalog } from "@/components/lookup/ApplicationCatalog";
import { BlacklistConfiguration } from "@/components/lookup/BlacklistConfiguration";

export default function LookupPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Application Database
          </h1>
          <p className="text-slate-400 mt-2">
            Search application lookup catalog and configure traffic blacklist policy rules.
          </p>
        </div>
        <HelpTrigger pageId="lookup" />
      </div>

      {/* Tabs Container */}
      <Tabs>
        <Tab label="Application Catalog">
          <ApplicationCatalog />
        </Tab>
        <Tab label="Blacklist Configuration">
          <BlacklistConfiguration />
        </Tab>
      </Tabs>
    </div>
  );
}
