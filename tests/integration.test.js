/**
 * Prueba de integración con MySQL real, pero en una base temporal vacía.
 * Nunca escribe datos en barbershop. Usa únicamente sus credenciales de conexión.
 * finally borra la base de prueba y cierra los recursos incluso si falla un assert.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { once } from "node:events";
dotenv.config({ quiet: true });

test("Esquema original: alta, concurrencia, modificación y borrado en una base desechable", async () => {
  const testName = "barberia_pruebas_" + process.pid;
  const admin = await mysql.createConnection({
    host: process.env.db_host,
    user: process.env.db_user,
    password: process.env.db_password,
    port: Number(process.env.db_port || 3306),
    multipleStatements: true,
  });
  let server, db;
  try {
    await admin.query("CREATE DATABASE " + mysql.escapeId(testName));
    await admin.changeUser({ database: testName });
    await admin.query(
      await fs.readFile(new URL("../db/database.sql", import.meta.url), "utf8"),
    );
    await admin.query("INSERT INTO configuracion VALUES (2,'Prueba',30)");
    for (let day = 0; day < 7; day++)
      await admin.query(
        "INSERT INTO horarios (dia_semana,trabaja,hora_apertura,hora_cierre,pausa_inicio,pausa_fin) VALUES (?,1,'09:00','20:00','13:00','16:00')",
        [day],
      );
    process.env.db_name = testName;
    const { app } = await import("../app.js");
    db = (await import("../config/db.js")).default;
    const { fechaLocal } = await import("../models/reglas.js");
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const base = "http://127.0.0.1:" + server.address().port + "/api";
    async function call(path, method = "GET", body) {
      const r = await fetch(base + path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      return { status: r.status, data: await r.json() };
    }
    const config = (await call("/configuracion")).data;
    assert.equal(config.nombre_negocio, "Prueba");
    const next = new Date();
    next.setDate(next.getDate() + 1);
    const fecha = fechaLocal(next);
    const body = {
      nombre_y_apellido: "Prueba",
      telefono: "",
      fecha,
      hora: "09:00",
    };
    const attempts = await Promise.all([
      call("/turnos", "POST", body),
      call("/turnos", "POST", body),
    ]);
    assert.deepEqual(attempts.map((r) => r.status).sort(), [201, 409]);
    const id = attempts.find((r) => r.status === 201).data.id;
    const [[count]] = await db.query("SELECT COUNT(*) total FROM usuarios");
    assert.equal(count.total, 1);
    assert.equal((await call("/turnos?fecha=" + fecha)).data.length, 1);
    assert.equal(
      (
        await call("/disponibilidad?fecha=" + fecha + "&excluir=" + id)
      ).data.find((r) => r.hora === "09:00").reservado,
      false,
    );
    assert.equal(
      (await call("/turnos/" + id, "PUT", { ...body, hora: "09:30" })).status,
      200,
    );
    assert.equal(
      (
        await call("/configuracion", "PUT", {
          ...config,
          nombre_negocio: "Nuevo nombre",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await call("/configuracion", "PUT", {
          ...config,
          duracion_turno_min: 45,
        })
      ).status,
      409,
    );
    const other = await call("/turnos", "POST", body);
    assert.equal(other.status, 201);
    assert.equal((await call("/turnos/" + id, "PUT", body)).status, 409);
    // Dos reservas del mismo cliente: editar una no modifica los datos de la otra.
    const [[owner]] = await db.query(
      "SELECT id_usuario FROM turnos WHERE id=?",
      [id],
    );
    await db.query(
      "INSERT INTO turnos (id_usuario,fecha,hora) VALUES (?,?,'10:00')",
      [owner.id_usuario, fecha],
    );
    assert.equal(
      (
        await call("/turnos/" + id, "PUT", {
          ...body,
          hora: "09:30",
          nombre_y_apellido: "Nombre nuevo",
        })
      ).status,
      200,
    );
    const [[original]] = await db.query(
      "SELECT nombre_y_apellido FROM usuarios WHERE id=?",
      [owner.id_usuario],
    );
    assert.equal(original.nombre_y_apellido, "Prueba");
    assert.equal((await call("/turnos/" + id, "DELETE")).status, 200);
    assert.equal((await call("/turnos/" + id, "DELETE")).status, 404);
    const [[preserved]] = await db.query(
      "SELECT COUNT(*) total FROM usuarios WHERE id=?",
      [owner.id_usuario],
    );
    assert.equal(preserved.total, 1);
    const [columns] = await db.query("SHOW COLUMNS FROM turnos");
    assert.deepEqual(
      columns.map((c) => c.Field),
      ["id", "id_usuario", "fecha", "hora"],
    );
  } finally {
    if (server) await new Promise((r) => server.close(r));
    if (db) await db.end();
    if (/^barberia_pruebas_\d+$/.test(testName))
      await admin.query("DROP DATABASE IF EXISTS " + mysql.escapeId(testName));
    await admin.end();
  }
});
