# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CoachScope** is a minimal AI coaching application built for Langfuse verification purposes. This Next.js 14 application demonstrates the integration of Supabase (database), OpenAI GPT-4o-mini (AI responses), and Langfuse (observability/tracing) in a simple coaching interface where students can ask questions and receive AI-powered guidance.

### Purpose
- Verify and understand Langfuse's trace, generation, and score features
- Learn Supabase integration patterns for AI application logging
- Create a lightweight prototype for future StudySpark integration
- NO authentication required (verification environment only)

## Development Commands

### Running the Application
```bash
npm run dev        # Start development server at http://localhost:3000
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

### Testing
Currently, no test framework is configured in this project.

## Project Architecture

### Tech Stack
- **Framework**: Next.js 14.2.33 (App Router)
- **Language**: TypeScript 5 (strict mode enabled)
- **Database**: Supabase (PostgreSQL)
- **AI Model**: OpenAI GPT-4o-mini
- **Observability**: Langfuse Cloud
- **Styling**: Tailwind CSS 3.4.1
- **Fonts**: Geist Sans and Geist Mono (local fonts loaded via `next/font/local`)
- **Linting**: ESLint with `next/core-web-vitals` and `next/typescript` configs

### Directory Structure
- `app/` - Next.js App Router directory
  - `layout.tsx` - Root layout with font configuration and global styles
  - `page.tsx` - Home page component (coaching interface)
  - `globals.css` - Global CSS with Tailwind directives
  - `fonts/` - Local font files (GeistVF.woff, GeistMonoVF.woff)
  - `api/` - API routes
    - `coach/reply` - POST endpoint for AI coaching responses
    - `coach/logs` - GET endpoint for retrieving chat history
    - `coach/feedback` - POST endpoint for 👍👎 ratings
- `docs/` - Project documentation
  - `requirements.md` - Comprehensive requirements specification
- `public/` - Static assets

### TypeScript Configuration
- Path alias `@/*` maps to the root directory for imports
- Strict mode enabled
- Module resolution set to "bundler"
- Next.js TypeScript plugin enabled

### Styling Approach
- Tailwind CSS with custom CSS variables for theming:
  - `--background` and `--foreground` for dark/light mode support
- Tailwind content paths include: `pages/`, `components/`, and `app/` directories
- PostCSS configured with Tailwind plugin

### Key Files
- [next.config.mjs](next.config.mjs) - Next.js configuration (currently minimal)
- [tailwind.config.ts](tailwind.config.ts) - Tailwind CSS configuration
- [tsconfig.json](tsconfig.json) - TypeScript configuration
- [.eslintrc.json](.eslintrc.json) - ESLint configuration

## Development Notes

### Adding New Pages
Create new route files in the `app/` directory following Next.js App Router conventions:
- `app/[route]/page.tsx` for new pages
- `app/[route]/layout.tsx` for route-specific layouts

### Importing Modules
Use the `@/` path alias for cleaner imports:
```typescript
import Component from '@/app/components/Component'
```

### Styling Components
Use Tailwind utility classes with the custom CSS variables defined in `globals.css`:
- `bg-background` and `text-foreground` for theme-aware colors
- Font families: `var(--font-geist-sans)` and `var(--font-geist-mono)`

## Core Features

### 1. AI Coaching Flow
1. User enters a question (max 200 characters)
2. API calls OpenAI GPT-4o-mini with structured JSON output
3. Response includes: summary (40 chars), body (120 chars), steps array
4. Response is saved to Supabase `coach_logs` table
5. Langfuse trace is created with generation data
6. User can rate response with 👍👎 (updates Langfuse score)

### 2. Data Model (Supabase)
**Table: `coach_logs`**
- `id` (uuid) - Primary key
- `created_at` (timestamptz) - Timestamp
- `question` (text) - User's question
- `answer_summary` (varchar 100) - AI response summary
- `answer_body` (text) - AI response body
- `steps` (jsonb) - Array of action steps
- `model` (varchar 40) - AI model used (default: 'gpt-4o-mini')
- `latency_ms` (integer) - Response time
- `trace_id` (varchar 64) - Langfuse trace ID for dashboard linking
- `rating` (integer) - User feedback (0: 👎, 1: 👍, null: unrated)

**RLS Status**: DISABLED for verification environment (no Auth)

### 3. Langfuse Integration
**Trace Points**:
- `trace.name`: "coach_chat"
- `generation.name`: "coach_reply"
- Metadata includes: feature, role, prompt_version, steps
- Score tracking for 👍👎 feedback
- Error tracking for failed requests

**SDK Initialization**: Server-side only in API routes

### 4. Environment Variables Required
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

## API Endpoints

### POST `/api/coach/reply`
Accepts user question, generates AI response, saves to Supabase, traces to Langfuse.

**Request**:
```json
{ "question": "今日の勉強、どこからやればいい？" }
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "summary": "昨日の復習をしよう",
    "body": "昨日の内容を軽く復習すると...",
    "steps": ["ノートを読み返す", "例題を1問解く"],
    "trace_id": "langfuse-trace-id"
  }
}
```

### GET `/api/coach/logs`
Returns last 5 coaching sessions from Supabase.

### POST `/api/coach/feedback`
Updates rating in Supabase and sends score to Langfuse.

**Request**:
```json
{ "log_id": "uuid", "rating": 1 }
```

## Prompt Engineering

**System Prompt**: Instructs GPT-4o-mini to act as a gentle learning coach and output structured JSON with summary, body, and steps fields.

**Output Format**: JSON with strict character limits enforced by prompt.

**OpenAI Settings**:
- Model: `gpt-4o-mini`
- `response_format: { type: "json_object" }`
- Temperature: 0.7
- Max tokens: 300

## Error Handling

- **OpenAI API failure**: Show toast "一時的にコーチに繋がりません"
- **Supabase save failure**: Log trace error, notify user
- **Langfuse send failure**: Continue user flow, log error in background
- **Rate limiting**: 1 request per 60 seconds per IP (simple prevention)

## UI Components

**Design Philosophy**: White background, blue/green accents, rounded sans-serif fonts (丸ゴシック), mobile-first responsive design.

**Toast Notifications**: Use react-hot-toast or shadcn/ui Toast for errors and success messages.

**Privacy Notice**: Display "※個人情報は入力しないでください" prominently.

## Development Workflow

1. Set up Supabase project + create `coach_logs` table (see [requirements.md](docs/requirements.md) Appendix A for DDL)
2. Configure environment variables in `.env.local`
3. Test OpenAI API connection with JSON output
4. Implement Langfuse trace integration
5. Build frontend UI with input form, response card, and history list
6. Add 👍👎 feedback buttons with Langfuse score integration

## Important Constraints

- **NO authentication** - This is a verification environment only
- **Rate limiting** - Simple 60-second cooldown to prevent abuse
- **Data retention** - 30 days in Supabase (manual cleanup)
- **Response time target** - 5 seconds P95, 3 seconds average

## Future Enhancements (Post-Verification)

- v1.1: Add Supabase Auth + user_id tracking + RLS policies
- v1.2: Custom Langfuse dashboard for score analytics
- v1.3: StudySpark integration with profiles table foreign key
- v2.0: Multi-turn conversations with context management

## Key Documentation

- [Requirements Specification](docs/requirements.md) - Complete requirements document
- [Supabase DDL](docs/requirements.md#付録asupabase-ddl) - Database schema
- [Environment Setup](docs/requirements.md#付録b環境変数テンプレートenvlocal) - .env.local template
