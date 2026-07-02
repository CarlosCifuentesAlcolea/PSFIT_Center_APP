import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

function formatEuros(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

export default function Contabilidad() {
  const [movimientos, setMovimientos] = useState([]);
  const [error, setError] = useState('');
  const [nuevo, setNuevo] = useState({ tipo: 'ingreso', concepto: '', importe: '' });

  function cargar() {
    api.getMovimientos().then(setMovimientos).catch((e) => setError(e.message));
  }

  useEffect(cargar, []);

  const ingresos = movimientos.filter((m) => m.tipo === 'ingreso').reduce((sum, m) => sum + Number(m.importe), 0);
  const gastos = movimientos.filter((m) => m.tipo === 'gasto').reduce((sum, m) => sum + Number(m.importe), 0);

  async function crearMovimiento(e) {
    e.preventDefault();
    if (!nuevo.concepto || !nuevo.importe) return;
    try {
      await api.crearMovimiento({ ...nuevo, importe: parseFloat(nuevo.importe) });
      setNuevo({ tipo: 'ingreso', concepto: '', importe: '' });
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-neutral-50 rounded-lg p-4">
          <p className="text-xs text-neutral-400 mb-1">Total ingresos</p>
          <p className="text-2xl font-medium text-green-600">{formatEuros(ingresos)}</p>
        </div>
        <div className="bg-neutral-50 rounded-lg p-4">
          <p className="text-xs text-neutral-400 mb-1">Total gastos</p>
          <p className="text-2xl font-medium text-red-600">{formatEuros(gastos)}</p>
        </div>
      </div>

      <form onSubmit={crearMovimiento} className="flex gap-2 mb-4">
        <select
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
          value={nuevo.tipo}
          onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}
        >
          <option value="ingreso">Ingreso</option>
          <option value="gasto">Gasto</option>
        </select>
        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm flex-1"
          placeholder="Concepto"
          value={nuevo.concepto}
          onChange={(e) => setNuevo({ ...nuevo, concepto: e.target.value })}
        />
        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm w-28"
          placeholder="Importe"
          type="number"
          step="0.01"
          value={nuevo.importe}
          onChange={(e) => setNuevo({ ...nuevo, importe: e.target.value })}
        />
        <button className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg" type="submit">
          Registrar
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-neutral-400 border-b border-neutral-200">
            <th className="py-2 font-normal">Fecha</th>
            <th className="py-2 font-normal">Concepto</th>
            <th className="py-2 font-normal text-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m) => (
            <tr key={m.id} className="border-b border-neutral-100">
              <td className="py-2.5 text-neutral-500">{new Date(m.fecha).toLocaleDateString('es-ES')}</td>
              <td className="py-2.5">{m.concepto}</td>
              <td className={`py-2.5 text-right ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                {m.tipo === 'ingreso' ? '+' : '−'}{formatEuros(m.importe)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
