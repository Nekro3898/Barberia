/** Punto de entrada del navegador: monta React en el div root del HTML. */
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
// StrictMode añade comprobaciones de desarrollo; no duplica reservas al hacer clic.
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
