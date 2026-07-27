import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Modal from './Modal.jsx';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function formatEuros(n) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);
}

function hoyYYYYMM() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Contabilidad() {
  const [movimientos, setMovimientos] = useState([]);
  const [error, setError] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevo, setNuevo] = useState({ tipo: 'ingreso', concepto: '', importe: '' });
  const [guardando, setGuardando] = useState(false);

  const [vista, setVista] = useState('mes');
  const [mes, setMes] = useState(hoyYYYYMM());
  const [anio, setAnio] = useState(new Date().getFullYear());

  function cargar() {
    const [anioMes, mesMes] = mes.split('-');
    const filtro = vista === 'mes' ? { year: anioMes, month: mesMes } : { year: anio };
    api.getMovimientos(filtro).then(setMovimientos).catch((e) => setError(e.message));
  }

  useEffect(cargar, [vista, mes, anio]);

  const ingresos = movimientos.filter((m) => m.tipo === 'ingreso').reduce((sum, m) => sum + Number(m.importe), 0);
  const gastos = movimientos.filter((m) => m.tipo === 'gasto').reduce((sum, m) => sum + Number(m.importe), 0);

  const porMes = MESES.map((nombreMes, i) => {
    const delMes = movimientos.filter((m) => new Date(m.fecha).getMonth() === i);
    const ing = delMes.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.importe), 0);
    const gas = delMes.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + Number(m.importe), 0);
    return { nombreMes, ing, gas };
  });

  async function crearMovimiento(e) {
    e.preventDefault();
    if (!nuevo.concepto || !nuevo.importe || guardando) return;
    setGuardando(true);
    setError('');
    try {
      await api.crearMovimiento({ ...nuevo, importe: parseFloat(nuevo.importe) });
      setModalAbierto(false);
      setNuevo({ tipo: 'ingreso', concepto: '', importe: '' });
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
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

      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex gap-1">
          <button
            onClick={() => setVista('mes')}
            className={`text-sm px-3 py-1.5 rounded-lg ${vista === 'mes' ? 'bg-brand/20 text-brand-dark font-medium' : 'text-neutral-500 hover:bg-neutral-100'}`}
          >
            Por mes
          </button>
          <button
            onClick={() => setVista('año')}
            className={`text-sm px-3 py-1.5 rounded-lg ${vista === 'año' ? 'bg-brand/20 text-brand-dark font-medium' : 'text-neutral-500 hover:bg-neutral-100'}`}
          >
            Por año
          </button>
          {vista === 'mes' ? (
            <input
              type="month"
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
            />
          ) : (
            <input
              type="number"
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm w-24"
              value={anio}
              onChange={(e) => setAnio(e.target.value)}
            />
          )}
        </div>
        <button onClick={() => setModalAbierto(true)} className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg">
          + Registrar movimiento
        </button>
      </div>

      {error && !modalAbierto && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {vista === 'mes' ? (
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
            {movimientos.length === 0 && (
              <tr><td colSpan={3} className="py-4 text-center text-neutral-400">Sin movimientos ese mes.</td></tr>
            )}
          </tbody>
        </table>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-neutral-400 border-b border-neutral-200">
              <th className="py-2 font-normal">Mes</th>
              <th className="py-2 font-normal text-right">Ingresos</th>
              <th className="py-2 font-normal text-right">Gastos</th>
              <th className="py-2 font-normal text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {porMes.map((m) => (
              <tr key={m.nombreMes} className="border-b border-neutral-100">
                <td className="py-2.5">{m.nombreMes}</td>
                <td className="py-2.5 text-right text-green-600">{m.ing ? formatEuros(m.ing) : '—'}</td>
                <td className="py-2.5 text-right text-red-600">{m.gas ? formatEuros(m.gas) : '—'}</td>
                <td className="py-2.5 text-right font-medium">{formatEuros(m.ing - m.gas)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalAbierto && (
        <Modal onClose={() => setModalAbierto(false)}>
          <form onSubmit={crearMovimiento} className="bg-white rounded-xl p-5 w-full max-w-sm flex flex-col gap-3 shadow-lg">
            <p className="text-sm font-medium mb-1">Registrar movimiento</p>
            <select
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              value={nuevo.tipo}
              onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}
            >
              <option value="ingreso">Ingreso</option>
              <option value="gasto">Gasto</option>
            </select>
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Concepto"
              value={nuevo.concepto}
              onChange={(e) => setNuevo({ ...nuevo, concepto: e.target.value })}
            />
            <input
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              placeholder="Importe"
              type="number"
              step="0.01"
              value={nuevo.importe}
              onChange={(e) => setNuevo({ ...nuevo, importe: e.target.value })}
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end gap-2 mt-1">
              <button type="button" onClick={() => setModalAbierto(false)} className="text-neutral-500 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100">
                Cancelar
              </button>
              <button className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50" type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
