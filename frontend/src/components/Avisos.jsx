import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const ESTADO_STYLES = {
  al_dia: 'bg-green-100 text-green-700',
  pendiente: 'bg-amber-100 text-amber-700',
  baja: 'bg-red-100 text-red-700'
};

export default function Avisos() {
  const [productos, setProductos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getProductos(), api.getSocios()])
      .then(([p, s]) => {
        setProductos(p);
        setSocios(s);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600 text-sm">Error al cargar los avisos: {error}</p>;

  const stockBajo = productos
    .filter((p) => p.stock <= p.stock_minimo)
    .sort((a, b) => a.stock - b.stock);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const sinPagar = socios
    .filter((s) => s.estado !== 'baja' && (s.estado === 'pendiente' || (s.proximo_pago && new Date(s.proximo_pago) < hoy)))
    .sort((a, b) => new Date(a.proximo_pago || 0) - new Date(b.proximo_pago || 0));

  return (
    <div className="flex flex-col gap-6">
      <section>
        <p className="text-sm font-medium mb-3">Productos próximos a agotarse ({stockBajo.length})</p>
        {stockBajo.length === 0 ? (
          <p className="text-sm text-neutral-400">Todo el stock está en orden.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm border-collapse">
              <thead>
                <tr className="text-left text-neutral-400 border-b border-neutral-200">
                  <th className="py-2 font-normal">Producto</th>
                  <th className="py-2 font-normal">Categoría</th>
                  <th className="py-2 font-normal">Stock</th>
                  <th className="py-2 font-normal">Stock mínimo</th>
                </tr>
              </thead>
              <tbody>
                {stockBajo.map((p) => (
                  <tr key={p.id} className="border-b border-neutral-100">
                    <td className="py-2.5">{p.nombre}</td>
                    <td className="py-2.5 text-neutral-500">{p.categoria || '—'}</td>
                    <td className="py-2.5 text-red-600">{p.stock} uds.</td>
                    <td className="py-2.5 text-neutral-500">{p.stock_minimo} uds.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <p className="text-sm font-medium mb-3">Socios con pago pendiente ({sinPagar.length})</p>
        {sinPagar.length === 0 ? (
          <p className="text-sm text-neutral-400">No hay pagos pendientes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm border-collapse">
              <thead>
                <tr className="text-left text-neutral-400 border-b border-neutral-200">
                  <th className="py-2 font-normal">Nombre</th>
                  <th className="py-2 font-normal">Plan</th>
                  <th className="py-2 font-normal">Estado</th>
                  <th className="py-2 font-normal">Próximo pago</th>
                </tr>
              </thead>
              <tbody>
                {sinPagar.map((s) => (
                  <tr key={s.id} className="border-b border-neutral-100">
                    <td className="py-2.5">{[s.nombre, s.apellidos].filter(Boolean).join(' ')}</td>
                    <td className="py-2.5 text-neutral-500 capitalize">{s.plan}</td>
                    <td className="py-2.5">
                      <span className={`px-2.5 py-0.5 rounded-md text-xs ${ESTADO_STYLES[s.estado] || ''}`}>
                        {s.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 text-red-600">
                      {s.proximo_pago ? new Date(s.proximo_pago).toLocaleDateString('es-ES') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
