/** Agenda por día: consulta MySQL a través de la API y permite abrir un turno. */
import { useEffect, useState } from "react";
import { api } from "./api.js";
import { dateKey } from "./fechas.js";
import Icon from "./Icon.jsx";
export default function Agenda({
  date,
  setDate,
  editing,
  onEdit,
  onNew,
  onError,
}) {
  // Turnos devueltos por la API para la fecha seleccionada.
  const [rows, setRows] = useState([]);
  // Indica que hay una consulta en curso; permite mostrar el estado de carga.
  const [loading, setLoading] = useState(true);
  // Incrementarlo repite el efecto de consulta sin cambiar la fecha.
  const [reload, setReload] = useState(0);
  // Texto usado para filtrar clientes en la lista ya cargada.
  const [query, setQuery] = useState("");
  // Distingue un error de red de una lista de resultados vacía.
  const [failed, setFailed] = useState(false);
  // Recarga al cambiar la fecha. La limpieza evita mostrar respuestas atrasadas.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    api("/turnos?fecha=" + date)
      .then((data) => active && setRows(data))
      .catch((e) => {
        if (active) {
          setRows([]);
          setFailed(true);
          onError(e);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [date, reload]);
  // Suma o resta un día sin calcular manualmente los cambios de mes.
  const move = (step) => {
    const next = new Date(date + "T12:00:00");
    next.setDate(next.getDate() + step);
    setDate(dateKey(next));
  };
  // El filtro es local; no necesita otra consulta al servidor.
  const filtered = rows.filter((r) =>
    r.nombre_y_apellido.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  return (
    <section className="agenda">
      <div className="date-picker">
        <button
          className="icon-button"
          aria-label="Día anterior"
          onClick={() => move(-1)}
        >
          <Icon name="back" />
        </button>
        <label className="date-label">
          <span>Fecha</span>
          <input
            type="date"
            value={date}
            required
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </label>
        <button
          className="icon-button"
          aria-label="Día siguiente"
          onClick={() => move(1)}
        >
          <Icon name="right" />
        </button>
      </div>
      <div className="list-heading">
        <span>
          {loading
            ? "…"
            : rows.length + (rows.length === 1 ? " turno" : " turnos")}
        </span>
        <button
          className="icon-button"
          aria-label="Actualizar turnos"
          onClick={() => setReload((x) => x + 1)}
          disabled={loading}
        >
          <Icon name="refresh" size={19} />
        </button>
      </div>
      {rows.length > 4 && (
        <label className="search-label">
          <span>Buscar cliente</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre"
          />
        </label>
      )}
      {loading ? (
        <div className="empty" role="status">
          Cargando…
        </div>
      ) : failed ? (
        <button
          className="button outline full"
          onClick={() => setReload((x) => x + 1)}
        >
          Reintentar
        </button>
      ) : rows.length === 0 ? (
        <div className="empty">
          <span className="empty-symbol">
            <Icon name="calendar" size={35} />
          </span>
          <h2>Sin turnos</h2>
          <button className="button" onClick={onNew}>
            <Icon name="plus" />
            Agendar
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">Sin coincidencias</div>
      ) : (
        <div className="appointment-list">
          {filtered.map((r) => (
            <button
              key={r.id}
              className="appointment"
              onClick={() => onEdit(r)}
              aria-label={
                "Modificar turno de " +
                r.nombre_y_apellido +
                " a las " +
                r.hora.slice(0, 5)
              }
            >
              <span className="appointment-time">
                {r.hora.slice(0, 5)}
                <small>{r.duracion_min} min</small>
              </span>
              <span className="appointment-person">
                <strong>{r.nombre_y_apellido}</strong>
                {r.telefono && <small>{r.telefono}</small>}
              </span>
              <span className="edit-circle">
                <Icon name={editing ? "edit" : "right"} size={20} />
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
