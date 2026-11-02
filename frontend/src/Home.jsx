/** Inicio: muestra accesos a las tres tareas principales y la fecha del negocio. */
import { dias } from "./fechas.js";
import Icon from "./Icon.jsx";
export default function Home({ config, navigate }) {
  const today = new Date(config.hoy + "T12:00:00");
  return (
    <section className="home">
      <div className="home-heading">
        <div>
          <span className="small-label">{dias[today.getDay()]}</span>
          <h1>
            Mi agenda<span className="title-dot">.</span>
          </h1>
        </div>
        <div className="date-stamp">
          <span>
            {today
              .toLocaleDateString("es-AR", { month: "short" })
              .replace(".", "")}
          </span>
          <strong>{today.getDate()}</strong>
        </div>
      </div>
      <div className="home-actions">
        {[
          ["new", "plus", "Agendar", "primary-tile"],
          ["agenda", "calendar", "Ver turnos", "light-tile"],
          ["edit", "edit", "Modificar", "sand-tile"],
        ].map(([screen, icon, label, style]) => (
          <button
            className={"action-tile " + style}
            key={screen}
            onClick={() => navigate(screen)}
          >
            <span className="tile-icon">
              <Icon name={icon} size={34} />
            </span>
            <strong>{label}</strong>
            <Icon name="right" size={21} />
          </button>
        ))}
      </div>
      <div className="duration-chip">
        <Icon name="clock" size={17} />
        <span>{config.duracion_turno_min} min por turno</span>
        <span className="tiny-scissors">
          <Icon name="scissors" size={18} />
        </span>
      </div>
    </section>
  );
}
