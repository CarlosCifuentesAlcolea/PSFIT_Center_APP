const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Resumen para el panel principal
router.get('/', async (req, res) => {
  try {
    const socios = await pool.query(
      "SELECT COUNT(*) AS count FROM socios WHERE estado != 'baja' AND diario = FALSE"
    );
    const ingresos = await pool.query(
      `SELECT COALESCE(SUM(importe), 0) AS total FROM movimientos
       WHERE tipo = 'ingreso' AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())`
    );
    const gastos = await pool.query(
      `SELECT COALESCE(SUM(importe), 0) AS total FROM movimientos
       WHERE tipo = 'gasto' AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())`
    );
    const stockBajo = await pool.query(
      'SELECT * FROM productos WHERE stock <= stock_minimo ORDER BY stock ASC'
    );
    const ultimosSocios = await pool.query(
      'SELECT * FROM socios ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      socios_activos: parseInt(socios.rows[0].count, 10),
      ingresos_mes: parseFloat(ingresos.rows[0].total),
      gastos_mes: parseFloat(gastos.rows[0].total),
      stock_bajo: stockBajo.rows,
      ultimos_socios: ultimosSocios.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
