'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authAPI, referralsAPI } from '../../lib/api';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    phone_number: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [referralInfo, setReferralInfo] = useState<{
    name: string;
    code: string;
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  // URLパラメータから紹介コードを取得
  useEffect(() => {
    if (!mounted) return;
    
    const referralCode = searchParams.get('ref');
    if (referralCode) {
      // 紹介コードから紹介者情報を取得
      const fetchReferrerInfo = async () => {
        try {
          const response = await referralsAPI.validateReferralCode(referralCode);
          if (response.data && response.data.valid) {
            setReferralInfo({
              name: `${response.data.referrer.first_name || ''} ${response.data.referrer.last_name || ''}`.trim() || response.data.referrer.username,
              code: referralCode
            });
          }
        } catch (error) {
          console.log('紹介コードの検証に失敗:', error);
          // エラーの場合はコードだけ保存
          setReferralInfo({
            name: 'お友達',
            code: referralCode
          });
        }
      };
      
      fetchReferrerInfo();
    }
  }, [mounted, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.password_confirm) {
      setError('パスワードが一致しません');
      setIsLoading(false);
      return;
    }

    try {
      await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        phone_number: formData.phone_number || undefined
      });
      
      alert('アカウントが作成されました。ログインしてください。');
      router.push('/login');
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData) {
        const errorMessages = Object.values(errorData).flat().join(', ');
        setError(errorMessages);
      } else {
        setError('アカウント作成に失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            CiERアカウント作成
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            または{' '}
            <Link
              href="/login"
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              既存アカウントでログイン
            </Link>
          </p>
        </div>

        {/* 紹介者情報の表示 */}
        {referralInfo && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">👋</span>
              <div>
                <p className="text-sm text-green-800">
                  <strong>{referralInfo.name}</strong>さんからの紹介で参加
                </p>
                <p className="text-xs text-green-600">
                  紹介コード: {referralInfo.code}
                </p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                ユーザー名 *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                電話番号
              </label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={formData.phone_number}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード *
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700">
                パスワード確認 *
              </label>
              <div className="relative mt-1">
                <input
                  id="password_confirm"
                  name="password_confirm"
                  type={showPasswordConfirm ? "text" : "password"}
                  required
                  className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  value={formData.password_confirm}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPasswordConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {isLoading ? 'アカウント作成中...' : 'アカウント作成'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-purple-600 hover:text-purple-500 text-sm"
            >
              ← ホームに戻る
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
