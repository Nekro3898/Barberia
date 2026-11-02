/** Utilidades de presentación. El backend vuelve a validar las fechas por separado. */
export const dias = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/** Formato que requiere input type=date: YYYY-MM-DD, usando el calendario local. */
export const dateKey = (date) =>
  date.getFullYear() +
  "-" +
  String(date.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(date.getDate()).padStart(2, "0");
