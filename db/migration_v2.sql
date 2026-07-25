-- 迁移：给 magic_links 表加上"待保存记录"字段
-- 之前的设计依赖浏览器 localStorage 跨窗口传递计算结果，实测发现在
-- 无痕模式/跨设备点击邮件链接时会失效。改为服务器端在 token 里直接
--带上这条记录，验证登录成功那一刻就直接存进 health_records。
ALTER TABLE magic_links ADD COLUMN pending_weight_kg REAL;
ALTER TABLE magic_links ADD COLUMN pending_height_cm REAL;
ALTER TABLE magic_links ADD COLUMN pending_bmi REAL;
ALTER TABLE magic_links ADD COLUMN pending_bmi_category TEXT;
ALTER TABLE magic_links ADD COLUMN pending_standard TEXT;
