'use client';

import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import Link from 'next/link';
import { Calendar, Users, Gift, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const { user, logout, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until client-side
  if (!mounted || isLoading) {
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
    return (
      <Layout showHeader={false} showFooter={false} maxWidth="md">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full space-y-6 px-4">
            {/* Hero Card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                CiERへようこそ
              </h2>
              <p className="text-gray-600 mb-8">
                トップスタイリストとの予約と紹介で特典をゲット
              </p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full bg-orange-400 text-white py-4 rounded-xl font-semibold text-lg hover:bg-orange-500 transition-colors"
                >
                  ログイン
                </Link>
                <Link
                  href="/register"
                  className="block w-full bg-gray-100 text-gray-900 py-4 rounded-xl font-semibold text-lg hover:bg-gray-200 transition-colors"
                >
                  アカウント作成
                </Link>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">スタイリストの方はこちら</p>
                  <Link
                    href="/stylist/login"
                    className="block w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-orange-600 hover:to-pink-600 transition-all"
                  >
                    スタイリストログイン
                  </Link>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">簡単予約</h3>
                    <p className="text-gray-600 text-sm">お気に入りのスタイリストと簡単に予約</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">紹介システム</h3>
                    <p className="text-gray-600 text-sm">友達を招待して特別バッジを獲得</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">特典</h3>
                    <p className="text-gray-600 text-sm">活動に応じて特別バッジをアンロック</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout maxWidth="xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Welcome Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                おかえりなさい、{user.username}さん！
              </h2>
              <p className="text-gray-600">
                次の予約はいかがですか？
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <Link
              href="/book"
              className="block w-full bg-orange-400 text-white py-6 rounded-xl font-semibold text-xl text-center hover:bg-orange-500 transition-colors"
            >
              予約する
            </Link>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/appointments"
                className="block bg-white p-6 rounded-xl shadow-sm text-center hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-900 font-medium">予約一覧</p>
                <p className="text-gray-500 text-sm mt-1">過去の予約を確認</p>
              </Link>
              
              <Link
                href="/referral"
                className="block bg-white p-6 rounded-xl shadow-sm text-center hover:bg-gray-50 transition-colors"
              >
                <Gift className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-900 font-medium">紹介</p>
                <p className="text-gray-500 text-sm mt-1">友達を招待して特典獲得</p>
              </Link>
            </div>
          </div>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">あなたの実績</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">予約数</span>
                <span className="text-2xl font-bold text-orange-400">{user.total_bookings || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">紹介数</span>
                <span className="text-2xl font-bold text-green-500">{user.referral_count || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">バッジ</span>
                <span className="text-2xl font-bold text-yellow-500">{user.badges?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">あなたのバッジ</h3>
            {user.badges.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {user.badges.map((badge: any) => (
                  <div
                    key={badge.id}
                    className="p-3 bg-yellow-50 rounded-xl text-center"
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <div className="font-semibold text-xs text-gray-900">{badge.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">まだバッジがありません</p>
                <p className="text-gray-400 text-xs mt-1">予約や紹介をしてバッジを獲得しましょう！</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
