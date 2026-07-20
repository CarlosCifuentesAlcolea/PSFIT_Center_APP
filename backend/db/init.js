require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function init() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const sentencias = schema
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const sentencia of sentencias) {
    try {
      await pool.query(sentencia);
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') continue; // el indice ya existe
      throw err;
    }
  }
  console.log('Base de datos inicializada correctamente.');

  const { rows } = await pool.query('SELECT COUNT(*) AS count FROM socios');
  if (parseInt(rows[0].count, 10) === 0) {
    console.log('Insertando datos de ejemplo...');
    await pool.query(`
      INSERT INTO socios (nombre, email, telefono, plan, estado, proximo_pago) VALUES
      ('Laura Ibanez', 'laura@example.com', '600111222', 'mensual', 'al_dia', CURDATE() + INTERVAL 12 DAY),
      ('Pedro Salas', 'pedro@example.com', '600333444', 'anual', 'al_dia', CURDATE() + INTERVAL 8 MONTH),
      ('David Roca', 'david@example.com', '600555666', 'mensual', 'pendiente', CURDATE())
    `);
    await pool.query(`
      INSERT INTO productos (nombre, categoria, precio, stock, stock_minimo) VALUES
      ('Proteina vainilla 1kg', 'Suplementos', 28.00, 2, 5),
      ('Shaker 600ml', 'Accesorios', 6.50, 1, 5),
      ('Toalla microfibra', 'Accesorios', 9.90, 18, 5)
    `);
    await pool.query(`
      INSERT INTO movimientos (tipo, concepto, importe, fecha) VALUES
      ('ingreso', 'Cuotas mensuales', 1980.00, CURDATE()),
      ('gasto', 'Reposicion suplementos', 410.00, CURDATE() - INTERVAL 2 DAY),
      ('gasto', 'Mantenimiento maquinas', 450.00, CURDATE() - INTERVAL 4 DAY)
    `);      
    console.log('Datos de ejemplo insertados.');
  }

  const { rows: usuariosExistentes } = await pool.query('SELECT COUNT(*) AS count FROM usuarios');
  if (parseInt(usuariosExistentes[0].count, 10) === 0) {
    const email = process.env.ADMIN_EMAIL || 'admin@psfit.local';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, 'admin')`,
      ['Administrador', email, passwordHash]
    );
    console.log(`Usuario admin creado -> email: ${email} / password: ${password}`);
    console.log('Define ADMIN_EMAIL y ADMIN_PASSWORD en .env para usar otras credenciales. Cambia la contrasena tras el primer inicio de sesion.');
  }

  await pool.end();
}

init().catch((err) => {
  console.error('Error al inicializar la base de datos:', err);
  process.exit(1);
});
