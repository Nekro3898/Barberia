/** Rutas de ajustes: los horarios viajan dentro de la configuración. */
import ConfiguracionController from "../controllers/configuracion.controller.js";
import { Router } from "express";

const router = Router();
const controlador = new ConfiguracionController();
// La función flecha conserva el objeto: dentro del método, this es controlador.
router.get("/configuracion", (req, res) =>
  controlador.leerConfiguracion(req, res),
);
router.put("/configuracion", (req, res) =>
  controlador.editarConfiguracion(req, res),
);
export default router;
