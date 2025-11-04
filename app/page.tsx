'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface CoachResponse {
  id: string;
  summary: string;
  body: string;
  steps: string[];
  trace_id: string;
}

interface CoachLog {
  id: string;
  created_at: string;
  question: string;
  answer_summary: string;
  rating: number | null;
}

export default function Home() {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<CoachResponse | null>(null);
  const [logs, setLogs] = useState<CoachLog[]>([]);

  // ログを取得
  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/coach/logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error('ログ取得エラー:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // コーチに質問を送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      toast.error('質問を入力してください');
      return;
    }

    if (question.length > 200) {
      toast.error('質問は200文字以内で入力してください');
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/coach/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      const data = await res.json();

      if (data.success) {
        setResponse(data.data);
        setQuestion('');
        toast.success('コーチからの返答が届きました！');
        fetchLogs(); // ログを更新
      } else {
        toast.error(data.error || 'エラーが発生しました');
      }
    } catch (error) {
      toast.error('一時的にコーチに繋がりません。しばらくしてから再試行してください');
      console.error('送信エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // フィードバックを送信
  const handleFeedback = async (rating: number) => {
    if (!response) return;

    try {
      const res = await fetch('/api/coach/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: response.id, rating }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('フィードバックありがとうございます！');
        fetchLogs(); // ログを更新
      } else {
        toast.error(data.error || 'フィードバックの送信に失敗しました');
      }
    } catch (error) {
      toast.error('フィードバックの送信に失敗しました');
      console.error('フィードバックエラー:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            CoachScope
          </h1>
          <p className="text-gray-600">
            学習コーチングAI - あなたの学びをサポートします
          </p>
        </header>

        {/* メインカード */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 mb-8">
          <form onSubmit={handleSubmit}>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              今日の勉強、何をすればいいか迷っていますか？
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="例: 今日の勉強、どこからやればいい？"
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              maxLength={200}
              disabled={isLoading}
            />
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-gray-500">
                ※個人情報は入力しないでください（{question.length}/200文字）
              </p>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '考え中...' : 'コーチに聞く'}
              </button>
            </div>
          </form>

          {/* 応答カード */}
          {response && (
            <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-green-50 rounded-xl border border-blue-200">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  {response.summary}
                </h3>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                {response.body}
              </p>

              {response.steps.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">次の一歩：</h4>
                  <ul className="space-y-2">
                    {response.steps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-6 h-6 bg-blue-500 text-white rounded-full text-center text-sm font-bold mr-2 flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 評価ボタン */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">この返答は役に立ちましたか？</span>
                <button
                  onClick={() => handleFeedback(1)}
                  className="px-4 py-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors text-2xl"
                  title="役に立った"
                >
                  👍
                </button>
                <button
                  onClick={() => handleFeedback(0)}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors text-2xl"
                  title="役に立たなかった"
                >
                  👎
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 履歴 */}
        {logs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              最近の相談履歴
            </h2>
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">
                        {new Date(log.created_at).toLocaleString('ja-JP')}
                      </p>
                      <p className="text-gray-800 font-medium mb-1">
                        {log.question}
                      </p>
                      <p className="text-sm text-gray-600">
                        → {log.answer_summary}
                      </p>
                    </div>
                    {log.rating !== null && (
                      <span className="text-2xl ml-4">
                        {log.rating === 1 ? '👍' : '👎'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
