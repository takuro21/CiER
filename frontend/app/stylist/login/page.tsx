'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, User, Lock, LogIn } from 'lucide-react';

export default function StylistLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { login, user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && user) {
      if (user.user_type === 'stylist') {
        router.push('/stylist/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [mounted, authLoading, user, router]);

  // テスト用のクイックログイン
  const quickLogin = async () => {
    setIsLoading(true);
    setError('');
    const result = await login('stylist_test', 'stylist123');
    
    if (!result.success) {
      setError(result.error || 'ログインに失敗しました');
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('ユーザー名とパスワードを入力してください');
      return;
    }

    setIsLoading(true);
    setError('');
    
    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error || 'ログインに失敗しました');
    }
    
    setIsLoading(false);
  };

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* ロゴ・ヘッダー */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CiER</h1>
          <p className="text-gray-600">スタイリスト専用ログイン</p>
        </div>

        {/* ログインフォーム */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ユーザー名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="ユーザー名を入力"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="パスワードを入力"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white font-medium py-3 px-4 rounded-lg hover:from-orange-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  ログイン
                </>
              )}
            </button>
          </form>

          {/* テスト用クイックログイン */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-blue-800 text-sm font-medium mb-3">🧪 テスト用クイックログイン</p>
              <button
                onClick={quickLogin}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                ) : (
                  'テストアカウントでログイン'
                )}
              </button>
              <p className="text-blue-600 text-xs mt-2">
                ユーザー名: stylist_test / パスワード: stylist123
              </p>
            </div>
          </div>

          {/* フッター */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              ← トップページに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
