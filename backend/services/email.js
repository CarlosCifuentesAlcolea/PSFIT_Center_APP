const { Resend } = require('resend');

// Dominio de pruebas de Resend: solo funciona sin verificar dominio propio.
const REMITENTE = 'PS FIT Center <onboarding@resend.dev>';

async function enviarEmailRecuperacion(destinatario, nombre, enlaceReset) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY no esta configurada en el servidor');
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: REMITENTE,
    to: destinatario,
    subject: 'Recupera tu contraseña - PS FIT Center',
    html: `
      <p>Hola ${nombre},</p>
      <p>Hemos recibido una solicitud para restablecer tu contraseña en PS FIT Center.</p>
      <p><a href="${enlaceReset}">Haz click aquí para elegir una contraseña nueva</a></p>
      <p>Este enlace caduca en 30 minutos. Si no has sido tú, puedes ignorar este correo.</p>
    `
  });
}

module.exports = { enviarEmailRecuperacion };
