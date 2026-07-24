// 共用工具：从请求的 cookie 里取出 session，校验有效性，返回对应的 user
// 各个需要登录态的 API 端点（records/save, records/list 等）都引用这个函数

export function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
}

export async function requireUser(request, env) {
  const sessionToken = getCookie(request, 'session');
  if (!sessionToken) return null;

  const session = await env.DB.prepare(
    `SELECT * FROM sessions WHERE session_token = ?`
  ).bind(sessionToken).first();

  if (!session || new Date(session.expires_at) < new Date()) return null;

  const user = await env.DB.prepare(
    `SELECT * FROM users WHERE id = ?`
  ).bind(session.user_id).first();

  return user || null;
}
