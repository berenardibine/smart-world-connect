import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { HelmetProvider } from "react-helmet-async";

const helmetContext = {};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
      <HelmetProvider context={helmetContext}>
            <App />
                </HelmetProvider>
                  </React.StrictMode>
                  );
createRoot(document.getElementById("root")!).render(<App />);
