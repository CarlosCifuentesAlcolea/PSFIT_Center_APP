const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');

// Listar movimientos (con filtro opcional de mes actual)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM movimientos ORDER BY fecha DESC, created_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar un ingreso o gasto
router.post('/', async (req, res) => {
  const { tipo, concepto, importe, fecha, socio_id, producto_id } = req.body;
  if (!tipo || !concepto || importe === undefined) {
    return res.status(400).json({ error: 'tipo, concepto e importe son obligatorios' });
  }
  if (!['ingreso', 'gasto'].includes(tipo)) {
    return res.status(400).json({ error: "tipo debe ser 'ingreso' o 'gasto'" });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO movimientos (tipo, concepto, importe, fecha, socio_id, producto_id)
       VALUES ($1, $2, $3, COALESCE($4, CURRENT_DATE), $5, $6)
       RETURNING *`,
      [tipo, concepto, importe, fecha, socio_id, producto_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un movimiento
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM movimientos WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
