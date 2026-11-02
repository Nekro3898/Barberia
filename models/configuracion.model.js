/**
 * Acceso a la configuración del negocio.
 * La primera fila es la configuración activa; su id no tiene que ser 1.
 * conn puede ser el pool normal o la conexión de una transacción.
 */
import db from "../config/db.js";

/** Modelo de acceso a datos: sus métodos ejecutan SQL parametrizado. */
export default class Configuracion {
  async getConfiguracion(conn = db) {
    const [[configuracion]] = await conn.query(
      "SELECT nombre_negocio, duracion_turno_min FROM configuracion ORDER BY id LIMIT 1",
    );
    return configuracion;
  }

  async actualizarConfiguracion(configuracion, conn) {
    // Los signos ? separan los datos del texto SQL.
    await conn.query(
      "UPDATE configuracion SET nombre_negocio=?, duracion_turno_min=? ORDER BY id LIMIT 1",
      [configuracion.nombre_negocio, configuracion.duracion_turno_min],
    );
  }
}
