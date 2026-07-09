import { createRoute } from "@tanstack/react-router";

import { CandidatesScreen } from "@/components/CandidatesScreen";
import { rootRoute } from "@/routes/__root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: CandidatesScreen,
});
