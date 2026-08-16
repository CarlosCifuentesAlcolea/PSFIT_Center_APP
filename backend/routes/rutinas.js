const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

const CAMPOS_TEXTO = [
  'nombre_rutina', 'edad', 'peso', 'altura', 'fecha_inicio', 'fecha_fin',
  'patologias', 'dias_entrenamiento', 'objetivo', 'contenido'
];

// Listar las rutinas de un socio (obligatorio pasar ?socio_id=)
router.get('/', async (req, res) => {
  const { socio_id } = req.query;
  if (!socio_id) return res.status(400).json({ error: 'socio_id es obligatorio' });
  try {
    const { rows } = await pool.query(
      'SELECT * FROM rutinas WHERE socio_id = ? ORDER BY created_at DESC',
      [socio_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear una rutina para un socio. Todos los campos salvo socio_id son texto libre.
router.post('/', async (req, res) => {
  const { socio_id } = req.body;
  if (!socio_id) return res.status(400).json({ error: 'socio_id es obligatorio' });
  try {
    const valores = CAMPOS_TEXTO.map((campo) => req.body[campo]);
    const { insertId } = await pool.query(
      `INSERT INTO rutinas (socio_id, ${CAMPOS_TEXTO.join(', ')})
       VALUES (?, ${CAMPOS_TEXTO.map(() => '?').join(', ')})`,
      [socio_id, ...valores]
    );
    const { rows } = await pool.query('SELECT * FROM rutinas WHERE id = ?', [insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar una rutina existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const valores = CAMPOS_TEXTO.map((campo) => req.body[campo]);
    const { affectedRows } = await pool.query(
      `UPDATE rutinas SET ${CAMPOS_TEXTO.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
      [...valores, id]
    );
    if (affectedRows === 0) return res.status(404).json({ error: 'Rutina no encontrada' });
    const { rows } = await pool.query('SELECT * FROM rutinas WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar una rutina
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM rutinas WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
