/**
 * Único lugar con las consultas de turnos y clientes.
 * Respeta la tabla original: id, id_usuario, fecha y hora.
 * mysql2 devuelve [filas, metadatos]; la desestructuración toma las filas.
 */
import db from "../config/db.js";

/** Modelo de acceso a datos: sus métodos ejecutan SQL parametrizado. */
export default class Turno {
  async getTurnosReservados(fecha, conn = db) {
    const [filas] = await conn.query(
      "SELECT id, hora FROM turnos WHERE fecha=?",
      [fecha],
    );
    return filas;
  }

  async getAgenda(fecha, conn = db) {
    // JOIN relaciona cada turno con su cliente.
    // duracion_min es un alias calculado: NO es una columna nueva.
    const [filas] = await conn.query(
      `SELECT t.id, t.fecha, t.hora,
    (SELECT duracion_turno_min FROM configuracion ORDER BY id LIMIT 1) AS duracion_min,
    u.nombre_y_apellido, u.telefono
   FROM turnos t
   JOIN usuarios u ON u.id=t.id_usuario
   WHERE t.fecha=?
   ORDER BY t.hora`,
      [fecha],
    );
    return filas;
  }

  async getTurno(id, conn) {
    const [[turno]] = await conn.query("SELECT * FROM turnos WHERE id=?", [id]);
    return turno;
  }

  async crearUsuario(nombre, telefono, conn) {
    const [resultado] = await conn.query(
      "INSERT INTO usuarios (nombre_y_apellido, telefono) VALUES (?,?)",
      [nombre, telefono],
    );
    // MySQL genera el id; Agenda lo usa como clave foránea del turno.
    return resultado.insertId;
  }

  async crearTurno(idUsuario, fecha, hora, conn) {
    const [resultado] = await conn.query(
      "INSERT INTO turnos (id_usuario, fecha, hora) VALUES (?,?,?)",
      [idUsuario, fecha, hora],
    );
    return resultado.insertId;
  }

  async getClienteConUso(idUsuario, conn) {
    const [[cliente]] = await conn.query(
      "SELECT nombre_y_apellido, telefono FROM usuarios WHERE id=?",
      [idUsuario],
    );
    const [[uso]] = await conn.query(
      "SELECT COUNT(*) total FROM turnos WHERE id_usuario=?",
      [idUsuario],
    );
    return { cliente, cantidadTurnos: uso.total };
  }

  async actualizarUsuario(id, nombre, telefono, conn) {
    await conn.query(
      "UPDATE usuarios SET nombre_y_apellido=?, telefono=? WHERE id=?",
      [nombre, telefono, id],
    );
  }

  async actualizarTurno(id, fecha, hora, idUsuario, conn) {
    await conn.query(
      "UPDATE turnos SET fecha=?, hora=?, id_usuario=? WHERE id=?",
      [fecha, hora, idUsuario, id],
    );
  }

  async getReservasDesde(fecha, conn) {
    const [filas] = await conn.query(
      "SELECT fecha, hora FROM turnos WHERE fecha>=?",
      [fecha],
    );
    return filas;
  }

  async eliminarTurno(id, conn) {
    // Se borra únicamente el turno. El registro del cliente se conserva.
    await conn.query("DELETE FROM turnos WHERE id=?", [id]);
  }
}
