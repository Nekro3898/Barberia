/**
 * Funciones puras: validan entradas y calculan horarios, sin consultar MySQL.
 * Una función pura facilita probar reglas sin escribir datos reales.
 */
export class ErrorHttp extends Error {
  constructor(status, message) {
    super(message); // Conserva el mensaje y la pila de la clase Error.
    this.status = status; // El manejador de Express lo convierte en estado HTTP.
  }
}

/** Falla temprano si una regla no se cumple; por defecto devuelve error 400. */
export function exigir(condicion, mensaje, estado = 400) {
  if (!condicion) throw new ErrorHttp(estado, mensaje);
}

/** "08:30:00" -> 510. Los segundos se ignoran porque los turnos usan minutos. */
export function horaAMinutos(hora) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

/** 510 -> "08:30". padStart añade el cero que falta. */
export function minutosAHora(minutos) {
  return (
    String(Math.floor(minutos / 60)).padStart(2, "0") +
    ":" +
    String(minutos % 60).padStart(2, "0")
  );
}

/** Construye YYYY-MM-DD con la fecha local del negocio, no con UTC. */
export function fechaLocal(fecha = new Date()) {
  return (
    fecha.getFullYear() +
    "-" +
    String(fecha.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(fecha.getDate()).padStart(2, "0")
  );
}

export function validarFecha(fecha) {
  // La expresión regular controla el formato; después comprobamos el calendario.
  exigir(
    typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha),
    "Ingresá una fecha válida.",
  );
  const dia = new Date(fecha + "T12:00:00");
  // JavaScript normaliza fechas imposibles; volver a texto detecta ese cambio.
  exigir(
    !Number.isNaN(dia.getTime()) && fechaLocal(dia) === fecha,
    "La fecha no existe.",
  );
  return dia;
}

export function validarVentana(fecha) {
  const dia = validarFecha(fecha);
  const limite = new Date();
  limite.setDate(limite.getDate() + 90);
  // En formato ISO completo el orden alfabético coincide con el cronológico.
  exigir(
    fecha >= fechaLocal() && fecha <= fechaLocal(limite),
    "Elegí una fecha entre hoy y los próximos 90 días.",
  );
  return dia;
}

/** Acepta exclusivamente HH:mm entre 00:00 y 23:59. */
export const horaValida = (hora) =>
  typeof hora === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(hora);

export function validarCliente(datos) {
  const nombre =
    typeof datos.nombre_y_apellido === "string"
      ? datos.nombre_y_apellido.trim()
      : "";
  const telefono =
    typeof datos.telefono === "string" ? datos.telefono.trim() : "";
  exigir(
    nombre.length >= 2 && nombre.length <= 50,
    "Ingresá el nombre del cliente (entre 2 y 50 caracteres).",
  );
  // El teléfono es opcional. Si existe, debe tener al menos siete dígitos.
  exigir(
    !telefono ||
      (/^[+\d\s()-]{7,20}$/.test(telefono) &&
        telefono.replace(/\D/g, "").length >= 7),
    "Ingresá un teléfono válido.",
  );
  return { nombre, telefono };
}

export function generarTurnos(horario, duracion) {
  // Impide duraciones cero o negativas que provocarían un bucle infinito.
  exigir(
    Number.isInteger(duracion) && duracion >= 5 && duracion <= 240,
    "La duración debe estar entre 5 y 240 minutos.",
  );
  if (!horario?.trabaja) return [];
  const turnos = [];
  let inicio = horaAMinutos(horario.hora_apertura);
  const cierre = horaAMinutos(horario.hora_cierre);
  const pausaInicio = horario.pausa_inicio
    ? horaAMinutos(horario.pausa_inicio)
    : null;
  const pausaFin = horario.pausa_fin ? horaAMinutos(horario.pausa_fin) : null;
  while (inicio + duracion <= cierre) {
    // El turno entero debe caber fuera de la pausa, no solamente su inicio.
    if (
      pausaInicio !== null &&
      pausaFin !== null &&
      inicio < pausaFin &&
      inicio + duracion > pausaInicio
    ) {
      inicio = pausaFin;
      continue; // Reinicia la evaluación desde el final de la pausa.
    }
    turnos.push(minutosAHora(inicio));
    inicio += duracion;
  }
  return turnos;
}

export function validarAjustes(datos) {
  const nombre =
    typeof datos.nombre_negocio === "string" ? datos.nombre_negocio.trim() : "";
  exigir(
    nombre.length >= 2 && nombre.length <= 100,
    "El nombre del negocio debe tener entre 2 y 100 caracteres.",
  );
  const duracion = datos.duracion_turno_min;
  exigir(
    Number.isInteger(duracion) && duracion >= 5 && duracion <= 240,
    "La duración debe ser un entero entre 5 y 240 minutos.",
  );
  exigir(
    Array.isArray(datos.horarios) && datos.horarios.length === 7,
    "Configurá los siete días de la semana.",
  );
  const dias = new Set(); // Detecta días repetidos sin recorrer otra vez el arreglo.
  const horarios = datos.horarios.map((horario) => {
    exigir(
      horario && typeof horario === "object" && !Array.isArray(horario),
      "Cada día debe contener una configuración válida.",
    );
    exigir(
      Number.isInteger(horario.dia_semana) &&
        horario.dia_semana >= 0 &&
        horario.dia_semana <= 6 &&
        !dias.has(horario.dia_semana),
      "Los días de la semana no deben repetirse.",
    );
    dias.add(horario.dia_semana);
    exigir(
      typeof horario.trabaja === "boolean",
      "Indicá si se trabaja cada día.",
    );
    if (!horario.trabaja) {
      // Un día cerrado se guarda con horas NULL en vez de cadenas vacías.
      return {
        ...horario,
        hora_apertura: null,
        hora_cierre: null,
        pausa_inicio: null,
        pausa_fin: null,
      };
    }
    exigir(
      horaValida(horario.hora_apertura) &&
        horaValida(horario.hora_cierre) &&
        horario.hora_apertura < horario.hora_cierre,
      "La apertura debe ser anterior al cierre.",
    );
    const inicio = horario.pausa_inicio || null;
    const fin = horario.pausa_fin || null;
    exigir(
      (!inicio && !fin) ||
        (horaValida(inicio) &&
          horaValida(fin) &&
          inicio < fin &&
          inicio >= horario.hora_apertura &&
          fin <= horario.hora_cierre),
      "Completá ambos extremos de la pausa dentro del horario de atención.",
    );
    const resultado = { ...horario, pausa_inicio: inicio, pausa_fin: fin };
    exigir(
      generarTurnos(resultado, duracion).length > 0,
      "Cada día abierto debe permitir al menos un turno.",
    );
    return resultado;
  });
  return { nombre_negocio: nombre, duracion_turno_min: duracion, horarios };
}
