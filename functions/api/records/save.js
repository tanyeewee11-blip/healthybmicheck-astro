// POST /api/records/save
// 需要已登录（session cookie）。Body: { weight_kg, height_cm, bmi, bmi_category, standard }

import { requireUser } from '../../_lib/auth.js';

export async function onRequestPost({ request, env }) {
  const user = await requireUser(request, env);
  if (!user) {
    return new Response(JSON.stringify({ error: 'not_authenticated' }), { status: 401 });
  }
  if (!user.consent_save_records) {
    return new Response(JSON.stringify({ error: 'consent_missing' }), { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { weight_kg, height_cm, bmi, bmi_category, standard } = body || {};

  if (
    typeof weight_kg !== 'number' || weight_kg <= 0 ||
    typeof height_cm !== 'number' || height_cm <= 0 ||
    typeof bmi !== 'number' || bmi <= 0 ||
    typeof bmi_category !== 'string'
  ) {
    return new Response(JSON.stringify({ error: 'invalid_payload' }), { status: 400 });
  }

  await env.DB.prepare(
    `INSERT INTO health_records (user_id, weight_kg, height_cm, bmi, bmi_category, standard)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(user.id, weight_kg, height_cm, bmi, bmi_category, standard === 'asian' ? 'asian' : 'who').run();

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
