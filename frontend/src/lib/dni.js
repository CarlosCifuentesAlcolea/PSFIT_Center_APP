const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE';

// Valida DNI (12345678Z) y NIE (X1234567Z) españoles, incluida la letra de control.
export function validarDni(valor) {
  if (typeof valor !== 'string') return false;
  const limpio = valor.trim().toUpperCase();

  const matchDni = limpio.match(/^(\d{8})([A-Z])$/);
  const matchNie = limpio.match(/^([XYZ])(\d{7})([A-Z])$/);

  let numero, letra;
  if (matchDni) {
    numero = parseInt(matchDni[1], 10);
    letra = matchDni[2];
  } else if (matchNie) {
    const prefijo = { X: '0', Y: '1', Z: '2' }[matchNie[1]];
    numero = parseInt(prefijo + matchNie[2], 10);
    letra = matchNie[3];
  } else {
    return false;
  }

  return LETRAS_DNI[numero % 23] === letra;
}
