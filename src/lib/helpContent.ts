// src/lib/helpContent.ts
// ─────────────────────────────────────────────────────────────────────────────
// Centralized content for the User Guide & Help Center.
// Used by both HelpCenterFAB (quick FAQs) and the /help page (full guide).
// ─────────────────────────────────────────────────────────────────────────────

import { FAQItem, TableColumn, PageGuide } from "./help/types";
import { FAQS } from "./help/faqs";
import { UI_CONVENTIONS } from "./help/conventions";
import { INFRASTRUCTURE_GUIDES } from "./help/guides/infrastructure";
import { AGENTS_GUIDES } from "./help/guides/agents";
import { TRAFFIC_CORE_GUIDES } from "./help/guides/traffic";
import { TRAFFIC_ANALYTICS_GUIDES } from "./help/guides/traffic-analytics";
import { SECURITY_GUIDES } from "./help/guides/security";
import { THREATS_GUIDES } from "./help/guides/threats";
import { LABELING_GUIDES } from "./help/guides/labeling";

export type { FAQItem, TableColumn, PageGuide };
export { FAQS, UI_CONVENTIONS };

export const PAGE_GUIDES: PageGuide[] = [
  ...INFRASTRUCTURE_GUIDES,
  ...AGENTS_GUIDES,
  ...TRAFFIC_CORE_GUIDES,
  ...TRAFFIC_ANALYTICS_GUIDES,
  ...SECURITY_GUIDES,
  ...THREATS_GUIDES,
  ...LABELING_GUIDES,
];

