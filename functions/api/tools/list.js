// GET /api/tools/list[?tool=calorie-calculator]
// 需要已登录。不带 tool 参数则返回该用户全部工具的历史结果；
// 带了就只返回那一种工具的记录（方便单独给某个计算器的历史页用）。

import { requireUser } from '../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'not_authenticated' }), { status: 401 });
  }

  const url = new URL(request.url);
  const toolFilter = url.searchParams.get('tool');

  const query = toolFilter
    ? env.DB.prepare(
        `SELECT id, tool, recorded_at, summary_label, summary_value, data
         FROM tool_results WHERE user_id = ? AND tool = ? ORDER BY recorded_at ASC`
      ).bind(user.id, toolFilter)
    : env.DB.prepare(
        `SELECT id, tool, recorded_at, summary_label, summary_value, data
         FROM tool_results WHERE user_id = ? ORDER BY recorded_at ASC`
      ).bind(user.id);

  const { results } = await query.all();

  // Parse the stored JSON data blob back into an object for each row
  const records = results.map(r => ({ ...r, data: safeParse(r.data) }));

  return new Response(JSON.stringify({ records }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function safeParse(s) {
  try { return JSON.parse(s); } catch (e) { return {}; }
}
