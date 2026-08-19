const NAV_ITEMS = [
  { key: 'avisos', label: 'Avisos' },
  { key: 'contabilidad', label: 'Contabilidad', soloAdmin: true },
  { key: 'dietas', label: 'Dietas' },
  { key: 'panel', label: 'Panel' },
  { key: 'personal', label: 'Personal', soloAdmin: true },
  { key: 'productos', label: 'Productos' },
  { key: 'rutinas', label: 'Rutinas' },
  { key: 'usuarios', label: 'Usuarios' }
];

export default function Sidebar({ active, onChange, usuario, onLogout, abierto, onCerrar }) {
  const items = NAV_ITEMS.filter((item) => !item.soloAdmin || usuario.rol === 'admin');

  function seleccionar(key) {
    onChange(key);
    onCerrar?.();
  }

  return (
    <>
      {abierto && (
        <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={onCerrar} />
      )}
      <nav
        className={`fixed md:static inset-y-0 left-0 z-30 w-56 bg-neutral-50 border-r border-neutral-200 flex flex-col p-3 gap-1
          transform transition-transform duration-200 md:translate-x-0
          ${abierto ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-2 px-2 pb-5">
          <img src="/logo.png" alt="PS FIT Center" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-medium text-neutral-800">PS FIT Center</span>
        </div>

        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => seleccionar(item.key)}
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
    </>
  );
}
