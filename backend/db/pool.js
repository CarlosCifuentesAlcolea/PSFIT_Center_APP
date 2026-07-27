const mysql = require('mysql2/promise');

// XAMPP en local no usa SSL; los proveedores en la nube (Aiven, PlanetScale, Railway...)
// lo exigen. Se activa automaticamente salvo que la conexion sea a localhost/127.0.0.1.
const esLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '');

const rawPool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  charset: 'utf8mb4',
  ssl: esLocal ? undefined : { rejectUnauthorized: false }
});

// Normaliza la respuesta de mysql2 para que el resto del codigo pueda hacer
// siempre `const { rows } = await pool.query(...)` como con un SELECT,
// y ademas disponer de insertId/affectedRows cuando la sentencia es un INSERT/UPDATE.
async function query(sql, params) {
  // mysql2 rechaza parametros "undefined" (a diferencia de pg, que los trataba como NULL)
  const valores = params && params.map((v) => (v === undefined ? null : v));
  const [result] = await rawPool.query(sql, valores);
  if (Array.isArray(result)) return { rows: result };
  return { rows: [], insertId: result.insertId, affectedRows: result.affectedRows };
}

// Ejecuta varias queries como una sola transaccion (todo o nada).
// fn recibe una funcion `query` igual que la de arriba, pero ligada a la misma conexion.
async function transaction(fn) {
  const conn = await rawPool.getConnection();
  try {
    await conn.beginTransaction();
    const queryEnTransaccion = async (sql, params) => {
      const valores = params && params.map((v) => (v === undefined ? null : v));
      const [result] = await conn.query(sql, valores);
      if (Array.isArray(result)) return { rows: result };
      return { rows: [], insertId: result.insertId, affectedRows: result.affectedRows };
    };
    const resultado = await fn(queryEnTransaccion);
    await conn.commit();
    return resultado;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { query, transaction, end: () => rawPool.end() };
