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
      subject: 'Confirm your sign-in to HealthyBMICheck',
      html: `
        <div style="background-color:#F7F4EF;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E0D8;">
            <tr>
              <td style="padding:32px 32px 24px;text-align:center;">
                <div style="font-size:20px;font-weight:700;color:#1A1714;">
                  healthy<span style="color:#2D6A4F;">bmicheck</span>.com
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <h1 style="font-size:18px;font-weight:600;color:#1A1714;margin:0 0 12px;text-align:center;">
                  Confirm your sign-in
                </h1>
                <p style="font-size:14px;line-height:1.6;color:#6B6560;margin:0 0 24px;text-align:center;">
                  Click the button below to securely sign in to your account.
                  This link expires in 15 minutes and can only be used once.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;text-align:center;">
                <a href="${verifyUrl}"
                   style="display:inline-block;background-color:#1A1714;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">
                  Sign in to HealthyBMICheck
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <p style="font-size:12px;line-height:1.6;color:#918B85;margin:0;text-align:center;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${verifyUrl}" style="color:#2D6A4F;word-break:break-all;">${verifyUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#F7F4EF;border-top:1px solid #E5E0D8;">
                <p style="font-size:12px;line-height:1.6;color:#918B85;margin:0;text-align:center;">
                  If you didn't request this, you can safely ignore this email —
                  no account changes will be made.
                </p>
              </td>
            </tr>
          </table>
        </div>
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
