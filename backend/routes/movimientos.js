const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');

// Listar movimientos. Sin filtros: ultimos 100. Con ?year (y opcional ?month): todo ese periodo.
router.get('/', async (req, res) => {
  const { year, month } = req.query;
  try {
    let sql = 'SELECT * FROM movimientos';
    const params = [];
    if (year) {
      sql += ' WHERE YEAR(fecha) = ?';
      params.push(year);
      if (month) {
        sql += ' AND MONTH(fecha) = ?';
        params.push(month);
      }
    }
    sql += ' ORDER BY fecha DESC, created_at DESC';
    if (!year) sql += ' LIMIT 100';
    const { rows } = await pool.query(sql, params);
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
    const { insertId } = await pool.query(
      `INSERT INTO movimientos (tipo, concepto, importe, fecha, socio_id, producto_id)
       VALUES (?, ?, ?, COALESCE(?, CURRENT_DATE), ?, ?)`,
      [tipo, concepto, importe, fecha, socio_id, producto_id]
    );
    const { rows } = await pool.query('SELECT * FROM movimientos WHERE id = ?', [insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un movimiento. Si venia de una venta o reposicion de producto,
// revierte el efecto que tuvo sobre el stock (todo o nada, en una transaccion).
router.delete('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.transaction(async (query) => {
      const { rows } = await query('SELECT * FROM movimientos WHERE id = ?', [id]);
      const movimiento = rows[0];
      if (!movimiento) return; // ya no existe, nada que hacer

      if (movimiento.producto_id && movimiento.cantidad) {
        if (movimiento.tipo === 'ingreso') {
          // era una venta: devolver las unidades al stock
          await query('UPDATE productos SET stock = stock + ? WHERE id = ?', [movimiento.cantidad, movimiento.producto_id]);
        } else {
          // era una reposicion: quitar las unidades que se habian sumado, sin bajar de 0
          await query(
            'UPDATE productos SET stock = GREATEST(stock - ?, 0) WHERE id = ?',
            [movimiento.cantidad, movimiento.producto_id]
          );
        }
      }

      await query('DELETE FROM movimientos WHERE id = ?', [id]);
    });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
