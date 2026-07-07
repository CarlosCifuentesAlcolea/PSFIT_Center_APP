const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');

// Listar todos los socios
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM socios ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un socio
router.post('/', async (req, res) => {
  const { nombre, email, telefono, plan, estado, proximo_pago } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  try {
    const { insertId } = await pool.query(
      `INSERT INTO socios (nombre, email, telefono, plan, estado, proximo_pago)
       VALUES (?, ?, ?, COALESCE(?, 'mensual'), COALESCE(?, 'al_dia'), ?)`,
      [nombre, email, telefono, plan, estado, proximo_pago]
    );
    const { rows } = await pool.query('SELECT * FROM socios WHERE id = ?', [insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar un socio
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, email, telefono, plan, estado, proximo_pago } = req.body;
  try {
    const { affectedRows } = await pool.query(
      `UPDATE socios SET nombre = ?, email = ?, telefono = ?, plan = ?,
       estado = COALESCE(?, estado), proximo_pago = COALESCE(?, proximo_pago)
       WHERE id = ?`,
      [nombre, email, telefono, plan, estado, proximo_pago, id]
    );
    if (affectedRows === 0) return res.status(404).json({ error: 'Socio no encontrado' });
    const { rows } = await pool.query('SELECT * FROM socios WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un socio
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM socios WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
