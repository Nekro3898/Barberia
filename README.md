# Barbería

Aplicación web para gestionar los turnos de un barbero desde una computadora o un celular. Permite agendar, consultar, modificar y eliminar reservas, y configurar los horarios de atención y la duración de los turnos.

## Funcionalidades

- Agenda diaria con búsqueda por nombre del cliente.
- Reserva de horarios disponibles y prevención de superposiciones.
- Modificación y eliminación de turnos.
- Configuración de días de trabajo, horarios y pausas.
- Duración común configurable para los turnos.
- Interfaz adaptable a dispositivos móviles.

La aplicación abre directamente, sin inicio de sesión. Está pensada para usarse en una red local de confianza: cualquier persona que acceda puede administrar la agenda.

## Tecnologías

- **Frontend:** React, Vite, HTML, JavaScript y CSS.
- **Backend:** Node.js y Express.
- **Base de datos:** MySQL, mediante mysql2.
- **Configuración:** dotenv.

## Requisitos

- Node.js 22.12 o superior compatible con Vite (verificado con Node.js 24).
- npm.
- Servidor MySQL en ejecución.

## Instalación

Descargá o cloná el repositorio y abrí una terminal en la carpeta del proyecto.

### 1. Instalar dependencias

```bash
npm ci
npm --prefix frontend ci
```

Estos comandos instalan las dependencias del backend y del frontend usando las versiones registradas en sus archivos package-lock.json. No hace falta instalar cada paquete por separado.

### 2. Preparar la base de datos

Si ya tenés la base del sistema, utilizala sin volver a ejecutar el esquema.

Para una instalación nueva, creá una base vacía en MySQL e importá el archivo `db/database.sql` en ella. Luego ejecutá lo siguiente **solo en esa base nueva**, para cargar los ajustes iniciales:

```sql
INSERT INTO configuracion (nombre_negocio, duracion_turno_min)
VALUES ('Barbería', 30);

INSERT INTO horarios (dia_semana, trabaja)
VALUES (0, 0), (1, 0), (2, 0), (3, 0), (4, 0), (5, 0), (6, 0);
```

Los días empiezan cerrados. Una vez iniciada la aplicación, definí los días y horarios de atención desde la configuración.

La aplicación utiliza las tablas usuarios, turnos, horarios y configuracion. No crea ni modifica su estructura al iniciarse.

### 3. Configurar el entorno

Copiá `.env.example` como `.env` y completá los datos de tu instalación. Si ya existe un archivo configurado, conservá sus valores.

```dotenv
db_host=localhost
db_port=3306
db_user=tu_usuario
db_password=tu_contraseña
db_name=barbershop
PORT=3001
TZ=America/Argentina/Buenos_Aires
```

El nombre de la base debe coincidir con la base que preparaste. El archivo .env contiene credenciales y no debe subirse al repositorio.

Comprobá la conexión y la presencia de las tablas:

```bash
npm run setup
```

Este comando solo verifica la instalación: no crea tablas ni carga datos.

### 4. Compilar e iniciar

```bash
npm run build
npm start
```

Abrí [http://localhost:3001](http://localhost:3001). Para detener el servidor, presioná Ctrl+C en la terminal.

## Desarrollo

Ejecutá cada comando en una terminal distinta, desde la raíz del proyecto:

```bash
npm run dev
```

```bash
npm run frontend
```

Abrí [http://localhost:5173](http://localhost:5173). Vite reenvía las solicitudes de la API al backend.

## Uso desde el celular

Conectá el celular y la computadora a la misma red y abrí `http://IP-DE-LA-COMPUTADORA:3001`. En Windows podés consultar la IPv4 con `ipconfig`.

La computadora, MySQL y el servidor deben permanecer encendidos. El firewall debe permitir la conexión a Node.js desde la red privada.

## Comandos

| Comando | Descripción |
| --- | --- |
| npm start | Inicia el servidor con la interfaz compilada. |
| npm run dev | Inicia el backend con reinicio automático. |
| npm run frontend | Inicia Vite para desarrollar la interfaz. |
| npm run build | Compila el frontend. |
| npm run setup | Comprueba la conexión y las tablas. |
| npm test | Ejecuta las pruebas automáticas. |

Las pruebas de integración utilizan una base temporal independiente y la eliminan al finalizar. Requieren MySQL activo y permisos para crear y eliminar esa base de prueba.
