import Modal from './Modal.jsx';

function formatFecha(valor) {
  if (!valor) return '—';
  return new Date(`${valor}T00:00:00`).toLocaleDateString('es-ES');
}

export default function DietaVista({ socio, dieta, onClose }) {
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
            <span className="text-neutral-400 whitespace-nowrap">Objetivo</span>
            <span className="text-right">{dieta.objetivo || '—'}</span>
          </div>
        </div>

        {dieta.contenido && (
          <div className="border-t border-neutral-100 pt-3">
            <p className="text-xs font-medium text-neutral-500 mb-1.5">Contenido</p>
            <pre className="text-sm text-neutral-700 whitespace-pre-wrap font-sans bg-neutral-50 rounded-lg p-3">
              {dieta.contenido}
            </pre>
          </div>
        )}

        <div className="flex justify-end mt-1">
          <button onClick={onClose} className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg">
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
