/**
 * Carga las variables locales y crea un pool reutilizable de conexiones MySQL.
 * No crea tablas, no migra el esquema y no inserta datos al iniciar.
 */
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config({ quiet: true }); // Las credenciales quedan en .env, no en el código.
process.env.TZ = process.env.TZ || "America/Argentina/Buenos_Aires";

const db = mysql.createPool({
  host: process.env.db_host || "localhost",
  port: Number(process.env.db_port || 3306),
  user: process.env.db_user,
  password: process.env.db_password,
  database: process.env.db_name,
  dateStrings: true, // DATE y TIME llegan como texto; evita conversiones de zona horaria.
  connectionLimit: 10, // Reutiliza hasta diez conexiones, en lugar de abrir una por consulta.
});

export default db;
