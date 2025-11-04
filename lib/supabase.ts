import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions for coach_logs table
export interface CoachLog {
  id: string;
  created_at: string;
  question: string;
  answer_summary: string;
  answer_body: string;
  steps: string[];
  model: string;
  latency_ms: number | null;
  trace_id: string | null;
  rating: number | null;
}
