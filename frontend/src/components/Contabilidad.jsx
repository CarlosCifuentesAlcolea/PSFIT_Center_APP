import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { api } from '../api/client.js';
import Modal from './Modal.jsx';
import { METODOS_PAGO, etiquetaMetodoPago } from '../lib/metodoPago.js';

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
  const [nuevo, setNuevo] = useState({ tipo: 'ingreso', concepto: '', importe: '', metodo_pago: 'efectivo' });
  const [guardando, setGuardando] = useState(false);

  const [vista, setVista] = useState('mes');
  const [mes, setMes] = useState(hoyYYYYMM());
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [filtroMetodo, setFiltroMetodo] = useState('todos');

  function cargar() {
    const [anioMes, mesMes] = mes.split('-');
    const filtro = vista === 'mes' ? { year: anioMes, month: mesMes } : { year: anio };
    api.getMovimientos(filtro).then(setMovimientos).catch((e) => setError(e.message));
  }

  useEffect(cargar, [vista, mes, anio]);

  const movimientosFiltrados = movimientos.filter(
    (m) => filtroMetodo === 'todos' || m.metodo_pago === filtroMetodo
  );

  const ingresos = movimientosFiltrados.filter((m) => m.tipo === 'ingreso').reduce((sum, m) => sum + Number(m.importe), 0);
  const gastos = movimientosFiltrados.filter((m) => m.tipo === 'gasto').reduce((sum, m) => sum + Number(m.importe), 0);

  const porMes = MESES.map((nombreMes, i) => {
    const delMes = movimientosFiltrados.filter((m) => new Date(m.fecha).getMonth() === i);
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
      setNuevo({ tipo: 'ingreso', concepto: '', importe: '', metodo_pago: 'efectivo' });
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarMovimiento(id) {
    await api.eliminarMovimiento(id);
    cargar();
  }

  function descargarPDF() {
    const [anioMes, mesMes] = mes.split('-');
    const nombreMes = MESES[parseInt(mesMes, 10) - 1];

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('PS FIT Center', 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Extracto de ingresos y gastos — ${nombreMes} de ${anioMes}`, 14, 25);
    if (filtroMetodo !== 'todos') {
      doc.text(`Filtrado por método de pago: ${etiquetaMetodoPago(filtroMetodo)}`, 14, 30);
    }

    autoTable(doc, {
      startY: filtroMetodo !== 'todos' ? 36 : 32,
      head: [['Fecha', 'Concepto', 'Tipo', 'Método', 'Importe']],
      body: movimientosFiltrados.map((m) => [
        new Date(m.fecha).toLocaleDateString('es-ES'),
        m.concepto,
        m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
        etiquetaMetodoPago(m.metodo_pago),
        `${m.tipo === 'ingreso' ? '+' : '-'}${formatEuros(m.importe)}`
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [92, 110, 1] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Total ingresos: ${formatEuros(ingresos)}`, 14, finalY);
    doc.text(`Total gastos: ${formatEuros(gastos)}`, 14, finalY + 7);
    doc.setFont(undefined, 'bold');
    doc.text(`Balance: ${formatEuros(ingresos - gastos)}`, 14, finalY + 14);

    doc.save(`extracto-${anioMes}-${mesMes}.pdf`);
  }

  async function descargarXLSX() {
    const [anioMes, mesMes] = mes.split('-');
    const nombreMes = MESES[parseInt(mesMes, 10) - 1];

    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'PS FIT Center';
      workbook.created = new Date();
      const hoja = workbook.addWorksheet('Extracto');

      hoja.getColumn(1).width = 14;
      hoja.getColumn(2).width = 38;
      hoja.getColumn(3).width = 12;
      hoja.getColumn(4).width = 14;
      hoja.getColumn(5).width = 16;

      try {
        const logoBuffer = await fetch('/logo.png').then((r) => r.arrayBuffer());
        const imageId = workbook.addImage({ buffer: logoBuffer, extension: 'png' });
        hoja.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 70, height: 70 } });
      } catch {
        // si no se puede cargar el logo, se genera el excel igualmente sin el
      }

      hoja.mergeCells('B1:E1');
      hoja.getCell('B1').value = 'PS FIT Center';
      hoja.getCell('B1').font = { size: 16, bold: true, color: { argb: 'FF5C6E01' } };

      hoja.mergeCells('B2:E2');
      hoja.getCell('B2').value =
        `Extracto de ingresos y gastos — ${nombreMes} de ${anioMes}` +
        (filtroMetodo !== 'todos' ? ` · Filtrado por: ${etiquetaMetodoPago(filtroMetodo)}` : '');
      hoja.getCell('B2').font = { size: 10, color: { argb: 'FF666666' } };

      const filaCabecera = 5;
      const filas = movimientosFiltrados.map((m) => [
        new Date(m.fecha).toLocaleDateString('es-ES'),
        m.concepto,
        m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
        etiquetaMetodoPago(m.metodo_pago).replace(/^\S+\s/, ''),
        Number(m.importe) * (m.tipo === 'ingreso' ? 1 : -1)
      ]);

      hoja.addTable({
        name: 'ExtractoMovimientos',
        ref: `A${filaCabecera}`,
        headerRow: true,
        totalsRow: false,
        style: { theme: 'TableStyleMedium9', showRowStripes: true },
        columns: [
          { name: 'Fecha' },
          { name: 'Concepto' },
          { name: 'Tipo' },
          { name: 'Método' },
          { name: 'Importe' }
        ],
        rows: filas
      });
      hoja.getColumn(5).numFmt = '#,##0.00" €"';

      const filaTotales = filaCabecera + filas.length + 2;
      hoja.getCell(filaTotales, 2).value = 'Total ingresos';
      hoja.getCell(filaTotales, 5).value = ingresos;
      hoja.getCell(filaTotales + 1, 2).value = 'Total gastos';
      hoja.getCell(filaTotales + 1, 5).value = -gastos;
      hoja.getCell(filaTotales + 2, 2).value = 'Balance';
      hoja.getCell(filaTotales + 2, 2).font = { bold: true };
      hoja.getCell(filaTotales + 2, 5).font = { bold: true };
      hoja.getCell(filaTotales + 2, 5).value = ingresos - gastos;
      for (let i = 0; i < 3; i++) {
        hoja.getCell(filaTotales + i, 5).numFmt = '#,##0.00" €"';
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `extracto-${anioMes}-${mesMes}.xlsx`;
      enlace.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError('No se pudo generar el Excel: ' + e.message);
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
          <select
            className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
            value={filtroMetodo}
            onChange={(e) => setFiltroMetodo(e.target.value)}
          >
            <option value="todos">Todos los métodos</option>
            {METODOS_PAGO.map((m) => (
              <option key={m.valor} value={m.valor}>{m.icono} {m.etiqueta}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          {vista === 'mes' && (
            <>
              <button
                onClick={descargarPDF}
                disabled={movimientosFiltrados.length === 0}
                className="border border-neutral-200 text-neutral-600 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-50"
              >
                Descargar PDF
              </button>
              <button
                onClick={descargarXLSX}
                disabled={movimientosFiltrados.length === 0}
                className="border border-neutral-200 text-neutral-600 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-50"
              >
                Descargar Excel
              </button>
            </>
          )}
          <button onClick={() => setModalAbierto(true)} className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg">
            + Registrar movimiento
          </button>
        </div>
      </div>

      {error && !modalAbierto && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {vista === 'mes' ? (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-neutral-400 border-b border-neutral-200">
              <th className="py-2 font-normal">Fecha</th>
              <th className="py-2 font-normal">Concepto</th>
              <th className="py-2 font-normal">Método</th>
              <th className="py-2 font-normal text-right">Importe</th>
              <th className="py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {movimientosFiltrados.map((m) => (
              <tr key={m.id} className="border-b border-neutral-100">
                <td className="py-2.5 text-neutral-500">{new Date(m.fecha).toLocaleDateString('es-ES')}</td>
                <td className="py-2.5">{m.concepto}</td>
                <td className="py-2.5 text-neutral-500">{etiquetaMetodoPago(m.metodo_pago)}</td>
                <td className={`py-2.5 text-right ${m.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                  {m.tipo === 'ingreso' ? '+' : '−'}{formatEuros(m.importe)}
                </td>
                <td className="py-2.5 text-right">
                  <button onClick={() => eliminarMovimiento(m.id)} className="text-neutral-400 hover:text-red-600 text-xs">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {movimientosFiltrados.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-neutral-400">Sin movimientos ese mes.</td></tr>
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
            <select
              className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm"
              value={nuevo.metodo_pago}
              onChange={(e) => setNuevo({ ...nuevo, metodo_pago: e.target.value })}
            >
              {METODOS_PAGO.map((m) => (
                <option key={m.valor} value={m.valor}>{m.icono} {m.etiqueta}</option>
              ))}
            </select>
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
