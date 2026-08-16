import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

function formatEuros(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

export default function Panel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600 text-sm">Error al cargar el panel: {error}</p>;
  if (!data) return <p className="text-neutral-400 text-sm">Cargando...</p>;

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        <Metric label="Socios activos" value={data.socios_activos} />
        <Metric label="Ingresos del mes" value={formatEuros(data.ingresos_mes)} tone="text-green-600" />
        <Metric label="Gastos del mes" value={formatEuros(data.gastos_mes)} tone="text-red-600" />
        <Metric label="Stock bajo" value={`${data.stock_bajo.length} productos`} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neutral-50 rounded-lg p-4">
          <p className="text-sm font-medium mb-3">Altas recientes</p>
          <div className="flex flex-col gap-2">
            {data.ultimos_socios.map((s) => (
              <div key={s.id} className="flex justify-between text-sm">
                <span>{[s.nombre, s.apellidos].filter(Boolean).join(' ')}</span>
                <span className="text-neutral-400">{s.plan}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-neutral-50 rounded-lg p-4">
          <p className="text-sm font-medium mb-3">Avisos de stock</p>
          <div className="flex flex-col gap-2">
            {data.stock_bajo.map((p) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span>{p.nombre}</span>
                <span className="text-red-500">{p.stock} uds.</span>
              </div>
            ))}
            {data.stock_bajo.length === 0 && (
              <p className="text-sm text-neutral-400">Todo el stock esta en orden.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="bg-neutral-50 rounded-lg p-4">
      <p className="text-xs text-neutral-400 mb-1">{label}</p>
      <p className={`text-2xl font-medium ${tone || ''}`}>{value}</p>
    </div>
  );
}
