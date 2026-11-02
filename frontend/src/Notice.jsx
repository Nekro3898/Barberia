/** Mensaje reutilizable y accesible: no ocupa espacio cuando está vacío. */
export default function Notice({ children, type = "error" }) {
  return children ? (
    <div
      className={"notice " + type}
      role={type === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  ) : null;
}
