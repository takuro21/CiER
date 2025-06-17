'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { authAPI } from '../../lib/api';
import Layout from '../../components/Layout';

export default function ProfilePage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone_number: user?.phone_number || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 認証チェックをuseEffectで行う
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setShouldRedirect(true);
      } else {
        setShouldRedirect(false);
        // ユーザー情報が変更された場合フォームデータを更新
        setFormData({
          username: user.username || '',
          email: user.email || '',
          phone_number: user.phone_number || ''
        });
      }
    }
  }, [user, authLoading]);

  // リダイレクト処理を別のuseEffectで実行
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login');
    }
  }, [shouldRedirect, router]);

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
    setSuccess('');

    try {
      // Note: In a real app, you'd have an update profile API endpoint
      // For now, we'll just show a success message
      setSuccess('プロフィールが更新されました');
      setIsEditing(false);
    } catch (error: any) {
      setError('プロフィールの更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!user) return;
    setFormData({
      username: user.username,
      email: user.email,
      phone_number: user.phone_number || ''
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Loading states
  if (!mounted || authLoading || shouldRedirect) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout maxWidth="lg">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-400 text-2xl">👤</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {user.first_name || user.username}さん
              </h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">基本情報</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-orange-400 text-white rounded-xl hover:bg-orange-500 transition-colors"
              >
                編集
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ユーザー名
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="例: 090-1234-5678"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-orange-400 text-white py-3 rounded-xl font-medium hover:bg-orange-500 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? '更新中...' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  ユーザー名
                </label>
                <p className="text-gray-900">{user.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  メールアドレス
                </label>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  電話番号
                </label>
                <p className="text-gray-900">{user.phone_number || '未設定'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">あなたの実績</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-500">{user.total_bookings || 0}</p>
              <p className="text-sm text-gray-600">総予約数</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <p className="text-2xl font-bold text-orange-400">{user.referral_count || 0}</p>
              <p className="text-sm text-gray-600">紹介数</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">獲得バッジ</h2>
          {user.badges && user.badges.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {user.badges.map((badge: any) => (
                <div
                  key={badge.id}
                  className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-center"
                >
                  <div className="text-2xl mb-2">{badge.icon}</div>
                  <div className="font-semibold text-sm text-gray-900">{badge.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{badge.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">🏆</span>
              </div>
              <p className="text-gray-500">まだバッジがありません</p>
              <p className="text-gray-400 text-sm mt-1">予約や紹介をしてバッジを獲得しましょう！</p>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-medium hover:bg-red-100 transition-colors border border-red-200"
          >
            ログアウト
          </button>
        </div>
      </div>
    </Layout>
  );
}
