/**
 * Controlador MVC: recibe HTTP y utiliza el objeto Agenda. No ejecuta SQL.
 * Express 5 envía los rechazos de funciones async al manejador de errores.
 */
import db from "../config/db.js";
import { exigir } from "../models/reglas.js";
import Agenda from "../models/Agenda.js";

function leerId(valor) {
  const id = Number(valor);
  exigir(
    /^\d+$/.test(valor) && Number.isSafeInteger(id) && id > 0,
    "Identificador inválido.",
  );
  return id;
}

export default class TurnoController {
  constructor(agenda = new Agenda()) {
    // El controlador conserva el modelo que utiliza en sus acciones.
    this.agenda = agenda;
  }

  async listarTurnos(req, res) {
    res.json(await this.agenda.obtenerAgenda(req.query.fecha));
  }

  async listarDisponibilidad(req, res) {
    const excluir = req.query.excluir ? leerId(req.query.excluir) : null;
    res.json(
      await this.agenda.obtenerTurnosDelDia(req.query.fecha, db, excluir),
    );
  }

  async crearReserva(req, res) {
    // 201 significa que se creó un recurso, no solamente que se leyó.
    res.status(201).json(await this.agenda.reservarTurno(req.body || {}));
  }

  async editarReserva(req, res) {
    res.json(
      await this.agenda.modificarTurno(leerId(req.params.id), req.body || {}),
    );
  }

  async borrarReserva(req, res) {
    res.json(await this.agenda.cancelarTurno(leerId(req.params.id)));
  }
}
