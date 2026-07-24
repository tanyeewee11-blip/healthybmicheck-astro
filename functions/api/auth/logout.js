// POST /api/auth/logout
// 删除 session（数据库 + cookie）

import { getCookie } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const sessionToken = getCookie(request, 'session');
  if (sessionToken) {
    await env.DB.prepare(`DELETE FROM sessions WHERE session_token = ?`).bind(sessionToken).run();
  }

  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.append('Set-Cookie', 'session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax');

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
