/** Asocia cada método y URL con una acción del controlador. */
import TurnoController from "../controllers/turnos.controller.js";
import { Router } from "express";

const router = Router();
const controlador = new TurnoController();
// La función flecha conserva el objeto: dentro del método, this es controlador.
// La consulta de agenda y la de horas disponibles son operaciones diferentes.
router.get("/turnos", (req, res) => controlador.listarTurnos(req, res));
router.get("/disponibilidad", (req, res) =>
  controlador.listarDisponibilidad(req, res),
);
router.post("/turnos", (req, res) => controlador.crearReserva(req, res));
router.put("/turnos/:id", (req, res) => controlador.editarReserva(req, res));
router.delete("/turnos/:id", (req, res) => controlador.borrarReserva(req, res));
export default router;
