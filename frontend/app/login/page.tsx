'use client';

import { useState, useId, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 一意なIDを生成してDOM重複を防ぐ
  const usernameId = useId();
  const passwordId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('📝 Login Form: Starting login process...');
      console.log('📝 Login Form: Username:', username);
      console.log('📝 Login Form: Password length:', password.length);
      
      const result = await login(username, password);
      
      if (result.success) {
        console.log('✅ Login Form: Login successful, redirecting...');
        
        // リファラルコードがある場合は予約ページにリダイレクト
        const referralCode = mounted ? searchParams.get('ref') : null;
        if (referralCode) {
          router.push(`/book?ref=${referralCode}`);
        } else {
          router.push('/');
        }
      } else {
        console.log('❌ Login Form: Login failed:', result.error);
        setError(result.error || 'ログインに失敗しました');
      }
    } catch (error: any) {
      console.group('🚨 Login Form: Error occurred');
      console.log('Full error object:', error);
      console.log('Error type:', typeof error);
      console.log('Error constructor:', error.constructor.name);
      console.log('Error message:', error.message);
      console.log('Error response:', error.response);
      console.log('Error response data:', error.response?.data);
      console.log('Error response status:', error.response?.status);
      console.groupEnd();
      
      let errorMessage = 'ログインに失敗しました';
      
      if (error.response?.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.non_field_errors?.[0]) {
          errorMessage = error.response.data.non_field_errors[0];
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.username || error.response.data.password) {
          errorMessage = error.response.data.username?.[0] || error.response.data.password?.[0];
        }
      } else if (error.message) {
        if (error.message.includes('Network Error')) {
          errorMessage = 'ネットワークエラーです。サーバーに接続できません。';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'タイムアウトしました。もう一度お試しください。';
        } else {
          errorMessage = error.message;
        }
      }
      
      console.log('📝 Final error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="flex items-center p-4">
          <h1 className="text-xl font-semibold text-gray-900">ログイン</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Login Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mt-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              おかえりなさい
            </h2>
            <p className="text-gray-600">
              アカウントにログインしてください
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label 
                htmlFor={usernameId}
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ユーザー名
              </label>
              <input
                id={usernameId}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="ユーザー名を入力"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor={passwordId}
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                パスワード
              </label>
              <div className="relative">
                <input
                  id={passwordId}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="パスワードを入力"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-400 text-white py-4 rounded-xl font-semibold text-lg hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              アカウントをお持ちでない方は{' '}
              <Link
                href="/register"
                className="text-orange-400 font-medium hover:text-orange-500"
              >
                新規登録
              </Link>
            </p>
          </div>
        </div>

        {/* Test Credentials Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-blue-800 text-sm font-medium mb-2">テストアカウント:</p>
          <p className="text-blue-700 text-sm">
            ユーザー名: <code className="bg-blue-100 px-1 rounded">testuser</code><br />
            パスワード: <code className="bg-blue-100 px-1 rounded">testpass123</code>
          </p>
        </div>

        {/* Home Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
