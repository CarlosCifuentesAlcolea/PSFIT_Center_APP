const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

const CAMPOS_TEXTO = [
  'nombre_rutina', 'edad', 'peso', 'altura', 'fecha_inicio', 'fecha_fin',
  'patologias', 'dias_entrenamiento', 'objetivo', 'calentamiento'
];

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

function parseRutina(row) {
  let bloques = [];
  try {
    bloques = row.bloques ? JSON.parse(row.bloques) : [];
  } catch {
    bloques = [];
  }
  return {
    ...row,
    bloques,
    fecha_inicio: formatFechaLocal(row.fecha_inicio),
    fecha_fin: formatFechaLocal(row.fecha_fin)
  };
}

// Listar rutinas. Con ?socio_id=: solo las de ese socio. Sin filtro: todas
// (para la vista global del apartado Rutinas).
router.get('/', async (req, res) => {
  const { socio_id } = req.query;
  try {
    const { rows } = socio_id
      ? await pool.query('SELECT * FROM rutinas WHERE socio_id = ? ORDER BY created_at DESC', [socio_id])
      : await pool.query('SELECT * FROM rutinas ORDER BY created_at DESC');
    res.json(rows.map(parseRutina));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear una rutina para un socio. La fecha de inicio es obligatoria; el resto
// de campos son texto libre, y bloques es la estructura dia/bloque + ejercicios.
router.post('/', async (req, res) => {
  const { socio_id, fecha_inicio, fecha_fin, bloques } = req.body;
  if (!socio_id) return res.status(400).json({ error: 'socio_id es obligatorio' });
  if (!fecha_inicio) return res.status(400).json({ error: 'La fecha de inicio es obligatoria' });
  if (!fecha_fin) return res.status(400).json({ error: 'La fecha de finalización es obligatoria' });
  try {
    const valores = CAMPOS_TEXTO.map((campo) => req.body[campo]);
    const { insertId } = await pool.query(
      `INSERT INTO rutinas (socio_id, ${CAMPOS_TEXTO.join(', ')}, bloques)
       VALUES (?, ${CAMPOS_TEXTO.map(() => '?').join(', ')}, ?)`,
      [socio_id, ...valores, JSON.stringify(bloques || [])]
    );
    const { rows } = await pool.query('SELECT * FROM rutinas WHERE id = ?', [insertId]);
    res.status(201).json(parseRutina(rows[0]));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar una rutina existente
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { fecha_inicio, fecha_fin, bloques } = req.body;
  if (!fecha_inicio) return res.status(400).json({ error: 'La fecha de inicio es obligatoria' });
  if (!fecha_fin) return res.status(400).json({ error: 'La fecha de finalización es obligatoria' });
  try {
    const valores = CAMPOS_TEXTO.map((campo) => req.body[campo]);
    const { affectedRows } = await pool.query(
      `UPDATE rutinas SET ${CAMPOS_TEXTO.map((c) => `${c} = ?`).join(', ')}, bloques = ? WHERE id = ?`,
      [...valores, JSON.stringify(bloques || []), id]
    );
    if (affectedRows === 0) return res.status(404).json({ error: 'Rutina no encontrada' });
    const { rows } = await pool.query('SELECT * FROM rutinas WHERE id = ?', [id]);
    res.json(parseRutina(rows[0]));
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
