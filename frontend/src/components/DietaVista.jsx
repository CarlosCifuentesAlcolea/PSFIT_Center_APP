import { useState } from 'react';
import Modal from './Modal.jsx';
import { generarPdfDieta } from '../lib/exportarDietaPdf.js';
import { generarExcelDieta } from '../lib/exportarDietaExcel.js';

function formatFecha(valor) {
  if (!valor) return '—';
  return new Date(`${valor}T00:00:00`).toLocaleDateString('es-ES');
}

function Seccion({ titulo, contenido }) {
  if (!contenido) return null;
  return (
    <div>
      <p className="text-xs font-medium text-neutral-500 mb-1">{titulo}</p>
      <pre className="text-sm text-neutral-700 whitespace-pre-wrap font-sans bg-neutral-50 rounded-lg p-2.5">
        {contenido}
      </pre>
    </div>
  );
}

export default function DietaVista({ socio, dieta, onClose }) {
  const [generando, setGenerando] = useState('');

  async function descargarPdf() {
    setGenerando('pdf');
    try {
      await generarPdfDieta(socio, dieta);
    } finally {
      setGenerando('');
    }
  }

  async function descargarExcel() {
    setGenerando('excel');
    try {
      await generarExcelDieta(socio, dieta);
    } finally {
      setGenerando('');
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="bg-white rounded-xl p-5 w-full max-w-lg flex flex-col gap-3 shadow-lg max-h-[85vh] overflow-y-auto">
        <p className="text-sm font-medium">{dieta.nombre_dieta}</p>
        <p className="text-xs text-neutral-400 -mt-2">{socio.nombre} {socio.apellidos}</p>

        <div className="text-sm text-neutral-600 flex flex-col gap-1.5">
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400 whitespace-nowrap">Fecha de inicio</span>
            <span className="text-right">{formatFecha(dieta.fecha_inicio)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400 whitespace-nowrap">Fecha de finalización</span>
            <span className="text-right">{formatFecha(dieta.fecha_fin)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400 whitespace-nowrap">Patologías</span>
            <span className="text-right">{dieta.patologias || '—'}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400 whitespace-nowrap">Objetivo</span>
            <span className="text-right">{dieta.objetivo || '—'}</span>
          </div>
        </div>

        <div className="border-t border-neutral-100 pt-3 flex flex-col gap-3">
          <Seccion titulo="Ayunas" contenido={dieta.ayunas} />
          {(dieta.comidas || []).map((c, i) => (
            <Seccion key={i} titulo={`Comida ${i + 1}`} contenido={c} />
          ))}
          <Seccion titulo="Antes de dormir" contenido={dieta.antes_dormir} />
          <Seccion titulo="Suplementación" contenido={dieta.suplementacion} />
          {dieta.duracion_suplementacion && (
            <p className="text-xs text-neutral-500">
              Duración de la suplementación: <span className="text-neutral-700">{dieta.duracion_suplementacion}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 mt-1">
          <button onClick={onClose} className="text-neutral-500 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100">
            Cerrar
          </button>
          <button
            onClick={descargarExcel}
            disabled={!!generando}
            className="border border-neutral-200 text-neutral-600 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-50"
          >
            {generando === 'excel' ? 'Generando...' : 'Generar Excel'}
          </button>
          <button
            onClick={descargarPdf}
            disabled={!!generando}
            className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
          >
            {generando === 'pdf' ? 'Generando...' : 'Generar PDF'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
