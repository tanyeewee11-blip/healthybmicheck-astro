// GET /api/auth/verify?token=xxxx
//
// 校验一次性 token，创建/更新用户，签发 30 天 session，
// 设置 httpOnly cookie，然后跳转回「我的进度」页面。

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return Response.redirect('https://healthybmicheck.com/login-error', 302);
  }

  const link = await env.DB.prepare(
    `SELECT * FROM magic_links WHERE token = ?`
  ).bind(token).first();

  // token 不存在 / 已过期 / 已用过 → 一律拒绝，不细分原因（避免信息泄露给攻击者）
  if (!link || link.used_at || new Date(link.expires_at) < new Date()) {
    return Response.redirect('https://healthybmicheck.com/login-error', 302);
  }

  // 标记 token 已使用，防止重放
  await env.DB.prepare(
    `UPDATE magic_links SET used_at = datetime('now') WHERE token = ?`
  ).bind(token).run();

  // 找用户，没有就创建（首次用魔法链接即完成"注册"）
  let user = await env.DB.prepare(
    `SELECT * FROM users WHERE email = ?`
  ).bind(link.email).first();

  if (!user) {
    await env.DB.prepare(
      `INSERT INTO users (email, consent_save_records, consent_marketing_email, consent_updated_at)
       VALUES (?, ?, ?, datetime('now'))`
    ).bind(link.email, link.consent_save_records, link.consent_marketing_email).run();
    user = await env.DB.prepare(`SELECT * FROM users WHERE email = ?`).bind(link.email).first();
  } else {
    // 已有用户再次登录：如果这次勾选的同意状态有变化，更新一下
    await env.DB.prepare(
      `UPDATE users SET consent_save_records = ?, consent_marketing_email = ?, consent_updated_at = datetime('now')
       WHERE id = ?`
    ).bind(link.consent_save_records, link.consent_marketing_email, user.id).run();
  }

  const sessionToken = randomToken();
  const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30天

  await env.DB.prepare(
    `INSERT INTO sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)`
  ).bind(user.id, sessionToken, sessionExpiresAt).run();

  const headers = new Headers();
  headers.set('Location', 'https://healthybmicheck.com/my-progress');
  headers.append(
    'Set-Cookie',
    `session=${sessionToken}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`
  );

  return new Response(null, { status: 302, headers });
}
