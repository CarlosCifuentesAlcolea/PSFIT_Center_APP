import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import RutinaModal from './RutinaModal.jsx';
import RutinaVista from './RutinaVista.jsx';

function nombreCompleto(s) {
  return [s.nombre, s.apellidos].filter(Boolean).join(' ');
}

export default function Rutinas() {
  const [socios, setSocios] = useState([]);
  const [rutinas, setRutinas] = useState([]);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [modo, setModo] = useState(null); // 'crear' | 'editar' | 'ver'
  const [socioActivo, setSocioActivo] = useState(null);
  const [rutinaActiva, setRutinaActiva] = useState(null);

  function cargar() {
    Promise.all([api.getSocios(), api.getRutinas()])
      .then(([s, r]) => {
        setSocios(s.filter((socio) => !socio.diario));
        setRutinas(r);
      })
      .catch((e) => setError(e.message));
  }

  useEffect(cargar, []);

  // Rutinas ya vienen ordenadas por fecha desc desde el backend: la primera
  // que encontramos para cada socio es la mas reciente.
  const rutinaPorSocio = useMemo(() => {
    const mapa = {};
    for (const r of rutinas) {
      if (!mapa[r.socio_id]) mapa[r.socio_id] = r;
    }
    return mapa;
  }, [rutinas]);

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
    setRutinaActiva(null);
  }

  function abrirCrear(socio) {
    setSocioActivo(socio);
    setRutinaActiva(null);
    setModo('crear');
  }

  function abrirVer(socio, rutina) {
    setSocioActivo(socio);
    setRutinaActiva(rutina);
    setModo('ver');
  }

  function abrirEditar(socio, rutina) {
    setSocioActivo(socio);
    setRutinaActiva(rutina);
    setModo('editar');
  }

  async function eliminar(rutina) {
    await api.eliminarRutina(rutina.id);
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
              <th className="py-2 font-normal">Rutina</th>
              <th className="py-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {sociosFiltrados.map((s) => {
              const rutina = rutinaPorSocio[s.id];
              return (
                <tr key={s.id} className="border-b border-neutral-100">
                  <td className="py-2.5 px-3">{nombreCompleto(s)}</td>
                  <td className="py-2.5 text-neutral-500 capitalize">{s.plan}</td>
                  <td className="py-2.5 text-neutral-500">{rutina ? rutina.nombre_rutina : '—'}</td>
                  <td className="py-2.5 text-right whitespace-nowrap pr-3">
                    {rutina ? (
                      <>
                        <button onClick={() => abrirVer(s, rutina)} className="text-neutral-400 hover:text-brand-dark text-xs mr-2">
                          Ver
                        </button>
                        <button onClick={() => abrirEditar(s, rutina)} className="text-neutral-400 hover:text-brand-dark text-xs mr-2">
                          Editar
                        </button>
                        <button onClick={() => eliminar(rutina)} className="text-neutral-400 hover:text-red-600 text-xs">
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
        <RutinaModal
          socio={socioActivo}
          rutina={rutinaActiva}
          onClose={cerrarModal}
          onGuardado={() => {
            cerrarModal();
            cargar();
          }}
        />
      )}

      {modo === 'ver' && socioActivo && rutinaActiva && (
        <RutinaVista socio={socioActivo} rutina={rutinaActiva} onClose={cerrarModal} />
      )}
    </div>
  );
}
