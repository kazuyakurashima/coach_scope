import { NextRequest, NextResponse } from 'next/server';
import { Langfuse } from 'langfuse';
import { supabase } from '@/lib/supabase';

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  publicKey: process.env.NEXT_PUBLIC_LANGFUSE_PUBLIC_KEY!,
  baseUrl: process.env.LANGFUSE_BASE_URL,
});

export async function POST(request: NextRequest) {
  try {
    const { log_id, rating } = await request.json();

    // バリデーション
    if (!log_id || typeof log_id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ログIDが必要です' },
        { status: 400 }
      );
    }

    if (rating !== 0 && rating !== 1) {
      return NextResponse.json(
        { success: false, error: '評価は0（👎）または1（👍）である必要があります' },
        { status: 400 }
      );
    }

    // ログを取得してtrace_idを確認
    const { data: log, error: fetchError } = await supabase
      .from('coach_logs')
      .select('trace_id')
      .eq('id', log_id)
      .single();

    if (fetchError || !log) {
      console.error('ログ取得エラー:', fetchError);
      return NextResponse.json(
        { success: false, error: 'ログが見つかりません' },
        { status: 404 }
      );
    }

    // Supabaseのratingを更新
    const { error: updateError } = await supabase
      .from('coach_logs')
      .update({ rating })
      .eq('id', log_id);

    if (updateError) {
      console.error('評価更新エラー:', updateError);
      return NextResponse.json(
        { success: false, error: '評価の保存に失敗しました' },
        { status: 500 }
      );
    }

    // Langfuseにスコアを送信
    if (log.trace_id) {
      try {
        langfuse.score({
          traceId: log.trace_id,
          name: 'useful',
          value: rating,
          comment: rating === 1 ? '👍 Positive feedback' : '👎 Negative feedback',
        });
        await langfuse.flushAsync();
      } catch (langfuseError) {
        console.error('Langfuseスコア送信エラー:', langfuseError);
        // Langfuse送信失敗してもユーザーには成功を返す
      }
    }

    return NextResponse.json({
      success: true,
      message: 'フィードバックを保存しました',
    });
  } catch (error: any) {
    console.error('フィードバック処理エラー:', error);
    return NextResponse.json(
      { success: false, error: 'フィードバックの処理に失敗しました' },
      { status: 500 }
    );
  }
}
