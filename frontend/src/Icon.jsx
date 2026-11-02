/**
 * Biblioteca pequeña de dibujos SVG propios, sin paquetes de íconos.
 * name selecciona el dibujo; size controla sus dimensiones.
 * Los íconos son decorativos: el botón que los contiene aporta el nombre accesible.
 */
export default function Icon({ name, size = 24, ...props }) {
  const paths = {
    scissors: (
      <>
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="m8.2 8.2 12.3 12.3M14 10l6.5-6.5M8.2 15.8 11 13" />
        <path d="m10 10 2 2" />
      </>
    ),
    plus: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4m10-4v4M3 10h18m-9 3v5m-2.5-2.5h5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4m10-4v4M3 10h18m-14 4h2m4 0h2m-8 3h2m4 0h2" />
      </>
    ),
    edit: (
      <>
        <path d="m14 5 5 5M4 20l5-1L20 8a2.1 2.1 0 0 0-5-5L4 14l-1 6Zm9 0h8" />
      </>
    ),
    home: (
      <>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
        <path d="M9 21v-8h6v8" />
      </>
    ),
    settings: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="3" />
        <circle cx="16" cy="17" r="3" />
      </>
    ),
    back: <path d="m14 6-6 6 6 6" />,
    right: <path d="m9 6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    trash: (
      <>
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="7" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    phone: <path d="M6 3H3v4c0 8 6 14 14 14h4v-3l-5-3-2 2c-3-1-6-4-7-7l2-2Z" />,
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M5.2 7a8 8 0 0 1 13-2L20 8M4 16l1.8 3a8 8 0 0 0 13-2" />
      </>
    ),
    dog: (
  <>
    <path d="M7 7 3 4 2 13l4 1M17 7l4-3 1 9-4 1" />
    <rect x="6" y="5" width="12" height="16" rx="6" />
    <circle cx="9" cy="11" r="1" fill="currentColor" />
    <circle cx="15" cy="11" r="1" fill="currentColor" />
    <path d="m10 15 2 2 2-2Z M12 17v2" />
  </>
),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {paths[name] || paths.calendar}
    </svg>
  );
}
