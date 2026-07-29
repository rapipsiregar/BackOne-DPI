"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ThreatsContent from "@/components/threats/ThreatsContent";

export default function ThreatsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ThreatsContent />
    </Suspense>
  );
}
