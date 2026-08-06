-- 迁移：新增通用工具结果表，用于扩展"保存追踪"到BMI以外的计算器

CREATE TABLE tool_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  tool TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  summary_label TEXT NOT NULL,
  summary_value REAL,
  data TEXT NOT NULL
);
CREATE INDEX idx_tool_results_user ON tool_results(user_id, tool, recorded_at);

-- magic_links 也要能带着"待保存的通用工具结果"一起走（跟BMI那次的
-- pending_* 字段是同一个设计思路：不依赖浏览器localStorage跨设备传值）
ALTER TABLE magic_links ADD COLUMN pending_tool TEXT;
ALTER TABLE magic_links ADD COLUMN pending_summary_label TEXT;
ALTER TABLE magic_links ADD COLUMN pending_summary_value REAL;
ALTER TABLE magic_links ADD COLUMN pending_tool_data TEXT;
