import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Modal from './Modal.jsx';

const CATEGORIAS = ['Suplementos', 'Accesorios', 'Alimentos', 'Otros'];

const VACIO = { nombre: '', marca: '', categoria: CATEGORIAS[0], precio: '', stock: '', stock_minimo: '' };

function formatEuros(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

export default function Productos({ usuario }) {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [modo, setModo] = useState(null); // 'crear' | 'editar' | 'vender' | 'reponer'
  const [activo, setActivo] = useState(null);
  const [form, setForm] = useState(VACIO);
  const [cantidad, setCantidad] = useState('');
  const [costo, setCosto] = useState('');

  function cargar() {
    api.getProductos().then(setProductos).catch((e) => setError(e.message));
  }

  useEffect(cargar, []);

  function cerrarModal() {
    setModo(null);
    setActivo(null);
    setError('');
  }

  function abrirCrear() {
    setForm(VACIO);
    setError('');
    setModo('crear');
  }

  function abrirEditar(p) {
    setActivo(p);
    setForm({
      nombre: p.nombre,
      marca: p.marca || '',
      categoria: p.categoria || CATEGORIAS[0],
      precio: p.precio,
      stock: p.stock,
      stock_minimo: p.stock_minimo
    });
    setError('');
    setModo('editar');
  }

  function abrirVender(p) {
    setActivo(p);
    setCantidad('');
    setError('');
    setModo('vender');
  }

  function abrirReponer(p) {
    setActivo(p);
    setCantidad('');
    setCosto('');
    setError('');
    setModo('reponer');
  }

  async function guardarProducto(e) {
    e.preventDefault();
    if (!form.nombre || !form.precio || guardando) return;
    const stock = parseInt(form.stock || '0', 10);
    const stockMinimo = parseInt(form.stock_minimo || '5', 10);
    if (stock < 0 || stockMinimo < 0) {
      setError('El stock y el stock mínimo no pueden ser negativos');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const datos = { ...form, precio: parseFloat(form.precio), stock, stock_minimo: stockMinimo };
      if (modo === 'editar') {
        await api.actualizarProducto(activo.id, datos);
      } else {
        await api.crearProducto(datos);
      }
      cerrarModal();
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarVenta(e) {
    e.preventDefault();
    const cant = parseInt(cantidad, 10);
    if (!cant || cant <= 0 || guardando) return;
    setGuardando(true);
    setError('');
    try {
      await api.venderProducto(activo.id, cant);
      cerrarModal();
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarReposicion(e) {
    e.preventDefault();
    const cant = parseInt(cantidad, 10);
    const cost = parseFloat(costo);
    if (!cant || cant <= 0 || isNaN(cost) || cost < 0 || guardando) return;
    setGuardando(true);
    setError('');
    try {
      await api.reponerProducto(activo.id, cant, cost);
      cerrarModal();
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    await api.eliminarProducto(id);
    cargar();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={abrirCrear} className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg">
          + Añadir producto
        </button>
      </div>

      {error && !modo && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-neutral-400 border-b border-neutral-200">
            <th className="py-2 font-normal">Producto</th>
            <th className="py-2 font-normal">Marca</th>
            <th className="py-2 font-normal">Categoría</th>
            <th className="py-2 font-normal">Stock</th>
            <th className="py-2 font-normal text-right">Precio</th>
            <th className="py-2 font-normal"></th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.id} className="border-b border-neutral-100">
              <td className="py-2.5">{p.nombre}</td>
              <td className="py-2.5 text-neutral-500">{p.marca || '—'}</td>
              <td className="py-2.5 text-neutral-500">{p.categoria || '—'}</td>
              <td className={`py-2.5 ${p.stock <= p.stock_minimo ? 'text-red-600' : ''}`}>
                {p.stock} uds.
              </td>
              <td className="py-2.5 text-right">{formatEuros(p.precio)}</td>
              <td className="py-2.5 text-right whitespace-nowrap">
                <button onClick={() => abrirVender(p)} className="text-neutral-400 hover:text-green-600 text-xs mr-2">
                  Vender
                </button>
                <button onClick={() => abrirReponer(p)} className="text-neutral-400 hover:text-brand-dark text-xs mr-2">
                  Reponer stock
                </button>
                <button onClick={() => abrirEditar(p)} className="text-neutral-400 hover:text-brand-dark text-xs mr-2">
                  Editar
                </button>
                {usuario.rol === 'admin' && (
                  <button onClick={() => eliminar(p.id)} className="text-neutral-400 hover:text-red-600 text-xs">
                    Eliminar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {(modo === 'crear' || modo === 'editar') && (
        <Modal onClose={cerrarModal}>
          <form onSubmit={guardarProducto} className="bg-white rounded-xl p-5 w-full max-w-sm flex flex-col gap-3 shadow-lg">
            <p className="text-sm font-medium mb-1">{modo === 'editar' ? 'Editar producto' : 'Añadir producto'}</p>
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Nombre del producto"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Marca"
              value={form.marca}
              onChange={(e) => setForm({ ...form, marca: e.target.value })}
            />
            <select
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Precio de venta"
              type="number"
              step="0.01"
              min="0"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
            />
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Stock inicial"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Stock mínimo (aviso)"
              type="number"
              min="0"
              value={form.stock_minimo}
              onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end gap-2 mt-1">
              <button type="button" onClick={cerrarModal} className="text-neutral-500 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100">
                Cancelar
              </button>
              <button className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50" type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : modo === 'editar' ? 'Guardar cambios' : 'Añadir'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modo === 'vender' && activo && (
        <Modal onClose={cerrarModal}>
          <form onSubmit={confirmarVenta} className="bg-white rounded-xl p-5 w-full max-w-sm flex flex-col gap-3 shadow-lg">
            <p className="text-sm font-medium mb-1">Vender {activo.nombre}</p>
            <p className="text-xs text-neutral-500">Stock disponible: {activo.stock} uds. · Precio: {formatEuros(activo.precio)}/ud.</p>
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Cantidad vendida"
              type="number"
              min="1"
              max={activo.stock}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              autoFocus
            />
            {cantidad > 0 && (
              <p className="text-xs text-neutral-500">
                Se registrará un ingreso de {formatEuros(activo.precio * cantidad)} y se descontará del stock.
              </p>
            )}
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end gap-2 mt-1">
              <button type="button" onClick={cerrarModal} className="text-neutral-500 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100">
                Cancelar
              </button>
              <button className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50" type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Confirmar venta'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modo === 'reponer' && activo && (
        <Modal onClose={cerrarModal}>
          <form onSubmit={confirmarReposicion} className="bg-white rounded-xl p-5 w-full max-w-sm flex flex-col gap-3 shadow-lg">
            <p className="text-sm font-medium mb-1">Reponer stock de {activo.nombre}</p>
            <p className="text-xs text-neutral-500">Stock actual: {activo.stock} uds.</p>
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Cantidad comprada"
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              autoFocus
            />
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Coste total de la compra (€)"
              type="number"
              step="0.01"
              min="0"
              value={costo}
              onChange={(e) => setCosto(e.target.value)}
            />
            <p className="text-xs text-neutral-500">Se registrará un gasto por el coste indicado y se sumará al stock.</p>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end gap-2 mt-1">
              <button type="button" onClick={cerrarModal} className="text-neutral-500 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100">
                Cancelar
              </button>
              <button className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50" type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Confirmar reposición'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
