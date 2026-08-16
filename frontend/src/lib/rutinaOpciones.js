export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const BLOQUES = ['Bloque I', 'Bloque II', 'Bloque III'];
export const OPCIONES_CABECERA = [...DIAS_SEMANA, ...BLOQUES];

// Los tipos de ejercicio ya no son una lista fija: se gestionan desde la BD
// (tabla tipos_ejercicio) y se administran desde el boton "Ejercicios" (solo admin).

export const OPCIONES_SERIES = [1, 2, 3, 4, 5, 6];
export const OPCIONES_REPETICIONES = [6, 8, 10, 12, 15, 20, 25, 30];
