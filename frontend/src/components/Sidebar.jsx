const NAV_ITEMS = [
  { key: 'panel', label: 'Panel' },
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'productos', label: 'Productos' },
  { key: 'contabilidad', label: 'Contabilidad' }
];

export default function Sidebar({ active, onChange, usuario, onLogout }) {
  const items = NAV_ITEMS.filter((item) => item.key !== 'contabilidad' || usuario.rol === 'admin');

  return (
    <nav className="w-56 bg-neutral-50 border-r border-neutral-200 flex flex-col p-3 gap-1">
      <div className="flex items-center gap-2 px-2 pb-5">
        <div className="w-7 h-7 rounded-lg bg-brand/20 flex items-center justify-center text-brand-dark font-semibold text-sm">
          PS
        </div>
        <span className="font-medium text-neutral-800">PS FIT Center</span>
      </div>

      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
            active === item.key
              ? 'bg-brand/20 text-brand-dark font-medium'
              : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          {item.label}
        </button>
      ))}

      <div className="mt-auto flex flex-col gap-1 pt-3 border-t border-neutral-200">
        <p className="px-3 text-xs text-neutral-400">
          {usuario.nombre} · <span className="capitalize">{usuario.rol}</span>
        </p>
        <button
          onClick={onLogout}
          className="text-left px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-neutral-100"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
