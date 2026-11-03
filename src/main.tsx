import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../blitz league";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
