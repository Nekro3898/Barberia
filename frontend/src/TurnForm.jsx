/**
 * Formulario compartido para alta y edición.
 * initial existe al editar; sin initial se crea un turno nuevo.
 * El formulario controla sus campos; App recibe el resultado mediante onSaved.
 */
import { useEffect, useState } from "react";
import { api } from "./api.js";
import { dateKey, dias } from "./fechas.js";
import Icon from "./Icon.jsx";

export default function TurnForm({
  config,
  initial,
  date: initialDate,
  onSaved,
  onError,
}) {
  // Fecha seleccionada en formato YYYY-MM-DD; viaja como texto a la API.
  const [date, setDate] = useState(initial?.fecha || initialDate);
  // Hora elegida en formato HH:mm; vacía hasta que se selecciona una disponible.
  const [hour, setHour] = useState(initial?.hora.slice(0, 5) || "");
  // Nombre del cliente controlado por React, no por una variable global.
  const [name, setName] = useState(initial?.nombre_y_apellido || "");
  // Teléfono opcional del cliente; una cadena vacía también es válida.
  const [phone, setPhone] = useState(initial?.telefono || "");
  // Horarios posibles con indicadores reservado y pasado.
  const [slots, setSlots] = useState([]);
  // Indica que hay una consulta en curso; permite mostrar el estado de carga.
  const [loading, setLoading] = useState(true);
  // Bloquea los controles durante una escritura para evitar envíos repetidos.
  const [busy, setBusy] = useState(false);
  // Abre la confirmación visual antes de eliminar el turno.
  const [confirm, setConfirm] = useState(false);
  // Incrementarlo repite el efecto de consulta sin cambiar la fecha.
  const [reload, setReload] = useState(0);
  // Distingue un error de red de una lista de resultados vacía.
  const [failed, setFailed] = useState(false);
  // El backend impone el mismo límite. El control HTML solo ayuda a elegir.
  const max = new Date(config.hoy + "T12:00:00");
  max.setDate(max.getDate() + 90);
  // La hora original sigue seleccionable para editar datos sin mover el turno.
  const current =
    initial && date === initial.fecha ? initial.hora.slice(0, 5) : "";
  // Pide disponibilidad cada vez que cambia la fecha o se necesita reintentar.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    setSlots([]);
    if (initial && date < config.hoy) {
      setSlots([
        { hora: initial.hora.slice(0, 5), reservado: false, pasado: true },
      ]);
      setLoading(false);
      return;
    }
    api(
      "/disponibilidad?fecha=" +
        date +
        (initial ? "&excluir=" + initial.id : ""),
    )
      .then((data) => {
        if (active) {
          if (current && !data.some((s) => s.hora === current))
            data = [
              ...data,
              { hora: current, reservado: false, pasado: true },
            ].sort((a, b) => a.hora.localeCompare(b.hora));
          setSlots(data);
        }
      })
      .catch((e) => {
        if (active) {
          setFailed(true);
          onError(e);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [date, reload]);
  // POST crea; PUT modifica. El servidor vuelve a comprobar disponibilidad.
  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    onError({ message: "" });
    try {
      const result = await api("/turnos" + (initial ? "/" + initial.id : ""), {
        method: initial ? "PUT" : "POST",
        body: JSON.stringify({
          nombre_y_apellido: name,
          telefono: phone,
          fecha: date,
          hora: hour,
        }),
      });
      onSaved(result);
    } catch (e) {
      onError(e);
      if (e.status === 409) {
        setHour("");
        setReload((x) => x + 1);
      }
    } finally {
      setBusy(false);
    }
  }
  // Se ejecuta únicamente después de pulsar Sí, eliminar.
  async function remove() {
    setBusy(true);
    onError({ message: "" });
    try {
      await api("/turnos/" + initial.id, { method: "DELETE" });
      onSaved(initial, true);
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  }
  // Cambiar el día invalida la hora anterior, salvo que se vuelva al turno original.
  function changeDate(value) {
    if (value) {
      setDate(value);
      setHour(
        initial && value === initial.fecha ? initial.hora.slice(0, 5) : "",
      );
    }
  }
  const dateObject = new Date(date + "T12:00:00");
  return (
    <form className="turn-form" onSubmit={save}>
      <fieldset disabled={busy}>
        <div className="form-card">
          <label>
            <span>
              <Icon name="user" size={18} />
              Cliente
            </span>
            <input
              name="cliente"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              minLength={2}
              maxLength={50}
              required
              autoComplete="off"
            />
          </label>
          <label>
            <span>
              <Icon name="phone" size={18} />
              Teléfono <small>opcional</small>
            </span>
            <input
              name="telefono"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11 2345 6789"
              maxLength={20}
              autoComplete="off"
            />
          </label>
        </div>
        <div className="form-card">
          <label>
            <span>
              <Icon name="calendar" size={18} />
              Fecha <small>{dias[dateObject.getDay()]}</small>
            </span>
            <input
              type="date"
              value={date}
              min={initial?.fecha < config.hoy ? initial.fecha : config.hoy}
              max={dateKey(max)}
              onChange={(e) => changeDate(e.target.value)}
              required
            />
          </label>
          <div className="field-heading">
            <Icon name="clock" size={18} />
            <span>Hora</span>
            <small>{config.duracion_turno_min} min</small>
          </div>
          {loading ? (
            <p className="inline-empty" role="status">
              Cargando…
            </p>
          ) : failed ? (
            <button
              type="button"
              className="button outline full"
              onClick={() => setReload((x) => x + 1)}
            >
              Reintentar
            </button>
          ) : slots.length === 0 ? (
            <p className="inline-empty">Sin horarios este día</p>
          ) : (
            <div className="time-grid">
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.hora}
                  className={hour === s.hora ? "selected" : ""}
                  aria-pressed={hour === s.hora}
                  aria-label={s.hora + (s.reservado ? " ocupado" : "")}
                  disabled={s.reservado || (s.pasado && s.hora !== current)}
                  onClick={() => setHour(s.hora)}
                >
                  {s.hora}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          className="button full save-button"
          disabled={busy || loading || !hour || failed}
        >
          <Icon name="check" />
          {busy ? "Guardando…" : initial ? "Guardar cambios" : "Agendar turno"}
        </button>
        {initial && !confirm && (
          <button
            type="button"
            className="button delete-button full"
            onClick={() => setConfirm(true)}
          >
            <Icon name="trash" size={20} />
            Eliminar turno
          </button>
        )}
      </fieldset>
      {confirm && (
        <div className="delete-confirm" role="alert">
          <Icon name="trash" size={28} />
          <h2>¿Eliminar turno?</h2>
          <p>
            {initial.nombre_y_apellido} · {initial.hora.slice(0, 5)}
          </p>
          <button
            type="button"
            className="button danger full"
            disabled={busy}
            onClick={remove}
          >
            {busy ? "Eliminando…" : "Sí, eliminar"}
          </button>
          <button
            type="button"
            className="button outline full"
            disabled={busy}
            onClick={() => setConfirm(false)}
          >
            Volver
          </button>
        </div>
      )}
    </form>
  );
}
