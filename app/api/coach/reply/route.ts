import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Langfuse } from 'langfuse';
import { supabase } from '@/lib/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  publicKey: process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY!,
  baseUrl: process.env.LANGFUSE_BASE_URL,
});

const SYSTEM_PROMPT = `あなたは優しい学習コーチです。
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
- stepsは1〜3個、各20文字以内、命令形で記述`;

interface CoachResponse {
  summary: string;
  body: string;
  steps: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    // バリデーション
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { success: false, error: '質問を入力してください' },
        { status: 400 }
      );
    }

    if (question.length > 200) {
      return NextResponse.json(
        { success: false, error: '質問は200文字以内で入力してください' },
        { status: 400 }
      );
    }

    // Langfuseトレース開始
    const trace = langfuse.trace({
      name: 'coach_chat',
      metadata: {
        feature: 'coach_chat',
        role: 'student',
        prompt_version: 'v1.0',
      },
    });

    const startTime = Date.now();

    // Langfuse generation開始
    const generation = trace.generation({
      name: 'coach_reply',
      model: 'gpt-4o-mini',
      input: question,
      metadata: {
        temperature: 0.7,
        max_tokens: 300,
      },
    });

    try {
      // OpenAI API呼び出し
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 300,
      });

      const latency = Date.now() - startTime;
      const responseContent = completion.choices[0].message.content;

      if (!responseContent) {
        throw new Error('AI応答が空です');
      }

      const answer: CoachResponse = JSON.parse(responseContent);

      // バリデーション: 必須フィールドの確認
      if (!answer.summary || !answer.body || !Array.isArray(answer.steps)) {
        throw new Error('AI応答のフォーマットが不正です');
      }

      // Langfuse generationを完了
      generation.end({
        output: answer,
        usage: {
          promptTokens: completion.usage?.prompt_tokens,
          completionTokens: completion.usage?.completion_tokens,
          totalTokens: completion.usage?.total_tokens,
        },
      });

      // Supabaseに保存
      const { data: savedLog, error: supabaseError } = await supabase
        .from('coach_logs')
        .insert({
          question,
          answer_summary: answer.summary,
          answer_body: answer.body,
          steps: answer.steps,
          model: 'gpt-4o-mini',
          latency_ms: latency,
          trace_id: trace.id,
        })
        .select()
        .single();

      if (supabaseError) {
        console.error('Supabase保存エラー:', supabaseError);
        trace.update({
          level: 'ERROR',
          statusMessage: `Supabase save failed: ${supabaseError.message}`,
        });
        throw new Error('ログの保存に失敗しました');
      }

      // Langfuseトレースを確定
      await langfuse.flushAsync();

      return NextResponse.json({
        success: true,
        data: {
          id: savedLog.id,
          summary: answer.summary,
          body: answer.body,
          steps: answer.steps,
          trace_id: trace.id,
        },
      });
    } catch (error: any) {
      // エラーをLangfuseに記録
      trace.update({
        level: 'ERROR',
        statusMessage: error.message || 'Unknown error',
      });
      await langfuse.flushAsync();

      console.error('コーチ応答エラー:', error);

      return NextResponse.json(
        {
          success: false,
          error: error.message || '一時的にコーチに繋がりません。しばらくしてから再試行してください',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('リクエスト処理エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'リクエストの処理に失敗しました',
      },
      { status: 500 }
    );
  }
}
