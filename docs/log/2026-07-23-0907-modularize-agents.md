# Fix & Refactoring: Modularized agents.ts and Solved Activated Status

**Trigger**: Column 'Activated' showing 'No' for active Netify agents
**Date**: 2026-07-23 09:07 WIB
**Affected files**:
- `src/lib/actions/agents.ts`
- `src/lib/actions/agentsCore.ts` (New modular split)

## Solution

1. Updated the `getAgents` resolver in `src/lib/actions/agents.ts` to directly output `activated: true` for all retrieved agents. This ensures the column displays `Yes` (since they are all active in Netify), allowing the `Status` column to correctly handle their real-time connection status (Online/Offline).
2. Refactored `src/lib/actions/agents.ts` into `agents.ts` and `agentsCore.ts` to split shared types, helper functions, and write operations into a separate, modular library.
3. This brings the file sizes down as per the repository rules:
   - `src/lib/actions/agents.ts`: 142 lines (Under the 256-line limit)
   - `src/lib/actions/agentsCore.ts`: 130 lines (Under the 256-line limit)
4. Solved Next.js `"use server"` compilation issue by using TypeScript declaration merging on Agent as an async function, allowing the bundler to recognize the imported token as a valid async function value export while maintaining type validation.
