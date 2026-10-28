import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { StoreProvider } from "./store";
import { ToastProvider } from "./components/Toast";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </ToastProvider>
  </StrictMode>,
);
