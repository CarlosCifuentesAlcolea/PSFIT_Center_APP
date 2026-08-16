import Modal from './Modal.jsx';

export default function AvisoPopup({ mensaje, onClose }) {
  return (
    <Modal onClose={onClose}>
      <div className="bg-white rounded-xl p-5 w-full max-w-sm flex flex-col gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm font-medium text-amber-700">Aviso</p>
        </div>
        <p className="text-sm text-neutral-600">{mensaje}</p>
        <div className="flex justify-end mt-1">
          <button onClick={onClose} className="bg-brand-dark text-white text-sm px-4 py-1.5 rounded-lg">
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  );
}
