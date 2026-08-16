const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');

// Listar tipos de ejercicio (cualquier usuario autenticado, hace falta para
// rellenar el desplegable al construir una rutina)
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM tipos_ejercicio ORDER BY nombre ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un tipo de ejercicio (solo admin)
router.post('/', requireAdmin, async (req, res) => {
  const { nombre } = req.body;
  if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
  try {
    const { insertId } = await pool.query('INSERT INTO tipos_ejercicio (nombre) VALUES (?)', [nombre.trim()]);
    const { rows } = await pool.query('SELECT * FROM tipos_ejercicio WHERE id = ?', [insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un ejercicio con ese nombre' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Editar (renombrar) un tipo de ejercicio (solo admin)
router.put('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;
  if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
  try {
    const { affectedRows } = await pool.query('UPDATE tipos_ejercicio SET nombre = ? WHERE id = ?', [nombre.trim(), id]);
    if (affectedRows === 0) return res.status(404).json({ error: 'Ejercicio no encontrado' });
    const { rows } = await pool.query('SELECT * FROM tipos_ejercicio WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe un ejercicio con ese nombre' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un tipo de ejercicio (solo admin). No afecta a las rutinas ya
// guardadas: el nombre del ejercicio queda tal cual quedo registrado en ellas.
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM tipos_ejercicio WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
