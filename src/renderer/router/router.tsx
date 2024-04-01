import {
  Outlet,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { MainScreen } from "../main/main-screen";
import { DetailsScreen } from "../details/details-screen";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: MainScreen,
});

export const historyDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history/$id",
  component: DetailsScreen,
});

const routeTree = rootRoute.addChildren([indexRoute, historyDetailsRoute]);

export const router = createRouter({ routeTree, history: createHashHistory() });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
