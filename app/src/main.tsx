import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AccessGate } from "./state/AccessGate.tsx";
import { registerServiceWorker } from "./pwa";
import "./gate.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AccessGate>
      <App />
    </AccessGate>
  </StrictMode>
);

registerServiceWorker();
