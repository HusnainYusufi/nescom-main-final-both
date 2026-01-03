'use strict';

/**
 * HTML email for new users.
 * @param {Object} p
 * @param {string} p.appName
 * @param {string} p.name
 * @param {string} p.email
 * @param {string} p.password   // temp/plain password at creation
 * @param {string} p.role
 * @param {string} p.loginUrl
 * @param {string} [p.supportEmail]
 */
function newUserWelcome(p = {}) {
  const appName = p.appName || 'Legend Delivery';
  const name = p.name || 'there';
  const email = p.email || '';
  const password = p.password || '—';
  const role = (p.role || '').toUpperCase();
  const loginUrl = p.loginUrl || '#';
  const supportEmail = p.supportEmail || 'support@example.com';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Welcome to ${appName}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body{ margin:0; background:#f5f7fb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,'Helvetica Neue',sans-serif; color:#1f2937; }
  .wrap{ max-width:640px; margin:0 auto; padding:24px; }
  .card{ background:#fff; border-radius:14px; box-shadow:0 10px 25px rgba(17,24,39,.08); overflow:hidden; }
  .hero{ background:linear-gradient(135deg,#0ea5e9,#6366f1); color:#fff; padding:28px 28px; }
  .brand{ font-weight:800; font-size:22px; letter-spacing:.3px }
  .hello{ margin:14px 0 0; font-size:18px; }
  .content{ padding:24px 28px 30px }
  .pill{ display:inline-block; padding:6px 10px; border-radius:999px; background:#eef2ff; color:#4338ca; font-size:12px; font-weight:700; letter-spacing:.3px; }
  .grid{ display:grid; gap:12px; grid-template-columns:1fr; }
  .row{ background:#f8fafc; border:1px solid #e5e7eb; border-radius:10px; padding:12px 14px; }
  .label{ font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:.4px; }
  .val{ font-weight:700; margin-top:2px; word-break:break-all; }
  .cta{ margin-top:22px; }
  .button{ display:inline-block; padding:12px 18px; border-radius:10px; background:#0ea5e9; color:#fff !important; text-decoration:none; font-weight:700; }
  .muted{ color:#6b7280; font-size:13px; line-height:1.6; margin-top:16px; }
  .footer{ text-align:center; color:#9ca3af; font-size:12px; padding:20px 12px 10px }
  @media (min-width:520px){ .grid{ grid-template-columns:1fr 1fr } }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="hero">
        <div class="brand">${appName}</div>
        <div class="hello">Welcome, ${name}! 🎉</div>
        <div style="margin-top:8px">Your account is ready. Here are your credentials:</div>
      </div>
      <div class="content">
        <div class="grid">
          <div class="row"><div class="label">Email</div><div class="val">${email}</div></div>
          <div class="row"><div class="label">Temporary Password</div><div class="val">${password}</div></div>
          <div class="row"><div class="label">Role</div><div class="val"><span class="pill">${role}</span></div></div>
        </div>

        <div class="cta">
          <a class="button" href="${loginUrl}" target="_blank" rel="noopener">Go to Login</a>
        </div>

        <div class="muted">
          For your security, please sign in and change your password immediately from your profile/settings.<br/>
          Need help? Email <a href="mailto:${supportEmail}">${supportEmail}</a>.
        </div>
      </div>
    </div>
    <div class="footer">© ${new Date().getFullYear()} ${appName}. All rights reserved.</div>
  </div>
</body>
</html>
  `;
}

module.exports = { newUserWelcome };
