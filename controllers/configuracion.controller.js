/** Controladores de lectura y actualización del negocio y sus horarios. */
import Agenda from "../models/Agenda.js";

export default class ConfiguracionController {
  constructor(agenda = new Agenda()) {
    // El controlador conserva el modelo que utiliza en sus acciones.
    this.agenda = agenda;
  }

  async leerConfiguracion(req, res) {
    res.json(await this.agenda.obtenerAjustes());
  }

  async editarConfiguracion(req, res) {
    res.json(await this.agenda.guardarAjustes(req.body || {}));
  }
}
