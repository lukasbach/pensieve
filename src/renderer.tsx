import ReactDOM from "react-dom/client";
import "./index.css";
import { Theme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./renderer/router/router";

import "@radix-ui/themes/styles.css";

const queryClient = new QueryClient();
(window as any).ipcApi.onInvalidateUiKeys((keys: string[]) => {
  console.log("Update", keys);
  queryClient.invalidateQueries({ queryKey: keys });
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <QueryClientProvider client={queryClient}>
    <Theme appearance="dark">
      <RouterProvider router={router} />
    </Theme>
  </QueryClientProvider>,
);
