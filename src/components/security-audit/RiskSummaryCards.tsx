// src/components/security-audit/RiskSummaryCards.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ShieldX, ShieldAlert, ShieldCheck } from "lucide-react";

interface Props {
  vulnerableCount: number;
  moderateCount: number;
  safeCount: number;
}

export default function RiskSummaryCards({ vulnerableCount, moderateCount, safeCount }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-red-950/20 border-red-500/20 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-300">Vulnerable</CardTitle>
          <ShieldX className="h-4 w-4 text-red-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-400">{vulnerableCount}</div>
          <p className="text-xs text-red-300/60 mt-1">device{vulnerableCount !== 1 ? "s" : ""} at risk</p>
        </CardContent>
      </Card>
      <Card className="bg-orange-950/20 border-orange-500/20 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-300">Moderate</CardTitle>
          <ShieldAlert className="h-4 w-4 text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-400">{moderateCount}</div>
          <p className="text-xs text-orange-300/60 mt-1">device{moderateCount !== 1 ? "s" : ""} moderate risk</p>
        </CardContent>
      </Card>
      <Card className="bg-green-950/20 border-green-500/20 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-300">Safe (Secure)</CardTitle>
          <ShieldCheck className="h-4 w-4 text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-400">{safeCount}</div>
          <p className="text-xs text-green-300/60 mt-1">device{safeCount !== 1 ? "s" : ""} secure</p>
        </CardContent>
      </Card>
    </div>
  );
}
