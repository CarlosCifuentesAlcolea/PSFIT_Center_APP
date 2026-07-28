const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');
const { calcularProximoPago } = require('../lib/fechas');

const PLANES_VALIDOS = ['mensual', 'trimestral', 'anual'];

// Listar todos los socios
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM socios ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un socio. Si es "diario" (visita de un dia), no lleva plan ni proximo_pago,
// y en su lugar registra directamente el ingreso en contabilidad.
router.post('/', async (req, res) => {
  const { nombre, email, telefono, plan, diario, importe } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

  if (diario) {
    if (importe === undefined || importe === null || isNaN(parseFloat(importe))) {
      return res.status(400).json({ error: 'El importe es obligatorio para un visitante diario' });
    }
    try {
      const resultado = await pool.transaction(async (query) => {
        const { insertId } = await query(
          `INSERT INTO socios (nombre, email, telefono, plan, estado, diario, proximo_pago)
           VALUES (?, ?, ?, 'diario', 'al_dia', TRUE, NULL)`,
          [nombre, email, telefono]
        );
        await query(
          `INSERT INTO movimientos (tipo, concepto, importe, socio_id) VALUES ('ingreso', ?, ?, ?)`,
          [`Visita diaria - ${nombre}`, parseFloat(importe).toFixed(2), insertId]
        );
        const { rows } = await query('SELECT * FROM socios WHERE id = ?', [insertId]);
        return rows[0];
      });
      return res.status(201).json(resultado);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const planFinal = PLANES_VALIDOS.includes(plan) ? plan : 'mensual';
  try {
    const proximoPago = calcularProximoPago(planFinal);
    const { insertId } = await pool.query(
      `INSERT INTO socios (nombre, email, telefono, plan, estado, proximo_pago)
       VALUES (?, ?, ?, ?, 'al_dia', ?)`,
      [nombre, email, telefono, planFinal, proximoPago]
    );
    const { rows } = await pool.query('SELECT * FROM socios WHERE id = ?', [insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar los datos basicos de un socio (nombre, contacto, plan).
// El estado y el proximo pago no se editan a mano: van por /pagar y por la revision automatica.
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, email, telefono, plan } = req.body;
  try {
    const { affectedRows } = await pool.query(
      `UPDATE socios SET nombre = ?, email = ?, telefono = ?, plan = COALESCE(?, plan) WHERE id = ?`,
      [nombre, email, telefono, plan, id]
    );
    if (affectedRows === 0) return res.status(404).json({ error: 'Socio no encontrado' });
    const { rows } = await pool.query('SELECT * FROM socios WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marcar un socio como pagado: pone estado al_dia y calcula el nuevo proximo_pago
// (a primeros de mes, contando desde la fecha de pago actual o desde su vencimiento
// si todavia no habia llegado, lo que sea mas tarde).
router.post('/:id/pagar', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM socios WHERE id = ?', [id]);
    const socio = rows[0];
    if (!socio) return res.status(404).json({ error: 'Socio no encontrado' });
    if (socio.diario) return res.status(400).json({ error: 'Un visitante diario no tiene cuota que renovar' });

    const hoy = new Date();
    const vencimientoActual = socio.proximo_pago ? new Date(socio.proximo_pago) : hoy;
    const desde = vencimientoActual > hoy ? vencimientoActual : hoy;
    const nuevoProximoPago = calcularProximoPago(socio.plan, desde);

    await pool.query(
      `UPDATE socios SET estado = 'al_dia', proximo_pago = ?, aviso_vencimiento_enviado = FALSE WHERE id = ?`,
      [nuevoProximoPago, id]
    );
    const { rows: actualizado } = await pool.query('SELECT * FROM socios WHERE id = ?', [id]);
    res.json(actualizado[0]);
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
