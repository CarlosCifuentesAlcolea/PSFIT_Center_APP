import { useState } from 'react';
import Modal from './Modal.jsx';
import { generarExcelRutina } from '../lib/exportarRutina.js';

const CAMPOS = [
  ['Edad', 'edad'],
  ['Peso', 'peso'],
  ['Altura', 'altura'],
  ['Patologías', 'patologias'],
  ['Días de entrenamiento', 'dias_entrenamiento'],
  ['Objetivo', 'objetivo']
];

function formatFecha(valor) {
  if (!valor) return '—';
  return new Date(`${valor}T00:00:00`).toLocaleDateString('es-ES');
}

export default function RutinaVista({ socio, rutina, onClose }) {
  const [generando, setGenerando] = useState(false);

  async function descargar() {
    setGenerando(true);
    try {
      await generarExcelRutina(socio, rutina);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="bg-white rounded-xl p-5 w-full max-w-lg flex flex-col gap-3 shadow-lg max-h-[85vh] overflow-y-auto">
        <p className="text-sm font-medium">{rutina.nombre_rutina}</p>
        <p className="text-xs text-neutral-400 -mt-2">{socio.nombre} {socio.apellidos}</p>

        <div className="text-sm text-neutral-600 flex flex-col gap-1.5">
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400 whitespace-nowrap">Fecha de inicio</span>
            <span className="text-right">{formatFecha(rutina.fecha_inicio)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400 whitespace-nowrap">Fecha de finalización</span>
            <span className="text-right">{formatFecha(rutina.fecha_fin)}</span>
          </div>
          {CAMPOS.map(([etiqueta, campo]) => (
            <div key={campo} className="flex justify-between gap-3">
              <span className="text-neutral-400 whitespace-nowrap">{etiqueta}</span>
              <span className="text-right">{rutina[campo] || '—'}</span>
            </div>
          ))}
        </div>

        {rutina.calentamiento && (
          <div className="border-t border-neutral-100 pt-3">
            <p className="text-xs font-medium text-neutral-500 mb-1.5">Calentamiento</p>
            <pre className="text-sm text-neutral-700 whitespace-pre-wrap font-sans bg-neutral-50 rounded-lg p-3">
              {rutina.calentamiento}
            </pre>
          </div>
        )}

        {rutina.bloques && rutina.bloques.length > 0 && (
          <div className="border-t border-neutral-100 pt-3">
            <p className="text-xs font-medium text-neutral-500 mb-1.5">RUTINA</p>
            <div className="flex flex-col gap-2">
              {rutina.bloques.map((b) => (
                <div key={b.id} className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">{b.nombre}</p>
                  {b.ejercicios.length === 0 ? (
                    <p className="text-xs text-neutral-400">Sin ejercicios.</p>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {b.ejercicios.map((ej, i) => (
                        <p key={i} className="text-sm text-neutral-600">{ej.tipo} — {ej.series}x{ej.repeticiones}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-1">
          <button onClick={onClose} className="text-neutral-500 text-sm px-4 py-1.5 rounded-lg hover:bg-neutral-100">
            Cerrar
          </button>
          <button
            onClick={descargar}
            disabled={generando}
            className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg disabled:opacity-50"
          >
            {generando ? 'Generando...' : 'Generar Excel'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
