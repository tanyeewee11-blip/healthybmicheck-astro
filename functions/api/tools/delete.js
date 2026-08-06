// POST /api/tools/delete
// 需要已登录。Body: { id }
// 同样要校验记录属于当前用户，防止靠猜 id 删别人的数据。

import { requireUser } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'not_authenticated' }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = body && Number(body.id);
  if (!id || !Number.isInteger(id)) {
    return new Response(JSON.stringify({ error: 'invalid_id' }), { status: 400 });
  }

  const result = await env.DB.prepare(
    `DELETE FROM tool_results WHERE id = ? AND user_id = ?`
  ).bind(id, user.id).run();

  if (!result.meta || result.meta.changes === 0) {
    return new Response(JSON.stringify({ error: 'not_found' }), { status: 404 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
