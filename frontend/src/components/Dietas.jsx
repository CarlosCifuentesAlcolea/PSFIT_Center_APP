import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import DietaModal from './DietaModal.jsx';
import DietaVista from './DietaVista.jsx';

function nombreCompleto(s) {
  return [s.nombre, s.apellidos].filter(Boolean).join(' ');
}

export default function Dietas() {
  const [socios, setSocios] = useState([]);
  const [dietas, setDietas] = useState([]);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [modo, setModo] = useState(null); // 'crear' | 'editar' | 'ver'
  const [socioActivo, setSocioActivo] = useState(null);
  const [dietaActiva, setDietaActiva] = useState(null);

  function cargar() {
    Promise.all([api.getSocios(), api.getDietas()])
      .then(([s, d]) => {
        setSocios(s.filter((socio) => !socio.diario));
        setDietas(d);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(cargar, []);

  // Dietas ya vienen ordenadas por fecha desc desde el backend: la primera
  // que encontramos para cada socio es la mas reciente.
  const dietaPorSocio = useMemo(() => {
    const mapa = {};
    for (const d of dietas) {
      if (!mapa[d.socio_id]) mapa[d.socio_id] = d;
    }
    return mapa;
  }, [dietas]);

  const sociosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return socios;
    return socios.filter((s) =>
      [s.nombre, s.apellidos, s.dni].some((campo) => (campo || '').toLowerCase().includes(q))
    );
  }, [socios, busqueda]);

  function cerrarModal() {
    setModo(null);
    setSocioActivo(null);
    setDietaActiva(null);
  }

  function abrirCrear(socio) {
    setSocioActivo(socio);
    setDietaActiva(null);
    setModo('crear');
  }

  function abrirVer(socio, dieta) {
    setSocioActivo(socio);
    setDietaActiva(dieta);
    setModo('ver');
  }

  function abrirEditar(socio, dieta) {
    setSocioActivo(socio);
    setDietaActiva(dieta);
    setModo('editar');
  }

  async function eliminar(dieta) {
    await api.eliminarDieta(dieta.id);
    cargar();
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <input
          className="border border-neutral-200 rounded-lg px-3 py-1.5 text-sm flex-1 max-w-xs"
          placeholder="Buscar por nombre, apellidos o DNI..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      <div className="max-h-[32rem] overflow-y-auto border border-neutral-100 rounded-lg">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-neutral-400 border-b border-neutral-200 bg-white sticky top-0">
              <th className="py-2 px-3 font-normal">Nombre</th>
              <th className="py-2 font-normal">Plan</th>
              <th className="py-2 font-normal">Dieta</th>
              <th className="py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {sociosFiltrados.map((s) => {
              const dieta = dietaPorSocio[s.id];
              return (
                <tr key={s.id} className="border-b border-neutral-100">
                  <td className="py-2.5 px-3">{nombreCompleto(s)}</td>
                  <td className="py-2.5 text-neutral-500 capitalize">{s.plan}</td>
                  <td className="py-2.5 text-neutral-500">{dieta ? dieta.nombre_dieta : '—'}</td>
                  <td className="py-2.5 text-right whitespace-nowrap pr-3">
                    {dieta ? (
                      <>
                        <button onClick={() => abrirVer(s, dieta)} className="text-neutral-400 hover:text-brand-dark text-xs mr-2">
                          Ver
                        </button>
                        <button onClick={() => abrirEditar(s, dieta)} className="text-neutral-400 hover:text-brand-dark text-xs mr-2">
                          Editar
                        </button>
                        <button onClick={() => eliminar(dieta)} className="text-neutral-400 hover:text-red-600 text-xs">
                          Eliminar
                        </button>
                      </>
                    ) : (
                      <button onClick={() => abrirCrear(s)} className="text-neutral-400 hover:text-brand-dark text-xs">
                        + Crear
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {sociosFiltrados.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-neutral-400">Sin resultados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {(modo === 'crear' || modo === 'editar') && socioActivo && (
        <DietaModal
          socio={socioActivo}
          dieta={dietaActiva}
          onClose={cerrarModal}
          onGuardado={() => {
            cerrarModal();
            cargar();
          }}
        />
      )}

      {modo === 'ver' && socioActivo && dietaActiva && (
        <DietaVista socio={socioActivo} dieta={dietaActiva} onClose={cerrarModal} />
      )}
    </div>
  );
}
