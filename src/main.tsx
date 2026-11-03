import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../soccer baseboard";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
