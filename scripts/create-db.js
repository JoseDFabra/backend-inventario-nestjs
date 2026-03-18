/**
 * Crea la base de datos indicada en DB_NAME si no existe.
 * Se conecta a la base "postgres" (siempre existe en Aurora/RDS) y ejecuta CREATE DATABASE.
 *
 * Uso: con el .env configurado (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL...)
 *   node scripts/create-db.js
 *
 * Útil cuando Aurora está recién creada y aún no existe la base de la app.
 */
require('dotenv').config();
const { Client } = require('pg');

const DB_NAME = process.env.DB_NAME || 'inventory';

// Solo caracteres seguros para el nombre de la base
if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(DB_NAME)) {
  console.error('DB_NAME inválido (solo letras, números y _):', DB_NAME);
  process.exit(1);
}

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: 'postgres',
  ssl: process.env.DB_SSL === 'true' || process.env.DB_SSL === '1'
    ? { rejectUnauthorized: true }
    : false,
});

async function main() {
  try {
    await client.connect();
    const res = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [DB_NAME],
    );
    if (res.rows.length > 0) {
      console.log(`La base de datos "${DB_NAME}" ya existe.`);
      return;
    }
    await client.query(`CREATE DATABASE "${DB_NAME.replace(/"/g, '""')}"`);
    console.log(`Base de datos "${DB_NAME}" creada correctamente.`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
