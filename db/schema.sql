-- ============================================================
-- HealthyBMICheck.com — 用户账号系统 D1 数据库结构
-- ============================================================

-- 用户表：只存邮箱，不存密码（魔法链接登录，无密码）
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  -- PDPA 合规：两个用途要分开记录同意状态，不能合并成一个"同意"
  consent_save_records INTEGER NOT NULL DEFAULT 0,   -- 同意保存健康记录
  consent_marketing_email INTEGER NOT NULL DEFAULT 0, -- 同意接收营销/提醒邮件
  consent_updated_at TEXT
);

-- 魔法链接 token 表：一次性、短时效
CREATE TABLE magic_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,       -- 32字节随机字符串，塞进邮件链接里
  purpose TEXT NOT NULL,             -- 'login' 或 'signup'
  consent_save_records INTEGER NOT NULL DEFAULT 0,   -- 本次请求时勾选的同意状态，verify成功后写入users表
  consent_marketing_email INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,          -- 建议15分钟后过期
  used_at TEXT,                      -- 用过一次后标记，防止重放攻击
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_magic_links_token ON magic_links(token);

-- 登录会话表：验证通过后签发，存在 cookie 里的是 session_token
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  session_token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,          -- 建议30天
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sessions_token ON sessions(session_token);

-- 健康记录表：BMI / 体重 历史追踪
CREATE TABLE health_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  weight_kg REAL NOT NULL,
  height_cm REAL NOT NULL,
  bmi REAL NOT NULL,
  bmi_category TEXT NOT NULL,        -- e.g. 'Normal', 'Overweight'
  standard TEXT NOT NULL DEFAULT 'who' -- 'who' 或 'asian'（对应你双标准的功能）
);
CREATE INDEX idx_health_records_user ON health_records(user_id, recorded_at);
