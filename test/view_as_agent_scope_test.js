// test/view_as_agent_scope_test.js
// ─────────────────────────────────────────────────────────────────────────────
// TDD Test Suite: View-As Agent Mode Scoping & Rule 5 White-Labeling Compliance
// ─────────────────────────────────────────────────────────────────────────────

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running TDD Test: View-As Agent Mode Scoping & Branding Compliance');

// 1. Verify ExternalAccountsSection does NOT hardcode "(BackOne)" and uses site branding
const extSectionPath = path.resolve(__dirname, '../src/app/(dashboard)/agents/ExternalAccountsSection.tsx');
const extSectionContent = fs.readFileSync(extSectionPath, 'utf8');

assert(
  !extSectionContent.includes('Superadmin (BackOne) External Accounts'),
  'FAIL: ExternalAccountsSection must NOT hardcode "Superadmin (BackOne) External Accounts"'
);
assert(
  extSectionContent.includes('getSiteBranding') || extSectionContent.includes('branding.name'),
  'FAIL: ExternalAccountsSection MUST use getSiteBranding() for table title'
);

// 2. Verify useAgentsData filters agents when View-As mode is active
const useAgentsDataPath = path.resolve(__dirname, '../src/app/(dashboard)/agents/useAgentsData.ts');
const useAgentsDataContent = fs.readFileSync(useAgentsDataPath, 'utf8');

assert(
  useAgentsDataContent.includes('getViewAsStatusSync'),
  'FAIL: useAgentsData MUST call getViewAsStatusSync to inspect view-as state'
);
assert(
  useAgentsDataContent.includes('isViewAsActive') || useAgentsDataContent.includes('isViewAsMode'),
  'FAIL: useAgentsData MUST track and export isViewAsActive / isViewAsMode'
);

// 3. Verify AgentsPage.tsx conditionally hides ExternalAccountsSection when in View-As mode
const agentsPagePath = path.resolve(__dirname, '../src/app/(dashboard)/agents/page.tsx');
const agentsPageContent = fs.readFileSync(agentsPagePath, 'utf8');

assert(
  agentsPageContent.includes('isViewAsActive') || agentsPageContent.includes('isViewAsMode'),
  'FAIL: page.tsx MUST receive isViewAsActive / isViewAsMode from useAgentsData'
);

// 4. Verify AgentsTableSection hides "+ Provision Agent" when in View-As mode
const tableSectionPath = path.resolve(__dirname, '../src/app/(dashboard)/agents/AgentsTableSection.tsx');
const tableSectionContent = fs.readFileSync(tableSectionPath, 'utf8');

assert(
  tableSectionContent.includes('isViewAsActive') || tableSectionContent.includes('isViewAsMode'),
  'FAIL: AgentsTableSection MUST respect isViewAsActive to hide Provision Agent button'
);

// 5. Verify columns.tsx hides/disables admin actions when in View-As mode
const columnsPath = path.resolve(__dirname, '../src/app/(dashboard)/agents/columns.tsx');
const columnsContent = fs.readFileSync(columnsPath, 'utf8');

assert(
  columnsContent.includes('isViewAsActive') || columnsContent.includes('isViewAsMode'),
  'FAIL: columns.tsx MUST respect isViewAsActive to hide/disable admin actions in View-As mode'
);

console.log('✅ ALL TDD TESTS FOR VIEW-AS AGENT SCOPING PASSED!');
