const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAdmin } = require('../middleware/auth');
const { calcularProximoPago } = require('../lib/fechas');
const { validarDni } = require('../lib/dni');

const PLANES_VALIDOS = ['mensual', 'trimestral', 'anual'];
const METODOS_PAGO_VALIDOS = ['efectivo', 'tarjeta'];

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
  const { nombre, dni, email, telefono, observaciones, plan, diario, importe, metodo_pago } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  if (dni && !validarDni(dni)) {
    return res.status(400).json({ error: 'El DNI no es válido' });
  }

  if (diario) {
    if (importe === undefined || importe === null || isNaN(parseFloat(importe))) {
      return res.status(400).json({ error: 'El importe es obligatorio para un visitante diario' });
    }
    if (!METODOS_PAGO_VALIDOS.includes(metodo_pago)) {
      return res.status(400).json({ error: "metodo_pago debe ser 'efectivo' o 'tarjeta'" });
    }
    try {
      const resultado = await pool.transaction(async (query) => {
        const { insertId } = await query(
          `INSERT INTO socios (nombre, dni, email, telefono, observaciones, plan, estado, diario, proximo_pago)
           VALUES (?, ?, ?, ?, ?, 'diario', 'al_dia', TRUE, NULL)`,
          [nombre, dni, email, telefono, observaciones]
        );
        await query(
          `INSERT INTO movimientos (tipo, concepto, importe, metodo_pago, socio_id) VALUES ('ingreso', ?, ?, ?, ?)`,
          [`Visita diaria - ${nombre}`, parseFloat(importe).toFixed(2), metodo_pago, insertId]
        );
        const { rows } = await query('SELECT * FROM socios WHERE id = ?', [insertId]);
        return rows[0];
      });
      return res.status(201).json(resultado);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  const hayPagoInicial = importe !== undefined && importe !== null && importe !== '';
  if (hayPagoInicial) {
    if (isNaN(parseFloat(importe))) {
      return res.status(400).json({ error: 'El importe del pago inicial no es valido' });
    }
    if (!METODOS_PAGO_VALIDOS.includes(metodo_pago)) {
      return res.status(400).json({ error: "metodo_pago debe ser 'efectivo' o 'tarjeta'" });
    }
  }

  const planFinal = PLANES_VALIDOS.includes(plan) ? plan : 'mensual';
  try {
    // Sin pago inicial, el socio queda pendiente de pagar desde hoy; con pago inicial,
    // ya está al dia y el proximo vencimiento se cuenta un periodo completo despues.
    const estadoInicial = hayPagoInicial ? 'al_dia' : 'pendiente';
    const proximoPago = hayPagoInicial ? calcularProximoPago(planFinal) : new Date().toISOString().slice(0, 10);
    const resultado = await pool.transaction(async (query) => {
      const { insertId } = await query(
        `INSERT INTO socios (nombre, dni, email, telefono, observaciones, plan, estado, proximo_pago)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [nombre, dni, email, telefono, observaciones, planFinal, estadoInicial, proximoPago]
      );
      if (hayPagoInicial) {
        await query(
          `INSERT INTO movimientos (tipo, concepto, importe, metodo_pago, socio_id) VALUES ('ingreso', ?, ?, ?, ?)`,
          [`Cuota ${planFinal} - ${nombre}`, parseFloat(importe).toFixed(2), metodo_pago, insertId]
        );
      }
      const { rows } = await query('SELECT * FROM socios WHERE id = ?', [insertId]);
      return rows[0];
    });
    res.status(201).json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar los datos basicos de un socio (nombre, contacto, plan, dni, observaciones).
// El estado y el proximo pago no se editan a mano: van por /pagar y por la revision automatica.
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, dni, email, telefono, observaciones, plan } = req.body;
  if (dni && !validarDni(dni)) {
    return res.status(400).json({ error: 'El DNI no es válido' });
  }
  try {
    const { affectedRows } = await pool.query(
      `UPDATE socios SET nombre = ?, dni = ?, email = ?, telefono = ?, observaciones = ?, plan = COALESCE(?, plan) WHERE id = ?`,
      [nombre, dni, email, telefono, observaciones, plan, id]
    );
    if (affectedRows === 0) return res.status(404).json({ error: 'Socio no encontrado' });
    const { rows } = await pool.query('SELECT * FROM socios WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marcar un socio como pagado: pone estado al_dia, calcula el nuevo proximo_pago
// (a primeros de mes, contando desde la fecha de pago actual o desde su vencimiento
// si todavia no habia llegado, lo que sea mas tarde) y registra el ingreso en contabilidad.
router.post('/:id/pagar', async (req, res) => {
  const { id } = req.params;
  const { importe, metodo_pago } = req.body;
  if (importe === undefined || importe === null || isNaN(parseFloat(importe))) {
    return res.status(400).json({ error: 'El importe es obligatorio' });
  }
  if (!METODOS_PAGO_VALIDOS.includes(metodo_pago)) {
    return res.status(400).json({ error: "metodo_pago debe ser 'efectivo' o 'tarjeta'" });
  }
  try {
    const resultado = await pool.transaction(async (query) => {
      const { rows } = await query('SELECT * FROM socios WHERE id = ? FOR UPDATE', [id]);
      const socio = rows[0];
      if (!socio) {
        const err = new Error('Socio no encontrado');
        err.status = 404;
        throw err;
      }
      if (socio.diario) {
        const err = new Error('Un visitante diario no tiene cuota que renovar');
        err.status = 400;
        throw err;
      }

      const hoy = new Date();
      const vencimientoActual = socio.proximo_pago ? new Date(socio.proximo_pago) : hoy;
      const desde = vencimientoActual > hoy ? vencimientoActual : hoy;
      const nuevoProximoPago = calcularProximoPago(socio.plan, desde);

      await query(
        `UPDATE socios SET estado = 'al_dia', proximo_pago = ?, aviso_vencimiento_enviado = FALSE WHERE id = ?`,
        [nuevoProximoPago, id]
      );
      await query(
        `INSERT INTO movimientos (tipo, concepto, importe, metodo_pago, socio_id)
         VALUES ('ingreso', ?, ?, ?, ?)`,
        [`Cuota ${socio.plan} - ${socio.nombre}`, parseFloat(importe).toFixed(2), metodo_pago, id]
      );

      const { rows: actualizado } = await query('SELECT * FROM socios WHERE id = ?', [id]);
      return actualizado[0];
    });
    res.json(resultado);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
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
