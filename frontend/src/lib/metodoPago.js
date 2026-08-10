export const METODOS_PAGO = [
  { valor: 'efectivo', etiqueta: 'Efectivo', icono: '💵' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta', icono: '💳' }
];

export function etiquetaMetodoPago(metodo) {
  const encontrado = METODOS_PAGO.find((m) => m.valor === metodo);
  return encontrado ? `${encontrado.icono} ${encontrado.etiqueta}` : '—';
}
