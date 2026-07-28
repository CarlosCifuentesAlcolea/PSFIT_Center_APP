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
  const { nombre, marca, categoria, precio, stock, stock_minimo } = req.body;
  if (!nombre || precio === undefined) {
    return res.status(400).json({ error: 'El nombre y el precio son obligatorios' });
  }
  if (stock !== undefined && stock < 0) {
    return res.status(400).json({ error: 'El stock no puede ser negativo' });
  }
  if (stock_minimo !== undefined && stock_minimo < 0) {
    return res.status(400).json({ error: 'El stock minimo no puede ser negativo' });
  }
  try {
    const { insertId } = await pool.query(
      `INSERT INTO productos (nombre, marca, categoria, precio, stock, stock_minimo)
       VALUES (?, ?, ?, ?, COALESCE(?, 0), COALESCE(?, 5))`,
      [nombre, marca, categoria, precio, stock, stock_minimo]
    );
    const { rows } = await pool.query('SELECT * FROM productos WHERE id = ?', [insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar un producto (incluye ajustes de stock)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, marca, categoria, precio, stock, stock_minimo } = req.body;
  if (stock !== undefined && stock < 0) {
    return res.status(400).json({ error: 'El stock no puede ser negativo' });
  }
  if (stock_minimo !== undefined && stock_minimo < 0) {
    return res.status(400).json({ error: 'El stock minimo no puede ser negativo' });
  }
  try {
    const { affectedRows } = await pool.query(
      `UPDATE productos SET nombre = ?, marca = ?, categoria = ?, precio = ?, stock = ?, stock_minimo = ?
       WHERE id = ?`,
      [nombre, marca, categoria, precio, stock, stock_minimo, id]
    );
    if (affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    const { rows } = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vender unidades de un producto: descuenta stock y genera el ingreso en contabilidad
router.post('/:id/vender', async (req, res) => {
  const { id } = req.params;
  const cantidad = parseInt(req.body.cantidad, 10);
  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'La cantidad debe ser un numero mayor que 0' });
  }
  try {
    const resultado = await pool.transaction(async (query) => {
      const { rows } = await query('SELECT * FROM productos WHERE id = ? FOR UPDATE', [id]);
      const producto = rows[0];
      if (!producto) {
        const err = new Error('Producto no encontrado');
        err.status = 404;
        throw err;
      }
      if (producto.stock < cantidad) {
        const err = new Error(`Stock insuficiente (quedan ${producto.stock} uds.)`);
        err.status = 400;
        throw err;
      }

      await query('UPDATE productos SET stock = stock - ? WHERE id = ?', [cantidad, id]);
      const importe = (parseFloat(producto.precio) * cantidad).toFixed(2);
      await query(
        `INSERT INTO movimientos (tipo, concepto, importe, producto_id, cantidad)
         VALUES ('ingreso', ?, ?, ?, ?)`,
        [`Venta de ${cantidad} x ${producto.nombre}`, importe, id, cantidad]
      );

      const { rows: actualizado } = await query('SELECT * FROM productos WHERE id = ?', [id]);
      return actualizado[0];
    });
    res.json(resultado);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Reponer stock de un producto: suma stock y genera el gasto en contabilidad
router.post('/:id/reponer', async (req, res) => {
  const { id } = req.params;
  const cantidad = parseInt(req.body.cantidad, 10);
  const costo = parseFloat(req.body.costo);
  if (!cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'La cantidad debe ser un numero mayor que 0' });
  }
  if (isNaN(costo) || costo < 0) {
    return res.status(400).json({ error: 'El costo debe ser un numero valido' });
  }
  try {
    const resultado = await pool.transaction(async (query) => {
      const { rows } = await query('SELECT * FROM productos WHERE id = ? FOR UPDATE', [id]);
      const producto = rows[0];
      if (!producto) {
        const err = new Error('Producto no encontrado');
        err.status = 404;
        throw err;
      }

      await query('UPDATE productos SET stock = stock + ? WHERE id = ?', [cantidad, id]);
      await query(
        `INSERT INTO movimientos (tipo, concepto, importe, producto_id, cantidad)
         VALUES ('gasto', ?, ?, ?, ?)`,
        [`Reposición de ${cantidad} x ${producto.nombre}`, costo.toFixed(2), id, cantidad]
      );

      const { rows: actualizado } = await query('SELECT * FROM productos WHERE id = ?', [id]);
      return actualizado[0];
    });
    res.json(resultado);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Eliminar un producto
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
