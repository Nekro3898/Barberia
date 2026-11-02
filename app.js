/**
 * Entrada del backend: configura Express, monta rutas y sirve React compilado.
 * Se exporta app para probarla sin abrir el puerto normal.
 */
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import db from "./config/db.js";
import turnosRoutes from "./routes/turnos.routes.js";
import configuracionRoutes from "./routes/configuracion.routes.js";

export const app = express();
app.disable("x-powered-by"); // No publica la tecnología del servidor en las cabeceras.

app.use((req, res, next) => {
  // Estas cabeceras evitan interpretar archivos como otro tipo y enmarcar la app.
  res.set({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Frame-Options": "DENY",
  });
  if (req.path.startsWith("/api")) res.set("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    // Sin sesión por decisión del proyecto, pero una web de otro origen
    // no debe poder enviar cambios desde el navegador del barbero.
    const origin = req.headers.origin;
    if (origin) {
      let host;
      try {
        host = new URL(origin).host;
      } catch {
        return res.status(403).json({ message: "Origen no permitido." });
      }
      if (host !== req.headers.host)
        return res.status(403).json({ message: "Origen no permitido." });
    }
    if (
      req.headers["content-type"]?.split(";")[0].trim() !== "application/json"
    ) {
      return res.status(415).json({ message: "Enviá JSON." });
    }
  }
  next(); // Continúa al siguiente middleware solo si la petición es aceptable.
});

app.use(express.json({ limit: "16kb" })); // Convierte el JSON recibido a req.body.
app.get("/api/health", async (req, res) => {
  await db.query("SELECT 1"); // Comprueba la conexión sin modificar registros.
  res.json({ ok: true });
});
app.use("/api", configuracionRoutes, turnosRoutes);
app.use("/api", (req, res) =>
  res.status(404).json({ message: "La ruta no existe." }),
);

// Vite genera dist. En producción Express entrega HTML, CSS y JS desde aquí.
const dist = fileURLToPath(new URL("./frontend/dist/", import.meta.url));
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("/{*path}", (req, res) =>
    res.sendFile(path.join(dist, "index.html")),
  );
} else {
  app.get("/", (req, res) =>
    res
      .type("text")
      .send(
        "Backend listo. Iniciá Vite con npm run frontend o compilá con npm run build.",
      ),
  );
}

// Un único manejador mantiene el formato { message } en todos los errores.
app.use((error, req, res, next) => {
  if (error.status) {
    return res.status(error.status).json({
      message:
        error.type === "entity.parse.failed"
          ? "El JSON no es válido."
          : error.message,
    });
  }
  if (error.code === "ER_DUP_ENTRY") {
    return res
      .status(409)
      .json({ message: "Ese horario acaba de reservarse. Elegí otro." });
  }
  console.error("Error del servidor:", error.code || error.name);
  res
    .status(500)
    .json({
      message:
        "No pudimos completar la operación. Revisá la conexión con MySQL e intentá nuevamente.",
    });
});

// Solo escucha cuando se ejecuta node app.js, no cuando una prueba importa app.
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const puerto = Number(process.env.PORT || 3001);
  const server = app.listen(puerto, process.env.HOST || "0.0.0.0", () =>
    console.log("Barbería disponible en http://localhost:" + puerto),
  );
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () =>
      server.close(async () => {
        await db.end(); // Termina las conexiones MySQL antes de cerrar Node.
        process.exit(0);
      }),
    );
  }
}
