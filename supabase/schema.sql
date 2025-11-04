-- coach_logs テーブル作成
CREATE TABLE IF NOT EXISTS coach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  question TEXT NOT NULL,
  answer_summary VARCHAR(100) NOT NULL,
  answer_body TEXT NOT NULL,
  steps JSONB NOT NULL,
  model VARCHAR(40) NOT NULL DEFAULT 'gpt-4o-mini',
  latency_ms INTEGER,
  trace_id VARCHAR(64),
  rating INTEGER CHECK (rating IN (0, 1))
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_coach_logs_created_at ON coach_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_logs_trace_id ON coach_logs(trace_id);

-- RLS無効化（検証環境）
ALTER TABLE coach_logs DISABLE ROW LEVEL SECURITY;

-- コメント追加
COMMENT ON TABLE coach_logs IS 'AIコーチ応答ログ';
COMMENT ON COLUMN coach_logs.trace_id IS 'LangfuseトレースID（ダッシュボード連携用）';
COMMENT ON COLUMN coach_logs.rating IS '評価（0: 👎, 1: 👍, null: 未評価）';
