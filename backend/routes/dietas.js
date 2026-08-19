const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

const CAMPOS_TEXTO = ['nombre_dieta', 'fecha_inicio', 'fecha_fin', 'objetivo', 'contenido'];

// mysql2 devuelve las columnas DATE como objetos Date construidos en la zona
// horaria local del proceso. Usar los getters locales (no UTC) para volver a
// 'YYYY-MM-DD' evita el desfase de un dia que da JSON.stringify (que normaliza a UTC).
function formatFechaLocal(valor) {
  if (!valor) return null;
  const d = new Date(valor);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

function parseDieta(row) {
  return {
    ...row,
    fecha_inicio: formatFechaLocal(row.fecha_inicio),
    fecha_fin: formatFechaLocal(row.fecha_fin)
  };
}

// Listar dietas. Con ?socio_id=: solo las de ese socio. Sin filtro: todas
// (para la vista global del apartado Dietas).
router.get('/', async (req, res) => {
  const { socio_id } = req.query;
  try {
    const { rows } = socio_id
      ? await pool.query('SELECT * FROM dietas WHERE socio_id = ? ORDER BY created_at DESC', [socio_id])
      : await pool.query('SELECT * FROM dietas ORDER BY created_at DESC');
    res.json(rows.map(parseDieta));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear una dieta para un socio. La fecha de inicio es obligatoria; el resto
// de campos son texto libre.
router.post('/', async (req, res) => {
  const { socio_id, fecha_inicio } = req.body;
  if (!socio_id) return res.status(400).json({ error: 'socio_id es obligatorio' });
  if (!fecha_inicio) return res.status(400).json({ error: 'La fecha de inicio es obligatoria' });
  try {
    const valores = CAMPOS_TEXTO.map((campo) => req.body[campo]);
    const { insertId } = await pool.query(
      `INSERT INTO dietas (socio_id, ${CAMPOS_TEXTO.join(', ')}) VALUES (?, ${CAMPOS_TEXTO.map(() => '?').join(', ')})`,
      [socio_id, ...valores]
    );
    const { rows } = await pool.query('SELECT * FROM dietas WHERE id = ?', [insertId]);
    res.status(201).json(parseDieta(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar una dieta existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { fecha_inicio } = req.body;
  if (!fecha_inicio) return res.status(400).json({ error: 'La fecha de inicio es obligatoria' });
  try {
    const valores = CAMPOS_TEXTO.map((campo) => req.body[campo]);
    const { affectedRows } = await pool.query(
      `UPDATE dietas SET ${CAMPOS_TEXTO.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
      [...valores, id]
    );
    if (affectedRows === 0) return res.status(404).json({ error: 'Dieta no encontrada' });
    const { rows } = await pool.query('SELECT * FROM dietas WHERE id = ?', [id]);
    res.json(parseDieta(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar una dieta
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM dietas WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
