import ReactDOM from "react-dom/client";
import "./index.css";
import { Theme } from "@radix-ui/themes";
import { Recorder } from "./renderer/recorder/recorder";

import "@radix-ui/themes/styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <Theme>
    <Recorder />
  </Theme>,
);
