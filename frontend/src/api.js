/** Cliente HTTP común: centraliza JSON y errores de red. No consulta MySQL directamente. */
export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch("/api" + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error(
      "No hay conexión con el servidor. Revisá que esté iniciado.",
    );
  }
  const data = await response.json().catch(() => ({
    message: "El servidor no devolvió una respuesta válida.",
  }));
  if (!response.ok) {
    const error = new Error(
      data.message || "No se pudo completar la operación.",
    );
    error.status = response.status; // 409 permite actualizar la lista si alguien ocupó el horario.
    throw error;
  }
  return data;
}
