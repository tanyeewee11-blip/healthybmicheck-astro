// POST /api/auth/request-link
// Body: { email, purpose: 'login'|'signup', consent_save_records, consent_marketing_email }
//
// 生成一次性 token，存进 D1，用 Resend 发验证邮件。
// 不管邮箱是否已注册都返回同样的成功提示，避免暴露"这个邮箱有没有注册过"。

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => null);
  if (!body || !isValidEmail(body.email)) {
    return new Response(JSON.stringify({ error: 'invalid_email' }), { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const purpose = body.purpose === 'signup' ? 'signup' : 'login';
  const consentSave = body.consent_save_records ? 1 : 0;
  const consentMarketing = body.consent_marketing_email ? 1 : 0;

  // PDPA: 保存记录的同意是必选的核心功能，没勾选就不允许继续
  if (!consentSave) {
    return new Response(JSON.stringify({ error: 'consent_required' }), { status: 400 });
  }

  const token = randomToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15分钟有效

  await env.DB.prepare(
    `INSERT INTO magic_links (email, token, purpose, consent_save_records, consent_marketing_email, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(email, token, purpose, consentSave, consentMarketing, expiresAt).run();

  const verifyUrl = `https://healthybmicheck.com/api/auth/verify?token=${token}`;

  const emailResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'HealthyBMICheck <no-reply@healthybmicheck.com>',
      to: [email],
      subject: '确认您的登录链接 / Confirm your sign-in link',
      html: `
        <p>点击下面的链接即可登录 HealthyBMICheck，链接 15 分钟内有效：</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>如果这不是您本人的请求，请忽略这封邮件。</p>
      `,
    }),
  });

  if (!emailResp.ok) {
    return new Response(JSON.stringify({ error: 'email_send_failed' }), { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
