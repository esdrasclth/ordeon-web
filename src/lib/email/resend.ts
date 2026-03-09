// src/lib/email/resend.ts
// Servicio central de envío de correos con Resend

import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

// ── Templates ────────────────────────────────────────────────────────────────

export function buildWelcomeEmail({
  adminName,
  companyName,
  email,
  password,
  loginUrl,
}: {
  adminName: string
  companyName: string
  email: string
  password: string
  loginUrl: string
}) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a Ordeon</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f5f5; color: #1e293b; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #fff;
               border-radius: 16px; overflow: hidden;
               box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header  { background: linear-gradient(135deg, #031926 0%, #0d3a50 100%);
               padding: 36px 40px; text-align: center; }
    .logo    { font-size: 28px; font-weight: 900; color: #F4E9CD;
               font-family: Georgia, serif; letter-spacing: -0.5px; }
    .logo span { color: #468189; }
    .tagline { color: rgba(244,233,205,0.6); font-size: 12px; margin-top: 4px; }
    .body    { padding: 36px 40px; }
    .greeting { font-size: 20px; font-weight: 700; color: #031926; margin-bottom: 12px; }
    .text    { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 20px; }
    .creds   { background: #f8fafc; border: 1px solid #e2e8f0;
               border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
    .creds h3 { font-size: 11px; font-weight: 700; text-transform: uppercase;
                letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 14px; }
    .cred-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .cred-label { font-size: 12px; color: #64748b; width: 100px; flex-shrink: 0; }
    .cred-value { font-size: 13px; font-weight: 600; color: #031926;
                  background: #fff; padding: 6px 12px; border-radius: 6px;
                  border: 1px solid #e2e8f0; font-family: monospace; }
    .btn-wrap { text-align: center; margin: 28px 0 8px; }
    .btn     { display: inline-block; padding: 13px 36px; background: #468189;
               color: #F4E9CD; text-decoration: none; border-radius: 10px;
               font-weight: 700; font-size: 14px; letter-spacing: 0.02em; }
    .warning { background: #fffbeb; border: 1px solid #fde68a;
               border-radius: 8px; padding: 12px 16px; margin: 20px 0;
               font-size: 12px; color: #92400e; line-height: 1.6; }
    .footer  { padding: 20px 40px; border-top: 1px solid #f1f5f9;
               text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Ord<span>eon</span></div>
      <div class="tagline">Sistema de Gestión Empresarial</div>
    </div>

    <div class="body">
      <p class="greeting">¡Bienvenido, ${adminName}! 👋</p>
      <p class="text">
        Tu cuenta de administrador para <strong>${companyName}</strong> en Ordeon ERP
        ha sido creada exitosamente. A continuación encontrarás tus credenciales de acceso:
      </p>

      <div class="creds">
        <h3>🔐 Credenciales de acceso</h3>
        <div class="cred-row">
          <span class="cred-label">Correo:</span>
          <span class="cred-value">${email}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Contraseña:</span>
          <span class="cred-value">${password}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Empresa:</span>
          <span class="cred-value">${companyName}</span>
        </div>
      </div>

      <div class="warning">
        ⚠️ <strong>Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña
        después de ingresar por primera vez. No compartas estas credenciales con nadie.
      </div>

      <div class="btn-wrap">
        <a href="${loginUrl}" class="btn">Ingresar al sistema →</a>
      </div>
    </div>

    <div class="footer">
      Este correo fue enviado automáticamente por Ordeon ERP.<br/>
      Si no esperabas este correo, contáctanos de inmediato.
    </div>
  </div>
</body>
</html>`

  const text = `Bienvenido a Ordeon ERP, ${adminName}!\n\nTus credenciales de acceso para ${companyName}:\n\nCorreo: ${email}\nContraseña: ${password}\n\nIngresa en: ${loginUrl}\n\nTe recomendamos cambiar tu contraseña al ingresar por primera vez.`

  return { html, text }
}
