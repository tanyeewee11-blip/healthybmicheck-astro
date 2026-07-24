// GET /api/records/list
// 需要已登录（session cookie）。返回该用户全部历史记录，按时间正序，方便直接画图。

import { requireUser } from '../../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'not_authenticated' }), { status: 401 });
  }

  const { results } = await env.DB.prepare(
    `SELECT recorded_at, weight_kg, height_cm, bmi, bmi_category, standard
     FROM health_records
     WHERE user_id = ?
     ORDER BY recorded_at ASC`
  ).bind(user.id).all();

  return new Response(JSON.stringify({ records: results }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
