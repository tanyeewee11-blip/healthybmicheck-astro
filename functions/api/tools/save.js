// POST /api/tools/save
// 需要已登录。用于「已经登录的用户」直接保存某个计算器的结果
// （不用再走一次邮箱验证——那套流程只是给「还没登录」的用户用的，
// 见 /api/auth/request-link 的 pending_tool_result）。
// Body: { tool, summary_label, summary_value, data }

import { requireUser } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'not_authenticated' }), { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.tool !== 'string' || !body.tool ||
    typeof body.summary_label !== 'string' || !body.summary_label ||
    typeof body.data !== 'object' || body.data === null
  ) {
    return new Response(JSON.stringify({ error: 'invalid_payload' }), { status: 400 });
  }

  const summaryValue = typeof body.summary_value === 'number' ? body.summary_value : null;

  await env.DB.prepare(
    `INSERT INTO tool_results (user_id, tool, summary_label, summary_value, data)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(user.id, body.tool, body.summary_label, summaryValue, JSON.stringify(body.data)).run();

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
