import ReactDOM from "react-dom/client";
import "./index.css";
import { Theme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Recorder } from "./renderer/recorder/recorder";
import { History } from "./renderer/history/history";

import "@radix-ui/themes/styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <QueryClientProvider client={new QueryClient()}>
    <Theme>
      <Recorder />
      <History />
    </Theme>
  </QueryClientProvider>,
);
