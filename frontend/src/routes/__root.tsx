import { createRootRoute } from "@tanstack/react-router";

import { AppShell } from "@/routes/-components";

// Root layout route: the ATS shell (header + responsive sidebar); child
// routes render into its <Outlet /> (PLAN.md section 3.3 — deliberately
// minimal route tree, ready for a future /candidates/:id without inventing
// navigation today).
export const rootRoute = createRootRoute({
  component: AppShell,
});
