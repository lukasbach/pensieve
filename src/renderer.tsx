import "@radix-ui/themes/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import log from "electron-log/renderer";
import ReactDOM from "react-dom/client";
import "./index.css";
import { DialogProvider } from "./renderer/dialog/dialog-provider";
import { router } from "./renderer/router/router";
import { ThemeProvider } from "./theme-provider";

const queryClient = new QueryClient();

(window as any).ipcApi.onInvalidateUiKeys((keys: string[]) => {
  log.info("UI Update", keys);
  queryClient.invalidateQueries({ queryKey: keys });
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <DialogProvider>
        <RouterProvider router={router} />
      </DialogProvider>
    </ThemeProvider>
  </QueryClientProvider>,
);
