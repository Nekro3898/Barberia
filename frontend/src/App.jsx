/** Componente raíz: conserva configuración, pantalla activa y mensajes comunes. */
import { useEffect, useState } from "react";
import { api } from "./api.js";
import Notice from "./Notice.jsx";
import Home from "./Home.jsx";
import Agenda from "./Agenda.jsx";
import Icon from "./Icon.jsx";
import TurnForm from "./TurnForm.jsx";
import Settings from "./Settings.jsx";

export default function App() {
  // Configuración cargada del backend: nombre, duración, semana y fecha del negocio.
  const [config, setConfig] = useState(null);
  // Pantalla visible. Cambiarla vuelve a renderizar React sin recargar el documento.
  const [screen, setScreen] = useState("home");
  // Fecha seleccionada en formato YYYY-MM-DD; viaja como texto a la API.
  const [date, setDate] = useState("");
  // Turno seleccionado para editar; null indica que no hay una edición abierta.
  const [editing, setEditing] = useState(null);
  // Mensaje de error visible. Una cadena vacía oculta el aviso.
  const [error, setError] = useState("");
  // Confirmación de la última acción completada correctamente.
  const [message, setMessage] = useState("");
  // Contador para repetir la carga inicial cuando se pulsa Reintentar.
  const [refresh, setRefresh] = useState(0);
  // Carga al montar y al reintentar. active descarta respuestas tras desmontar.
  useEffect(() => {
    let active = true;
    api("/configuracion")
      .then((c) => {
        if (active) {
          setConfig(c);
          setDate(c.hoy);
          document.title = c.nombre_negocio;
        }
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [refresh]);
  // Navegar limpia la edición y los avisos de la pantalla anterior.
  function navigate(next) {
    setScreen(next);
    setEditing(null);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0 });
  }
  // Centraliza errores de los hijos y hace visible el aviso en pantallas pequeñas.
  function fail(e) {
    setError(e.message);
    if (e.message) window.scrollTo({ top: 0, behavior: "smooth" });
  }
  // Tras guardar o borrar, muestra la agenda del día que acaba de cambiar.
  function saved(result, deleted = false) {
    setDate(result.fecha);
    setScreen("agenda");
    setEditing(null);
    setError("");
    setMessage(deleted ? "Turno eliminado" : "Turno guardado");
    window.scrollTo({ top: 0 });
  }
  const title = editing
    ? "Modificar turno"
    : {
        home: "",
        new: "Agendar",
        agenda: "Mis turnos",
        edit: "Modificar",
        settings: "Ajustes",
      }[screen];
  return (
    <div className="app-shell">
      <header className="app-header">
        <button
          className="brand"
          onClick={() => navigate("home")}
          aria-label="Inicio"
        >
          <span className="brand-icon">
            <Icon name="scissors" size={25} />
          </span>
          <span>{config?.nombre_negocio || "La Barbería"}</span>
        </button>
        {config && (
          <button
            className={"icon-button " + (screen === "settings" ? "active" : "")}
            aria-label="Ajustes"
            onClick={() => navigate("settings")}
          >
            <Icon name="settings" />
          </button>
        )}
      </header>
      <main>
        {!config ? (
          <div className="loading">
            <Icon name="clock" />
            <p>{error || "Cargando…"}</p>
            {error && (
              <button
                className="button"
                onClick={() => {
                  setError("");
                  setRefresh((x) => x + 1);
                }}
              >
                Reintentar
              </button>
            )}
          </div>
        ) : (
          <>
            {screen !== "home" && (
              <div className="screen-title">
                <button
                  className="icon-button"
                  aria-label="Volver"
                  onClick={() =>
                    editing
                      ? (setEditing(null), setError(""))
                      : navigate("home")
                  }
                >
                  <Icon name="back" />
                </button>
                <h1>{title}</h1>
                {screen === "agenda" && !editing && (
                  <button
                    className="icon-button"
                    aria-label="Agendar turno"
                    onClick={() => navigate("new")}
                  >
                    <Icon name="plus" />
                  </button>
                )}
              </div>
            )}
            <Notice>{error}</Notice>
            <Notice type="success">{message}</Notice>
            {editing ? (
              <TurnForm
                config={config}
                initial={editing}
                date={date}
                onSaved={saved}
                onError={fail}
              />
            ) : screen === "home" ? (
              <Home config={config} navigate={navigate} />
            ) : screen === "new" ? (
              <TurnForm
                config={config}
                date={date < config.hoy ? config.hoy : date}
                onSaved={saved}
                onError={fail}
              />
            ) : screen === "agenda" || screen === "edit" ? (
              <Agenda
                date={date}
                setDate={setDate}
                editing={screen === "edit"}
                onEdit={(t) => {
                  setEditing(t);
                  setMessage("");
                  setError("");
                  window.scrollTo({ top: 0 });
                }}
                onNew={() => navigate("new")}
                onError={fail}
              />
            ) : (
              <Settings config={config} onConfig={setConfig} onError={fail} />
            )}
          </>
        )}
      </main>
      {config && (
        <nav className="bottom-nav" aria-label="Navegación">
          {[
            ["home", "home", "Inicio"],
            ["agenda", "calendar", "Turnos"],
            ["settings", "settings", "Ajustes"],
          ].map(([key, icon, label]) => (
            <button
              key={key}
              className={screen === key ? "active" : ""}
              aria-current={screen === key ? "page" : undefined}
              onClick={() => navigate(key)}
            >
              <Icon name={icon} size={22} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
