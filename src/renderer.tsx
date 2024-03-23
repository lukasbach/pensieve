import ReactDOM from "react-dom/client";
import "./index.css";
import { Recorder } from "./renderer/components/poc/recorder";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <div>
    <Recorder />
  </div>,
);
