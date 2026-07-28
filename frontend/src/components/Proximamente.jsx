export default function Proximamente({ titulo, descripcion }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-2">
      <p className="text-lg font-medium text-neutral-700">{titulo}</p>
      <p className="text-sm text-neutral-400 max-w-sm">{descripcion}</p>
      <span className="mt-3 text-xs bg-brand/20 text-brand-dark px-3 py-1 rounded-full">Próximamente</span>
    </div>
  );
}
