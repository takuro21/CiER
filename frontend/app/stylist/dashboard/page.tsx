'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/StylistLayout';
import NotificationPanel from '../../../components/NotificationPanel';
import { Calendar, Clock, Users, BarChart3, Settings, Eye, TrendingUp, Star, Scissors } from 'lucide-react';
import Link from 'next/link';

export default function StylistDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!user) {
        router.push('/stylist/login');
        return;
      }
      
      if (user.user_type !== 'stylist') {
        router.push('/');
        return;
      }
    }
  }, [mounted, isLoading, user, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user || user.user_type !== 'stylist') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">アクセス権限がありません</p>
        </div>
      </div>
    );
  }

  // ダミーデータ
  const todayStats = {
    appointments: 6,
    revenue: 28000,
    nextAppointment: '14:30',
    availableSlots: 3
  };

  const weekStats = {
    totalAppointments: 32,
    totalRevenue: 145000,
    averageRating: 4.8,
    repeatCustomers: 18
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  おかえりなさい、{user.first_name}さん
                </h1>
                <p className="text-gray-600">今日も素敵な一日をお過ごしください</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {/* 通知パネル */}
                <NotificationPanel />
                
                <Link
                  href="/stylist/schedule"
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  スケジュール管理
                </Link>
                <Link
                  href="/stylist/services"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                >
                  <Scissors className="w-4 h-4 mr-2" />
                  サービス管理
                </Link>
                <Link
                  href="/stylist/profile"
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  プロフィール
                </Link>
              </div>
            </div>
          </div>

          {/* 今日の予約一覧 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-orange-500" />
              今日の予約
            </h2>
            <div className="space-y-3">
              {[
                { time: '10:00', service: 'カット', customer: '田中様', duration: '60分', status: 'confirmed' },
                { time: '11:30', service: 'カラー', customer: '佐藤様', duration: '120分', status: 'confirmed' },
                { time: '14:30', service: 'パーマ', customer: '山田様', duration: '90分', status: 'pending' },
                { time: '16:30', service: 'カット', customer: '鈴木様', duration: '60分', status: 'confirmed' }
              ].map((appointment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="text-lg font-semibold text-gray-900 bg-white rounded-lg px-3 py-2 min-w-[70px] text-center">
                      {appointment.time}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{appointment.service}</div>
                      <div className="text-sm text-gray-600">{appointment.customer} • {appointment.duration}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      appointment.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status === 'confirmed' ? '確定' : '未確定'}
                    </span>
                  </div>
                </div>
              ))}
              {todayStats.appointments === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>今日の予約はありません</p>
                </div>
              )}
            </div>
          </div>

          {/* 今日の概要 */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-500" />
              今日の概要
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-900 mb-2">{todayStats.appointments}</div>
                <div className="text-blue-600 mb-1">
                  <Users className="w-5 h-5 mx-auto" />
                </div>
                <p className="text-sm text-blue-700 font-medium">今日の予約</p>
              </div>

              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-900 mb-2">¥{todayStats.revenue.toLocaleString()}</div>
                <div className="text-green-600 mb-1">
                  <TrendingUp className="w-5 h-5 mx-auto" />
                </div>
                <p className="text-sm text-green-700 font-medium">今日の売上</p>
              </div>

              <div className="bg-orange-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-orange-900 mb-2">{todayStats.nextAppointment}</div>
                <div className="text-orange-600 mb-1">
                  <Clock className="w-5 h-5 mx-auto" />
                </div>
                <p className="text-sm text-orange-700 font-medium">次の予約</p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-900 mb-2">{todayStats.availableSlots}</div>
                <div className="text-purple-600 mb-1">
                  <Eye className="w-5 h-5 mx-auto" />
                </div>
                <p className="text-sm text-purple-700 font-medium">空き枠</p>
              </div>
            </div>
          </div>

          {/* 今週の実績 - 新しいデザイン */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-orange-500" />
                今週の実績
              </h2>
              <div className="text-sm text-gray-500">
                {new Date().getMonth() + 1}月{new Date().getDate() - 6}日 - {new Date().getDate()}日
              </div>
            </div>

            {/* メインコンテンツエリア */}
            <div className="grid grid-cols-1 gap-6">
              
              {/* 週別売上実績 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-4 text-center">今月の週別実績</h3>
                
                {/* 月間サマリー */}
                <div className="mb-4 text-center bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xl font-bold text-gray-900 mb-1">¥{weekStats.totalRevenue.toLocaleString()}</div>
                  <div className="text-xs text-gray-600 mb-1">今月の総売上</div>
                  <div className="flex items-center justify-center space-x-3 text-xs">
                    <span className="text-green-600 font-medium">先月比 +12% ↗️</span>
                    <span className="text-orange-600 font-medium">目標達成率 76.8%</span>
                  </div>
                </div>

                {/* 週別実績バー（動的に週数を調整） */}
                <div className="space-y-1.5">
                  {(() => {
                    // 現在の月の週数を計算（5週目がある場合も対応）
                    const currentDate = new Date();
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    const firstDay = new Date(year, month, 1);
                    const lastDay = new Date(year, month + 1, 0);
                    
                    // 月の週数を計算
                    const getWeekNumber = (date: Date) => {
                      const firstWeekStart = new Date(firstDay);
                      firstWeekStart.setDate(firstDay.getDate() - firstDay.getDay());
                      const diffTime = date.getTime() - firstWeekStart.getTime();
                      return Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;
                    };
                    
                    const weeksInMonth = getWeekNumber(lastDay);
                    const hasWeek5 = weeksInMonth >= 5;
                    
                    // 週別売上データ（5週目がある場合は5週分、ない場合は4週分）
                    const weekData = hasWeek5 ? [
                      { week: '第1週', amount: 18, color: 'bg-orange-300', percentage: 45 },
                      { week: '第2週', amount: 25, color: 'bg-orange-400', percentage: 62 },
                      { week: '第3週', amount: 32, color: 'bg-orange-500', percentage: 80 },
                      { week: '第4週', amount: 38, color: 'bg-orange-600', percentage: 95 },
                      { week: '第5週', amount: 29, color: 'bg-orange-500', percentage: 72 }
                    ] : [
                      { week: '第1週', amount: 18, color: 'bg-orange-300', percentage: 47 },
                      { week: '第2週', amount: 25, color: 'bg-orange-400', percentage: 66 },
                      { week: '第3週', amount: 32, color: 'bg-orange-500', percentage: 84 },
                      { week: '第4週', amount: 38, color: 'bg-orange-600', percentage: 100 }
                    ];

                    return weekData.map((data, index) => (
                      <div key={index} className="bg-white rounded-md p-2.5 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{data.week}</span>
                          <span className="text-sm font-bold text-gray-900">¥{data.amount}万</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 relative overflow-hidden">
                          <div 
                            className={`${data.color} h-2.5 rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${data.percentage}%` }}
                          >
                          </div>
                        </div>
                        <div className="mt-0.5 flex justify-between text-xs text-gray-500">
                          <span>進捗: {data.percentage}%</span>
                          <span>{data.amount === Math.max(...weekData.map(w => w.amount)) ? '🏆' : ''}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* 実績サマリー */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="bg-white rounded-md p-2 shadow-sm text-center">
                    <div className="text-base font-bold text-orange-600 mb-0.5">¥38万</div>
                    <div className="text-xs text-gray-600 mb-0.5">最高売上週</div>
                    <div className="text-xs text-orange-500">第4週</div>
                  </div>
                  <div className="bg-white rounded-md p-2 shadow-sm text-center">
                    <div className="text-base font-bold text-blue-600 mb-0.5">¥28.3万</div>
                    <div className="text-xs text-gray-600 mb-0.5">週平均売上</div>
                    <div className="text-xs text-blue-500">目標: ¥35万</div>
                  </div>
                  <div className="bg-white rounded-md p-2 shadow-sm text-center">
                    <div className="text-base font-bold text-green-600 mb-0.5">↗️ 成長中</div>
                    <div className="text-xs text-gray-600 mb-0.5">今月のトレンド</div>
                    <div className="flex justify-center space-x-0.5 mt-0.5">
                      <div className="w-1.5 h-2 bg-orange-300 rounded-sm"></div>
                      <div className="w-1.5 h-2.5 bg-orange-400 rounded-sm"></div>
                      <div className="w-1.5 h-3 bg-orange-500 rounded-sm"></div>
                      <div className="w-1.5 h-3.5 bg-orange-600 rounded-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 下部の詳細統計 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-900 mb-1">{weekStats.totalAppointments}</div>
                <div className="text-sm text-blue-700 font-medium">総予約件数</div>
                <div className="text-xs text-blue-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% vs 先週
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                <div className="flex items-center mb-1">
                  <span className="text-2xl font-bold text-green-900">{weekStats.averageRating}</span>
                  <Star className="w-5 h-5 text-yellow-500 ml-1" />
                </div>
                <div className="text-sm text-green-700 font-medium">平均評価</div>
                <div className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +0.2 vs 先週
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-900 mb-1">{weekStats.repeatCustomers}</div>
                <div className="text-sm text-yellow-700 font-medium">リピート客</div>
                <div className="text-xs text-yellow-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +5 vs 先週
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                <div className="text-2xl font-bold text-purple-900 mb-1">98%</div>
                <div className="text-sm text-purple-700 font-medium">顧客満足度</div>
                <div className="text-xs text-purple-600 mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +3% vs 先週
                </div>
              </div>
            </div>
          </div>
        </div>
    </Layout>
  );
}
