/**
 * Comprobación de instalación: solo lectura.
 * LIMIT 0 verifica que existen las cuatro tablas sin traer datos personales.
 */
import db from "../config/db.js";

try {
  for (const tabla of ["usuarios", "turnos", "horarios", "configuracion"]) {
    // El nombre proviene de esta lista fija, nunca de una entrada del usuario.
    await db.query("SELECT * FROM " + tabla + " LIMIT 0");
  }
  console.log(
    "Conexión y tablas originales verificadas. No se modificaron datos ni estructura.",
  );
} finally {
  await db.end(); // Permite que este comando termine sin dejar el pool abierto.
}
