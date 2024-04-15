import {
  Outlet,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  defaultParseSearch,
} from "@tanstack/react-router";
import { MainScreen } from "../main/main-screen";
import { DetailsScreen } from "../details/details-screen";
import { SettingsScreen } from "../settings/settings-screen";

const validateSearch = (search: Record<string, unknown>) => ({
  tray: !!search.tray,
  isMainWindow: !!search.isMainWindow,
});

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  validateSearch,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: MainScreen,
  validateSearch,
});

export const historyDetailsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history/$id",
  component: DetailsScreen,
  validateSearch,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsScreen,
  validateSearch: (search: Record<string, unknown>) => ({
    ...validateSearch(search),
    settingsTab: search.settingsTab as string | undefined,
  }),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  historyDetailsRoute,
  settingsRoute,
]);

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  parseSearch: () => defaultParseSearch(window.location.search),
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
