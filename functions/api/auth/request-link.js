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

  // 可选：如果这次请求是从计算器结果页发起的（带着一条待保存的记录），
  // 就把它跟 token 一起存进数据库，而不是让浏览器用 localStorage 传递——
  // 这样不管用户在哪个设备/浏览器点开邮件链接，这条记录都能正确落地。
  const record = body.pending_record;
  const hasRecord = record &&
    typeof record.weight_kg === 'number' &&
    typeof record.height_cm === 'number' &&
    typeof record.bmi === 'number' &&
    typeof record.bmi_category === 'string';

  const token = randomToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15分钟有效

  await env.DB.prepare(
    `INSERT INTO magic_links
       (email, token, purpose, consent_save_records, consent_marketing_email,
        pending_weight_kg, pending_height_cm, pending_bmi, pending_bmi_category, pending_standard,
        expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    email, token, purpose, consentSave, consentMarketing,
    hasRecord ? record.weight_kg : null,
    hasRecord ? record.height_cm : null,
    hasRecord ? record.bmi : null,
    hasRecord ? record.bmi_category : null,
    hasRecord ? (record.standard === 'asian' ? 'asian' : 'who') : null,
    expiresAt
  ).run();

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
