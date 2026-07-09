import { createRoute } from "@tanstack/react-router";

import { ChatWindow } from "@/components/ChatWindow";
import { rootRoute } from "@/routes/__root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ChatWindow,
});
