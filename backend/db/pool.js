const mysql = require('mysql2/promise');

const rawPool = mysql.createPool({ uri: process.env.DATABASE_URL, charset: 'utf8mb4' });

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

module.exports = { query, end: () => rawPool.end() };
