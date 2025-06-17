'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Calendar, Clock, User } from 'lucide-react';

export default function BookingSuccessPage() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Success Card */}
        <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            予約が完了しました！
          </h1>
          
          <p className="text-gray-600 mb-6">
            ご予約ありがとうございます。確認メールをお送りしました。
          </p>

          {/* Next Steps */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">次のステップ</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start space-x-2">
                <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>予約当日は時間に余裕を持ってお越しください</span>
              </li>
              <li className="flex items-start space-x-2">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>お支払いは店舗で承ります</span>
              </li>
              <li className="flex items-start space-x-2">
                <User className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>変更・キャンセルは店舗まで直接ご連絡ください</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/register"
            className="block w-full bg-orange-400 text-white py-4 rounded-xl font-semibold text-center hover:bg-orange-500 transition-colors"
          >
            アカウントを作成する
          </Link>
          
          <Link
            href="/"
            className="block w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold text-center hover:bg-gray-200 transition-colors"
          >
            ホームに戻る
          </Link>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">アカウント作成のメリット</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• 予約履歴の確認</li>
            <li>• 友達紹介で特典獲得</li>
            <li>• 次回予約がより簡単に</li>
            <li>• 専用バッジのコレクション</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
