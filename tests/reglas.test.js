/** Pruebas unitarias: validan reglas de fechas y horarios sin conexión a MySQL. */
import test from "node:test";
import assert from "node:assert/strict";
import {
  generarTurnos,
  validarFecha,
  validarAjustes,
} from "../models/reglas.js";
const horario = {
  trabaja: true,
  hora_apertura: "09:00",
  hora_cierre: "12:00",
  pausa_inicio: "10:10",
  pausa_fin: "10:40",
};
test("el turno completo debe caber antes de la pausa y del cierre", () =>
  assert.deepEqual(generarTurnos(horario, 30), [
    "09:00",
    "09:30",
    "10:40",
    "11:10",
  ]));
test("un día cerrado no genera turnos", () =>
  assert.deepEqual(generarTurnos({ ...horario, trabaja: false }, 30), []));
test("la duración cero y valores no numéricos se rechazan sin bucle infinito", () => {
  for (const value of [0, -1, NaN, undefined, "30"])
    assert.throws(() => generarTurnos(horario, value));
});
test("se rechazan fechas imposibles y formatos ambiguos", () => {
  for (const value of ["2026-02-30", "2026-13-01", "01/11/2026", null])
    assert.throws(() => validarFecha(value));
  assert.doesNotThrow(() => validarFecha("2028-02-29"));
});
test("una pausa incompleta no es válida", () =>
  assert.throws(() =>
    validarAjustes({
      nombre_negocio: "Prueba",
      duracion_turno_min: 30,
      horarios: Array.from({ length: 7 }, (_, dia_semana) => ({
        ...horario,
        dia_semana,
        pausa_fin: "",
      })),
    }),
  ));
