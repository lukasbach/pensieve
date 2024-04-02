import ReactDOM from "react-dom/client";
import "./index.css";
import { Theme } from "@radix-ui/themes";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./renderer/router/router";

import "@radix-ui/themes/styles.css";
import { FC, PropsWithChildren } from "react";
import { QueryKeys } from "./query-keys";
import { mainApi } from "./renderer/api";

const queryClient = new QueryClient();
(window as any).ipcApi.onInvalidateUiKeys((keys: string[]) => {
  console.log("Update", keys);
  queryClient.invalidateQueries({ queryKey: keys });
});

const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const { data: dark } = useQuery({
    queryKey: [QueryKeys.Theme],
    queryFn: async () => (await mainApi.getSettings()).ui.dark,
  });
  return <Theme appearance={dark ? "dark" : "light"}>{children}</Theme>;
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </QueryClientProvider>,
);
