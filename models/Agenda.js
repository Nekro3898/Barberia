/** Modelo de negocio de MVC: administra la agenda sin conocer HTTP ni React. */
import db from "../config/db.js";
import Turno from "./turnos.models.js";
import Configuracion from "./configuracion.model.js";
import Horario from "./horarios.model.js";
import {
  exigir,
  validarVentana,
  validarFecha,
  horaValida,
  generarTurnos,
  horaAMinutos,
  validarAjustes,
  fechaLocal,
  validarCliente,
} from "./reglas.js";

/** Composición: Agenda utiliza otros objetos, sin herencias artificiales. */
export default class Agenda {
  constructor() {
    this.turnos = new Turno();
    this.configuracion = new Configuracion();
    this.horarios = new Horario();
  }

  async obtenerAjustes(conn = db) {
    const configuracion = await this.configuracion.getConfiguracion(conn);
    exigir(
      configuracion,
      "Falta la configuración del negocio en la base seleccionada.",
      503,
    );
    const horarios = await this.horarios.getHorarios(conn);
    // MySQL usa 0/1 y HH:mm:ss. La interfaz necesita booleanos y HH:mm.
    return {
      ...configuracion,
      horarios: horarios.map((horario) => ({
        ...horario,
        trabaja: Boolean(horario.trabaja),
        hora_apertura: horario.hora_apertura?.slice(0, 5) || "",
        hora_cierre: horario.hora_cierre?.slice(0, 5) || "",
        pausa_inicio: horario.pausa_inicio?.slice(0, 5) || "",
        pausa_fin: horario.pausa_fin?.slice(0, 5) || "",
      })),
      hoy: fechaLocal(),
    };
  }

  async obtenerAgenda(fecha) {
    validarFecha(fecha); // Permite consultar también el historial, sin límite de 90 días.
    return this.turnos.getAgenda(fecha);
  }

  async obtenerTurnosDelDia(fecha, conn = db, excluir = null) {
    const dia = validarVentana(fecha);
    const configuracion = await this.obtenerAjustes(conn);
    const horario = configuracion.horarios.find(
      (h) => h.dia_semana === dia.getDay(),
    );
    // Al editar, el turno actual no debe bloquearse a sí mismo.
    const reservas = (
      await this.turnos.getTurnosReservados(fecha, conn)
    ).filter((r) => r.id !== excluir);
    const duracion = configuracion.duracion_turno_min;
    return generarTurnos(horario, duracion).map((hora) => ({
      hora,
      // Dos intervalos se pisan si cada inicio está antes del final del otro.
      reservado: reservas.some(
        (reserva) =>
          horaAMinutos(hora) < horaAMinutos(reserva.hora) + duracion &&
          horaAMinutos(hora) + duracion > horaAMinutos(reserva.hora),
      ),
      pasado: new Date(fecha + "T" + hora + ":00").getTime() <= Date.now(),
    }));
  }

  async #transaccion(operacion) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      // Esta fila actúa como bloqueo común: dos reservas no comprueban el mismo
      // horario al mismo tiempo. El índice UNIQUE original añade otra protección.
      await conn.query(
        "SELECT id FROM configuracion ORDER BY id LIMIT 1 FOR UPDATE",
      );
      const resultado = await operacion(conn);
      await conn.commit(); // Confirma todos los cambios juntos.
      return resultado;
    } catch (error) {
      await conn.rollback(); // Revierte también el cliente si falla la reserva.
      throw error;
    } finally {
      conn.release(); // Devuelve la conexión al pool, incluso si hubo un error.
    }
  }

  async reservarTurno(datos) {
    const { nombre, telefono } = validarCliente(datos);
    validarVentana(datos.fecha);
    exigir(horaValida(datos.hora), "Ingresá una hora válida.");
    return this.#transaccion(async (conn) => {
      const disponibles = await this.obtenerTurnosDelDia(datos.fecha, conn);
      const elegido = disponibles.find((turno) => turno.hora === datos.hora);
      exigir(
        elegido && !elegido.reservado && !elegido.pasado,
        "Ese horario ya no está disponible. Elegí otro.",
        409,
      );
      const configuracion = await this.obtenerAjustes(conn);
      const idUsuario = await this.turnos.crearUsuario(nombre, telefono, conn);
      const id = await this.turnos.crearTurno(
        idUsuario,
        datos.fecha,
        datos.hora,
        conn,
      );
      return {
        id,
        fecha: datos.fecha,
        hora: datos.hora,
        duracion_min: configuracion.duracion_turno_min,
        nombre_y_apellido: nombre,
      };
    });
  }

  async guardarAjustes(datos) {
    const configuracion = validarAjustes(datos);
    return this.#transaccion(async (conn) => {
      const anterior = await this.obtenerAjustes(conn);
      const reservas = await this.turnos.getReservasDesde(fechaLocal(), conn);
      for (const reserva of reservas) {
        if (new Date(reserva.fecha + "T" + reserva.hora) <= new Date())
          continue;
        const dia = new Date(reserva.fecha + "T12:00:00").getDay();
        const nuevo = configuracion.horarios.find((h) => h.dia_semana === dia);
        const previo = anterior.horarios.find((h) => h.dia_semana === dia);
        const campos = [
          "trabaja",
          "hora_apertura",
          "hora_cierre",
          "pausa_inicio",
          "pausa_fin",
        ];
        const cambio =
          anterior.duracion_turno_min !== configuracion.duracion_turno_min ||
          campos.some(
            (campo) => (previo[campo] || null) !== (nuevo[campo] || null),
          );
        // Cambiar solo el nombre no debe rechazar reservas antiguas fuera de la grilla.
        if (!cambio) continue;
        exigir(
          anterior.duracion_turno_min === configuracion.duracion_turno_min &&
            generarTurnos(nuevo, configuracion.duracion_turno_min).includes(
              reserva.hora.slice(0, 5),
            ),
          "Hay reservas futuras incompatibles. Conservá esos horarios o cancelá esas reservas primero.",
          409,
        );
      }
      await this.configuracion.actualizarConfiguracion(configuracion, conn);
      await this.horarios.actualizarHorarios(configuracion.horarios, conn);
      return this.obtenerAjustes(conn);
    });
  }

  async modificarTurno(id, datos) {
    const { nombre, telefono } = validarCliente(datos);
    exigir(horaValida(datos.hora), "Elegí una hora válida.");
    return this.#transaccion(async (conn) => {
      const actual = await this.turnos.getTurno(id, conn);
      exigir(actual, "El turno ya no existe.", 404);
      const cambiaHorario =
        actual.fecha !== datos.fecha || actual.hora.slice(0, 5) !== datos.hora;
      const configuracion = await this.obtenerAjustes(conn);
      if (cambiaHorario) {
        const disponibles = await this.obtenerTurnosDelDia(
          datos.fecha,
          conn,
          id,
        );
        const elegido = disponibles.find((turno) => turno.hora === datos.hora);
        exigir(
          elegido && !elegido.reservado && !elegido.pasado,
          "Ese horario ya no está disponible.",
          409,
        );
      }
      const { cliente, cantidadTurnos } = await this.turnos.getClienteConUso(
        actual.id_usuario,
        conn,
      );
      let idUsuario = actual.id_usuario;
      const cambiaCliente =
        cliente.nombre_y_apellido !== nombre ||
        (cliente.telefono || "") !== telefono;
      // Si el cliente tiene otros turnos, sus datos no se alteran al editar solo este.
      if (cantidadTurnos > 1 && cambiaCliente) {
        idUsuario = await this.turnos.crearUsuario(nombre, telefono, conn);
      } else {
        await this.turnos.actualizarUsuario(idUsuario, nombre, telefono, conn);
      }
      await this.turnos.actualizarTurno(
        id,
        datos.fecha,
        datos.hora,
        idUsuario,
        conn,
      );
      return {
        id,
        fecha: datos.fecha,
        hora: datos.hora,
        duracion_min: configuracion.duracion_turno_min,
        nombre_y_apellido: nombre,
        telefono,
      };
    });
  }

  async cancelarTurno(id) {
    return this.#transaccion(async (conn) => {
      const turno = await this.turnos.getTurno(id, conn);
      exigir(turno, "No encontramos esa reserva.", 404);
      await this.turnos.eliminarTurno(id, conn);
      return { message: "Reserva cancelada." };
    });
  }
}
