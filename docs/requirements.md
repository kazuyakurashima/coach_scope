# 超ミニ・コーチングアプリ（Supabase + Langfuse 検証用）要件定義書 v1.0

## 📋 変更履歴

| バージョン | 日付       | 変更内容      |
| ----- | -------- | --------- |
| v1.0  | 2025-11-04 | 初版作成      |

---

## 1. 概要

Langfuseの動作を理解・検証するための簡易AIコーチングアプリ。
学習者が質問を入力し、AI（GPT-4o-mini）が短い助言と次の一歩を返す。
返答はSupabaseに保存され、Langfuseにトレース情報を送る。

### 🎯 目的

> Langfuse の仕組みを理解・検証するために、
> 最小限のコーチングアプリを Supabase ＋ GPT-4o-mini で構築する。
> Auth 連携は行わず、AI応答ログを Supabase に保存。
> Langfuse のフックポイントを含めた "軽量実験モデル" として設計。

---

## 2. 開発目的

* Langfuseの「トレース」「ジェネレーション」「スコア」機能を実際に確認する
* Supabaseとの組み合わせでログを永続化する構成を学ぶ
* StudySparkへの将来的導入を見据え、最小構成で動作検証する

---

## 3. スコープ

| 区分   | 内容                               |
| ---- | -------------------------------- |
| 対象   | 学習者がAIコーチに質問し、返答を受け取る一連の流れ       |
| 含む   | Supabase連携・Langfuseフック・ログ保存・簡易UI |
| 含まない | Auth（認証）・複数ロール・UIデザインの最適化        |

---

## 4. 想定利用者

* **ロール**：生徒のみ
* **利用想定**：
  * 質問例：「今日の勉強、どこからやればいい？」
  * 出力：「まずは昨日の復習を5分だけやってみよう！」

---

## 5. システム構成

| コンポーネント                 | 役割                       |
| ----------------------- | ------------------------ |
| Next.js（フロント＆API）       | 入力画面、API呼び出し、Langfuseフック |
| Supabase                | 永続化（AIログ保存）              |
| Langfuse Cloud          | AI応答トレース・可視化             |
| OpenAI API（GPT-4o-mini） | コーチ応答生成                  |

---

## 6. 機能要件

### 6.1 コーチング機能

* 入力フォームに自由記述（最大200文字）
* 「送信」クリックでAI呼び出し
* GPT-4o-miniが短い助言＋次の一歩を生成（JSON形式で出力）
* 応答を画面表示・Supabase保存・Langfuse送信

#### エラーハンドリング

| エラー種別            | 対応                                            |
| ---------------- | --------------------------------------------- |
| OpenAI API失敗時    | トースト表示：「一時的にコーチに繋がりません。しばらくしてから再試行してください」       |
| Supabase保存失敗時    | Langfuseには送信するが、トレースにエラーを記録。ユーザーには保存失敗を通知     |
| Langfuse送信失敗時    | Supabaseログには記録。ユーザー体験は継続（バックグラウンドでエラーログ記録）    |
| 連続リクエスト（60秒以内）  | トースト表示：「少し待ってから再試行してください」                     |

### 6.2 履歴機能

* Supabaseに保存されたログを一覧で表示（最新5件）
* ページ再読込時にも確認できる

### 6.3 Langfuseトレース

AI呼び出し時に、以下をLangfuseへ送信。

| 要素                | 内容                                                                   |
| ----------------- | -------------------------------------------------------------------- |
| `trace.name`      | `"coach_chat"`                                                       |
| `generation.name` | `"coach_reply"`                                                      |
| `metadata`        | `{ feature: "coach_chat", role: "student", prompt_version: "v1.0", steps: [...] }` |
| `model`           | `"gpt-4o-mini"`                                                      |
| `latency`         | 実行時間(ms)                                                             |
| `cost`            | トークンコスト（将来拡張）                                                        |

### 6.4 フィードバック機能

* 「👍 / 👎」評価ボタンを配置
* クリック時に：
  1. `coach_logs.rating` を更新（0: 👎, 1: 👍）
  2. Langfuse の `trace.score({ name: "useful", value: 0|1 })` を送信
* トースト表示：「フィードバックありがとうございます！」

---

## 7. 非機能要件

| 項目     | 要件                                          |
| ------ | ------------------------------------------- |
| 応答時間   | 平均3秒以内（P95：5秒以内）                            |
| セキュリティ | HTTPS通信、環境変数管理（APIキー類）                      |
| プライバシー | 個人情報を入力しないようUIで注意書き表示                       |
| ログ保持   | Supabase内で30日間保持（削除手動可）                     |
| レート制限  | IPベースで1分間に1回まで（連打防止・検証用）                   |
| エラーUI  | トースト通知（右上または下部）<br>柔らかい色合い（青/黄系）で安心感を優先 |

---

## 8. データモデル（Supabase）

### テーブル定義：`coach_logs`

| カラム名              | 型                 | 制約           | 説明                                       |
| ----------------- | ----------------- | ------------ | ---------------------------------------- |
| `id`              | `uuid`            | PRIMARY KEY  | ログID（自動生成）                               |
| `created_at`      | `timestamptz`     | NOT NULL     | 作成日時                                     |
| `question`        | `text`            | NOT NULL     | ユーザーの質問（最大200文字）                         |
| `answer_summary`  | `varchar(100)`    | NOT NULL     | AI応答の要約（40文字以内）                          |
| `answer_body`     | `text`            | NOT NULL     | AI応答の本文（120文字以内）                         |
| `steps`           | `jsonb`           | NOT NULL     | 次の一歩（配列形式）<br>例：`["ドリルを5問", "ノートまとめ"]` |
| `model`           | `varchar(40)`     | DEFAULT 'gpt-4o-mini' | 使用モデル                                    |
| `latency_ms`      | `integer`         | NULL         | 応答時間（ミリ秒）                                |
| `trace_id`        | `varchar(64)`     | NULL         | LangfuseトレースID（ダッシュボード連携用）               |
| `rating`          | `integer`         | NULL         | 評価（0: 👎, 1: 👍, null: 未評価）              |

#### stepsカラムの構造例

```json
{
  "steps": [
    "ドリルを5問解く",
    "間違えた問題をノートにまとめる",
    "次回は時間を測ってやってみよう"
  ]
}
```

#### trace_idについて

LangfuseのトレースIDを保存し、Langfuseダッシュボードとの紐付けに使用。
Langfuse UIで該当トレースを直接参照可能。

#### RLS（Row Level Security）設定

**検証環境**：RLS無効化（全データ公開）

```sql
-- 検証用（Authなし）
ALTER TABLE coach_logs DISABLE ROW LEVEL SECURITY;
```

**本番環境（StudySpark統合時）**：RLS有効化 + Auth連携

```sql
-- 本番用（Auth連携時）
ALTER TABLE coach_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs"
  ON coach_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own logs"
  ON coach_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 9. APIインターフェイス

### 9.1 `/api/coach/reply` (POST)

#### リクエスト

```json
{
  "question": "今日の勉強、どこからやればいい？"
}
```

#### レスポンス（成功時）

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "summary": "昨日の復習をしよう",
    "body": "昨日の内容を軽く復習すると記憶が安定します。10分だけ集中してやってみよう！",
    "steps": ["ノートを読み返す", "例題を1問解く"],
    "trace_id": "langfuse-trace-id"
  }
}
```

#### レスポンス（エラー時）

```json
{
  "success": false,
  "error": "OpenAI APIに接続できませんでした"
}
```

### 9.2 `/api/coach/logs` (GET)

#### レスポンス

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "created_at": "2025-11-04T10:00:00Z",
      "question": "今日の勉強、どこからやればいい？",
      "answer_summary": "昨日の復習をしよう",
      "rating": 1
    }
  ]
}
```

### 9.3 `/api/coach/feedback` (POST)

#### リクエスト

```json
{
  "log_id": "uuid",
  "rating": 1
}
```

#### レスポンス

```json
{
  "success": true,
  "message": "フィードバックを保存しました"
}
```

---

## 10. 環境変数設定

| 環境変数                              | 内容                                        | 用途       |
| --------------------------------- | ----------------------------------------- | -------- |
| `OPENAI_API_KEY`                  | OpenAI APIキー                              | AI応答生成  |
| `NEXT_PUBLIC_SUPABASE_URL`        | SupabaseプロジェクトURL                         | DB接続    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`   | Supabase匿名キー（公開用）                         | DB接続    |
| `LANGFUSE_SECRET_KEY`             | Langfuseサーバー側秘密鍵                          | トレース送信 |
| `NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY` | Langfuseクライアント用公開鍵                        | スコア送信  |
| `LANGFUSE_BASE_URL`               | `https://cloud.langfuse.com`（Cloud利用時）    | 接続先    |

### Langfuse SDK 初期化

**初期化タイミング**：サーバーサイドのみ（クライアントサイドでの初期化は不要）

**初期化場所**：`/api/coach/reply` 内で Langfuse インスタンスを生成

```typescript
import { Langfuse } from 'langfuse';

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
});
```

---

## 11. プロンプト仕様（v1.0）

### システムプロンプト

```
あなたは優しい学習コーチです。
生徒の質問に対して、短く行動を促すアドバイスをください。

次のフォーマットのJSONで出力してください：
{
  "summary": "要約（40文字以内）",
  "body": "本文（120文字以内）",
  "steps": ["次の一歩1（20文字以内）", "次の一歩2（20文字以内）"]
}

制約：
- summaryは40文字以内
- bodyは120文字以内
- stepsは1〜3個、各20文字以内、命令形で記述
```

### GPT-4o-mini 出力例

```json
{
  "summary": "昨日の復習をしよう",
  "body": "昨日の内容を軽く復習すると記憶が安定します。10分だけ集中してやってみよう！",
  "steps": [
    "ノートを読み返す",
    "例題を1問解く",
    "わからなかった箇所をメモする"
  ]
}
```

### OpenAI API呼び出し設定

```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question }
  ],
  response_format: { type: 'json_object' },
  temperature: 0.7,
  max_tokens: 300
});
```

---

## 12. UI要件（最小構成）

### 画面構成：ホーム画面

| 要素        | 説明                                              |
| --------- | ----------------------------------------------- |
| 質問入力欄     | `<textarea>`（最大200文字、プレースホルダー：「今日の勉強、どこから始めよう？」） |
| 送信ボタン     | 「コーチに聞く」ボタン（入力中はローディング表示）                       |
| 返答カード     | 要約・本文・次の一歩をカード形式で表示                             |
| 評価ボタン     | 👍 / 👎 ボタン（返答後に表示、クリックでLangfuseスコア送信）          |
| 履歴リスト     | 最新5件を時系列で表示（質問・要約・評価を表示）                        |
| 注意書き      | 「※個人情報は入力しないでください」                              |
| トースト      | エラー・成功メッセージを右上または下部に表示                          |

### デザイン方針

* **配色**：白背景 × 青/緑系アクセントカラー（信頼感＋優しさ）
* **フォント**：丸ゴシック系（Noto Sans JP または Inter）
* **レスポンシブ**：モバイルファースト（スマホで快適に使える）
* **トースト**：react-hot-toast または shadcn/ui Toast コンポーネント

---

## 13. Langfuse連携のフックポイント一覧

| タイミング   | 呼び出し                                                              | 説明           |
| ------- | ----------------------------------------------------------------- | ------------ |
| 質問送信時   | `trace = langfuse.trace({ name: "coach_chat", metadata: {...} })` | トレース開始       |
| AI応答完了時 | `trace.generation({ name: "coach_reply", ... })`                  | 応答詳細を送信      |
| 応答成功後   | `trace.update({ output: ... })`                                   | 最終出力を記録      |
| 処理完了時   | `await langfuse.flushAsync()`                                     | 送信確定（非同期）    |
| 評価時     | `trace.score({ name: "useful", value: 0\|1 })`                    | 👍👎スコア反映     |
| 例外時     | `trace.update({ level: "ERROR", statusMessage: ... })`            | エラー内容を記録     |

### トレース実装例

```typescript
const trace = langfuse.trace({
  name: 'coach_chat',
  userId: 'anonymous', // Auth未実装のため
  metadata: {
    feature: 'coach_chat',
    role: 'student',
    prompt_version: 'v1.0'
  }
});

const generation = trace.generation({
  name: 'coach_reply',
  model: 'gpt-4o-mini',
  input: question,
  metadata: {
    temperature: 0.7,
    max_tokens: 300
  }
});

// AI応答後
generation.end({
  output: responseData,
  usage: {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens
  }
});

// 最終確定
await langfuse.flushAsync();
```

---

## 14. 開発・検証フロー

| 段階     | 内容                                         | 成果物                           |
| ------ | ------------------------------------------ | ----------------------------- |
| Step 1 | Supabaseプロジェクト作成＋`coach_logs`テーブル定義        | DDL SQL、接続確認スクリプト             |
| Step 2 | OpenAI API（GPT-4o-mini）接続確認                | プロンプトテスト、JSON出力確認            |
| Step 3 | Langfuse接続・トレース確認                          | トレースがLangfuse UIに表示されることを確認   |
| Step 4 | フロント接続（入力→返答→保存）                           | UIコンポーネント、API Routes         |
| Step 5 | 👍👎ボタン実装                                   | フィードバック機能、Langfuseスコア送信      |
| Step 6 | StudySpark転用時の項目マッピング確認                    | 統合設計書、Auth連携手順書             |

---

## 15. 成果物

### デリバラブル

* ✅ 動作デモ（質問→返答→Langfuseダッシュボード表示まで）
* ✅ Supabaseテーブル（`coach_logs`）にログが保存されること
* ✅ Langfuse側でトレース一覧とスコアが確認できること
* ✅ StudySpark統合時に差し替え可能な構成図とAPI定義書

### ドキュメント

* 要件定義書（本書）
* API仕様書（Swagger/OpenAPI形式、任意）
* Supabase DDL（テーブル定義SQL）
* 環境変数設定ガイド（`.env.example`）
* Langfuse統合ガイド（トレース設定・分析方法）

---

## 16. 今後の拡張ポイント

| フェーズ | 内容                                 | 主な変更点                                     |
| ---- | ---------------------------------- | ----------------------------------------- |
| v1.1 | 認証(Auth)追加＋user_id紐付け             | Supabase Auth統合、RLS有効化、`user_id`カラム追加   |
| v1.2 | Langfuseスコア集計ダッシュボード連携             | カスタムダッシュボード作成、スコア分析API                    |
| v1.3 | StudySpark統合（profilesとの外部キー化）      | `coach_logs.user_id` → `profiles.id` 外部キー |
| v2.0 | マルチターン対話（会話履歴を考慮したAI応答）           | `conversations`テーブル追加、コンテキスト管理            |

---

## 17. 成功指標（検証目的）

| 指標                         | 目標値        | 確認方法                                  |
| -------------------------- | ---------- | ------------------------------------- |
| Langfuseでトレースが視覚化できる       | 100%       | Langfuse UIで`coach_chat`トレースを確認       |
| Supabaseでログが正しく残る          | 100%       | `coach_logs`テーブルをクエリして確認              |
| 👍👎評価がLangfuseに反映される       | 100%       | スコアがLangfuse UIに表示されることを確認            |
| 全処理（入力→返答→保存→送信）の完了時間     | 5秒以内（P95） | ブラウザDevToolsのNetworkタブで計測            |
| エラーハンドリングが適切に機能する          | 100%       | 意図的にAPIキーを無効化してエラートーストが表示されることを確認    |
| レート制限が機能する                 | 100%       | 60秒以内に2回送信を試み、2回目がブロックされることを確認      |

---

## 18. リスクと対策

| リスク                  | 影響度 | 対策                                          |
| -------------------- | --- | ------------------------------------------- |
| OpenAI APIのレート制限に到達  | 中   | 環境変数で`OPENAI_API_KEY`をTier 2以上に設定           |
| Langfuse送信失敗時のデータロス  | 低   | Supabaseにログを必ず保存し、Langfuse送信は非同期（失敗してもログは残る） |
| Supabase無料枠の上限到達     | 低   | 検証期間中は1日10〜20回程度の利用を想定（無料枠内で十分）             |
| JSON出力失敗（GPT-4o-miniの出力不備） | 中   | プロンプトでJSON形式を明示、パースエラー時はリトライ処理を実装          |
| RLS無効化による情報漏洩       | 中   | 検証環境のみで使用、本番統合時にRLSを再有効化                    |

---

## 19. 参考資料

| リソース              | URL                                      |
| ----------------- | ---------------------------------------- |
| Langfuse Docs     | https://langfuse.com/docs                |
| Supabase Docs     | https://supabase.com/docs                |
| OpenAI API Docs   | https://platform.openai.com/docs/api-reference |
| Next.js App Router | https://nextjs.org/docs/app              |

---

## 付録A：Supabase DDL

```sql
-- coach_logs テーブル作成
CREATE TABLE coach_logs (
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
CREATE INDEX idx_coach_logs_created_at ON coach_logs(created_at DESC);
CREATE INDEX idx_coach_logs_trace_id ON coach_logs(trace_id);

-- RLS無効化（検証環境）
ALTER TABLE coach_logs DISABLE ROW LEVEL SECURITY;

-- コメント追加
COMMENT ON TABLE coach_logs IS 'AIコーチ応答ログ';
COMMENT ON COLUMN coach_logs.trace_id IS 'LangfuseトレースID（ダッシュボード連携用）';
COMMENT ON COLUMN coach_logs.rating IS '評価（0: 👎, 1: 👍, null: 未評価）';
```

---

## 付録B：環境変数テンプレート（`.env.local`）

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Langfuse
LANGFUSE_SECRET_KEY=sk-lf-xxxxx
NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY=pk-lf-xxxxx
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

---

**文書管理者**：CoachScope 開発チーム
**承認者**：プロジェクトリード
**最終更新日**：2025-11-04
