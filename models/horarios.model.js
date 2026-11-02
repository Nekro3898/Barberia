/**
 * Consultas de los horarios semanales existentes.
 * No crea días ni cambia la estructura de la tabla.
 */
import db from "../config/db.js";

/** Modelo de acceso a datos: sus métodos ejecutan SQL parametrizado. */
export default class Horario {
  async getHorarios(conn = db) {
    const [horarios] = await conn.query(
      "SELECT dia_semana, trabaja, hora_apertura, hora_cierre, pausa_inicio, pausa_fin FROM horarios ORDER BY dia_semana",
    );
    return horarios;
  }

  async actualizarHorarios(horarios, conn) {
    // Todas las filas se actualizan en la misma transacción que la configuración.
    for (const horario of horarios) {
      await conn.query(
        "UPDATE horarios SET trabaja=?, hora_apertura=?, hora_cierre=?, pausa_inicio=?, pausa_fin=? WHERE dia_semana=?",
        [
          horario.trabaja,
          horario.hora_apertura,
          horario.hora_cierre,
          horario.pausa_inicio,
          horario.pausa_fin,
          horario.dia_semana,
        ],
      );
    }
  }
}
