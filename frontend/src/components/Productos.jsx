import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function Productos({ usuario }) {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState({ nombre: '', categoria: '', precio: '', stock: '' });
  const [guardando, setGuardando] = useState(false);

  function cargar() {
    api.getProductos().then(setProductos).catch((e) => setError(e.message));
  }

  useEffect(cargar, []);

  async function crearProducto(e) {
    e.preventDefault();
    if (!nuevo.nombre || !nuevo.precio || guardando) return;
    setGuardando(true);
    setError('');
    try {
      await api.crearProducto({
        ...nuevo,
        precio: parseFloat(nuevo.precio),
        stock: parseInt(nuevo.stock || '0', 10)
      });
      setNuevo({ nombre: '', categoria: '', precio: '', stock: '' });
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
      <form onSubmit={crearProducto} className="flex gap-2 mb-4">
        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm flex-1"
          placeholder="Nombre del producto"
          value={nuevo.nombre}
          onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
        />
        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm flex-1"
          placeholder="Categoría"
          value={nuevo.categoria}
          onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })}
        />
        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm w-24"
          placeholder="Precio"
          type="number"
          step="0.01"
          value={nuevo.precio}
          onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })}
        />
        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm w-20"
          placeholder="Stock"
          type="number"
          value={nuevo.stock}
          onChange={(e) => setNuevo({ ...nuevo, stock: e.target.value })}
        />
        <button
          className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
          type="submit"
          disabled={guardando}
        >
          {guardando ? 'Guardando...' : 'Añadir'}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-neutral-400 border-b border-neutral-200">
            <th className="py-2 font-normal">Producto</th>
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
              <td className="py-2.5 text-neutral-500">{p.categoria || '—'}</td>
              <td className={`py-2.5 ${p.stock <= p.stock_minimo ? 'text-red-600' : ''}`}>
                {p.stock} uds.
              </td>
              <td className="py-2.5 text-right">
                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(p.precio)}
              </td>
              <td className="py-2.5 text-right">
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
    </div>
  );
}
