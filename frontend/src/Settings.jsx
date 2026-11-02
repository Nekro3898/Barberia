/**
 * Editor de ajustes del negocio: trabaja sobre una copia del estado de App.
 * Solo al guardar se envía PUT; escribir en un campo no cambia MySQL todavía.
 */
import { useState } from "react";
import { api } from "./api.js";
import { dias } from "./fechas.js";
import Notice from "./Notice.jsx";
import Icon from "./Icon.jsx";
export default function Settings({ config, onConfig, onError }) {
  // Copia editable de la configuración: evita mutar las props recibidas.
  const [form, setForm] = useState(() => structuredClone(config));
  // Bloquea los controles durante una escritura para evitar envíos repetidos.
  const [busy, setBusy] = useState(false);
  // Confirmación de la última acción completada correctamente.
  const [message, setMessage] = useState("");
  // Copia el objeto y el arreglo: React detecta los cambios por referencia.
  function changeDay(day, key, value) {
    setMessage("");
    setForm((f) => ({
      ...f,
      horarios: f.horarios.map((h) =>
        h.dia_semana === day
          ? {
              ...h,
              [key]: value,
              ...(key === "trabaja" && value && !h.hora_apertura
                ? { hora_apertura: "09:00", hora_cierre: "18:00" }
                : {}),
            }
          : h,
      ),
    }));
  }
  // Envía todos los ajustes juntos; el servidor los confirma en una transacción.
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    onError({ message: "" });
    try {
      const data = await api("/configuracion", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      onConfig(data);
      setForm(structuredClone(data));
      setMessage("Cambios guardados");
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save}>
      <fieldset disabled={busy}>
        <div className="form-card">
          <label>
            Nombre de la barbería
            <input
              value={form.nombre_negocio}
              minLength={2}
              maxLength={100}
              required
              onChange={(e) =>
                setForm({ ...form, nombre_negocio: e.target.value })
              }
            />
          </label>
          <label>
            Minutos por turno
            <input
              type="number"
              min="5"
              max="240"
              step="1"
              required
              value={form.duracion_turno_min}
              onChange={(e) =>
                setForm({
                  ...form,
                  duracion_turno_min: Number(e.target.value),
                })
              }
            />
          </label>
        </div>
        <h2 className="settings-title">
          <Icon name="calendar" size={21} />
          Horarios
        </h2>
        <div className="week-settings">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const h = form.horarios.find((x) => x.dia_semana === d);
            return (
              <details className="day-setting" key={d}>
                <summary>
                  <span>{dias[d]}</span>
                  <small>
                    {h.trabaja
                      ? h.hora_apertura + " – " + h.hora_cierre
                      : "Cerrado"}
                  </small>
                  <Icon name="right" size={18} />
                </summary>
                <div className="day-content">
                  <label className="toggle-label">
                    Abierto
                    <input
                      type="checkbox"
                      checked={h.trabaja}
                      onChange={(e) =>
                        changeDay(d, "trabaja", e.target.checked)
                      }
                    />
                  </label>
                  {h.trabaja && (
                    <div className="time-fields">
                      {[
                        ["hora_apertura", "Desde"],
                        ["hora_cierre", "Hasta"],
                        ["pausa_inicio", "Pausa desde"],
                        ["pausa_fin", "Pausa hasta"],
                      ].map(([key, label]) => (
                        <label key={key}>
                          {label}
                          <input
                            type="time"
                            aria-label={dias[d] + " " + label}
                            required={
                              key === "hora_apertura" || key === "hora_cierre"
                            }
                            value={h[key] || ""}
                            onChange={(e) => changeDay(d, key, e.target.value)}
                          />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </fieldset>
      <Notice type="success">{message}</Notice>
      <button className="button full" disabled={busy}>
        <Icon name="check" />
        {busy ? "Guardando…" : "Guardar ajustes"}
      </button>
    </form>
  );
}
