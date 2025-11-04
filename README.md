# 🎓 CoachScope

Minimal AI coaching application built for Langfuse verification purposes. This Next.js 14 application demonstrates the integration of Supabase (database), OpenAI GPT-4o-mini (AI responses), and Langfuse (observability/tracing) in a simple coaching interface where students can ask questions and receive AI-powered guidance.

[![Next.js](https://img.shields.io/badge/Next.js-14.2.33-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Langfuse](https://img.shields.io/badge/Langfuse-Observability-purple)](https://langfuse.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-orange)](https://openai.com/)

## ✨ Features

- 🤖 **AI-Powered Learning Coach** - GPT-4o-mini provides personalized study guidance
- 📊 **Full Observability** - Langfuse tracks traces, generations, and user scores
- 💾 **Data Persistence** - Supabase PostgreSQL stores all coaching interactions
- 👍👎 **Feedback System** - User ratings automatically sync to Langfuse scores
- ⚡ **Structured Outputs** - JSON responses with strict validation and character limits
- 🎨 **Clean UI** - Responsive design with Tailwind CSS and toast notifications
- 🔍 **Trace Linking** - Direct connection between Supabase logs and Langfuse traces

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript 5 |
| **Database** | Supabase (PostgreSQL) |
| **AI Model** | OpenAI GPT-4o-mini |
| **Observability** | Langfuse Cloud |
| **Styling** | Tailwind CSS 3.4.1 |
| **Notifications** | react-hot-toast |

## 🎯 Purpose

This project serves as a verification and learning tool for:

1. **Langfuse Integration** - Understanding trace, generation, and score features
2. **Supabase Patterns** - Learning AI application logging and data persistence
3. **Structured LLM Outputs** - Implementing JSON mode with strict validation
4. **Prototype Development** - Creating a foundation for future StudySpark integration

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Langfuse account and project
- OpenAI API key with GPT-4o-mini access

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/coach-scope.git
cd coach-scope
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run the schema from `supabase/schema.sql`:

```sql
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
```

3. Copy your Project URL and anon key from Settings > API

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-xxxxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Langfuse
LANGFUSE_SECRET_KEY=sk-lf-xxxxx
NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY=pk-lf-xxxxx
LANGFUSE_BASE_URL=https://us.cloud.langfuse.com
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How It Works

### User Flow

1. **Question Input** - User enters a study question (max 200 characters)
2. **AI Processing** - GPT-4o-mini generates a structured response
3. **Data Storage** - Response saved to Supabase with trace ID
4. **Trace Creation** - Langfuse records full execution details
5. **User Feedback** - 👍👎 buttons update both Supabase and Langfuse
6. **History Display** - Recent conversations shown with ratings

### AI Response Structure

```json
{
  "summary": "要約（40文字以内）",
  "body": "本文（120文字以内）",
  "steps": [
    "次の一歩1（20文字以内）",
    "次の一歩2（20文字以内）",
    "次の一歩3（20文字以内）"
  ]
}
```

### Langfuse Integration Points

| Event | Action |
|-------|--------|
| Question submitted | Create trace with metadata |
| AI call starts | Begin generation tracking |
| AI responds | End generation with token usage |
| Save to Supabase | Link trace_id in database |
| User rates response | Send score to Langfuse |
| Error occurs | Log error in trace |

## 🗂️ Project Structure

```
coach-scope/
├── app/
│   ├── api/
│   │   └── coach/
│   │       ├── reply/route.ts      # AI response endpoint
│   │       ├── logs/route.ts       # History retrieval
│   │       └── feedback/route.ts   # Rating submission
│   ├── layout.tsx                  # Root layout with Toaster
│   ├── page.tsx                    # Main coaching interface
│   └── globals.css                 # Tailwind styles
├── docs/
│   └── requirements.md             # Detailed requirements spec
├── lib/
│   └── supabase.ts                 # Supabase client
├── supabase/
│   └── schema.sql                  # Database schema
├── CLAUDE.md                       # Development guide
└── README.md                       # This file
```

## 🔌 API Endpoints

### POST `/api/coach/reply`

Generates AI coaching response with Langfuse tracking.

**Request:**
```json
{
  "question": "今日の勉強、どこからやればいい？"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "summary": "昨日の復習をしよう",
    "body": "昨日の内容を軽く復習すると記憶が安定します...",
    "steps": ["ノートを読み返す", "例題を1問解く"],
    "trace_id": "langfuse-trace-id"
  }
}
```

### GET `/api/coach/logs`

Retrieves last 5 coaching sessions.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "created_at": "2025-11-04T15:37:08.658Z",
      "question": "今日の勉強、どこからやればいい？",
      "answer_summary": "昨日の復習をしよう",
      "rating": 1
    }
  ]
}
```

### POST `/api/coach/feedback`

Submits user rating and syncs to Langfuse.

**Request:**
```json
{
  "log_id": "uuid",
  "rating": 1
}
```

## 📊 Langfuse Dashboard

After using the app, visit your Langfuse dashboard to view:

- **Traces** - Full conversation flows with timing
- **Generations** - Individual AI calls with token usage
- **Scores** - User feedback aggregated by trace
- **Metadata** - Filter by `feature: coach_chat`, `prompt_version: v1.0`
- **Cost Analysis** - Token usage and estimated costs

## 🔐 Security Notes

⚠️ **This is a verification environment** - Authentication is disabled for rapid testing.

**Current Security:**
- RLS (Row Level Security) disabled in Supabase
- No user authentication
- Public API endpoints

**For Production:**
- Enable Supabase Auth
- Implement RLS policies
- Add rate limiting
- Use environment-specific API keys

See [docs/requirements.md](docs/requirements.md) for migration path.

## 🚧 Roadmap

### v1.1 - Authentication
- [ ] Supabase Auth integration
- [ ] User ID tracking in logs
- [ ] RLS policies for data isolation

### v1.2 - Analytics
- [ ] Custom Langfuse dashboard
- [ ] Score aggregation reports
- [ ] Performance metrics

### v1.3 - StudySpark Integration
- [ ] Link to profiles table
- [ ] Multi-user support
- [ ] Advanced access control

### v2.0 - Conversations
- [ ] Multi-turn dialogue support
- [ ] Context management
- [ ] Session tracking

## 📚 Documentation

- **[Requirements Specification](docs/requirements.md)** - Complete functional requirements
- **[CLAUDE.md](CLAUDE.md)** - Development guide for Claude Code
- **[Supabase Schema](supabase/schema.sql)** - Database DDL

## 🧪 Testing

### Manual Testing Checklist

- [ ] Submit a question and receive AI response
- [ ] Verify response appears in history
- [ ] Click 👍 button and check Supabase + Langfuse
- [ ] Click 👎 button and verify score update
- [ ] Reload page and confirm history persists
- [ ] Check Langfuse dashboard for trace details
- [ ] Test error handling (invalid API key)

### Example Test Scenarios

```bash
# Test 1: Basic coaching flow
Question: "今日の勉強、どこからやればいい？"
Expected: Structured response with summary, body, steps

# Test 2: Character limits
Question: "数学の勉強について教えて" (short)
Expected: Response within character constraints

# Test 3: Feedback system
Action: Rate response with 👍
Expected: Rating appears in history, Langfuse score = 1
```

## 🤝 Contributing

This is a verification/learning project, but suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [OpenAI GPT-4o-mini](https://openai.com/)
- Data storage by [Supabase](https://supabase.com/)
- Observability by [Langfuse](https://langfuse.com/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Contact

For questions or feedback about this project:

- Create an issue in this repository
- Refer to [docs/requirements.md](docs/requirements.md) for detailed specifications

---

**Note:** This is a verification environment for Langfuse integration. For production use, implement proper authentication and security measures as outlined in the Future Enhancements section.
