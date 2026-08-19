export default function Modal({ onClose, children }) {
  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-10 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}
