import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 最新5件を取得
    const { data, error } = await supabase
      .from('coach_logs')
      .select('id, created_at, question, answer_summary, rating')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Supabase取得エラー:', error);
      return NextResponse.json(
        { success: false, error: 'ログの取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error: any) {
    console.error('ログ取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'ログの取得に失敗しました' },
      { status: 500 }
    );
  }
}
