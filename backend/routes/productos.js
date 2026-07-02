const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');

// Listar todos los productos
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM productos ORDER BY nombre ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un producto
router.post('/', async (req, res) => {
  const { nombre, categoria, precio, stock, stock_minimo } = req.body;
  if (!nombre || precio === undefined) {
    return res.status(400).json({ error: 'El nombre y el precio son obligatorios' });
  }
  try {
    const { rows } = await pool.query(
      `INSERT INTO productos (nombre, categoria, precio, stock, stock_minimo)
       VALUES ($1, $2, $3, COALESCE($4, 0), COALESCE($5, 5))
       RETURNING *`,
      [nombre, categoria, precio, stock, stock_minimo]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar un producto (incluye ajustes de stock)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, categoria, precio, stock, stock_minimo } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE productos SET nombre = $1, categoria = $2, precio = $3, stock = $4, stock_minimo = $5
       WHERE id = $6 RETURNING *`,
      [nombre, categoria, precio, stock, stock_minimo, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un producto
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM productos WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
