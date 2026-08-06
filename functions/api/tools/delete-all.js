// POST /api/tools/delete-all
// 需要已登录。Body（可选）: { tool }
// 不带 tool 就清空该用户全部工具的历史；带了就只清空那一种工具的。

import { requireUser } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'not_authenticated' }), { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const tool = body && typeof body.tool === 'string' ? body.tool : null;

  if (tool) {
    await env.DB.prepare(`DELETE FROM tool_results WHERE user_id = ? AND tool = ?`).bind(user.id, tool).run();
  } else {
    await env.DB.prepare(`DELETE FROM tool_results WHERE user_id = ?`).bind(user.id).run();
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
