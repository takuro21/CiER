'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/StylistLayout';
import { Bell, Calendar, Clock, Users, Star, AlertCircle, X, CheckCircle, ArrowLeft, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { Notification } from '../../../lib/types';
import { notificationsAPI } from '../../../lib/api';

export default function NotificationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ダミーデータ（実際のAPIが実装されるまで）
  const dummyNotifications: Notification[] = [
    {
      id: 1,
      type: 'appointment',
      title: '新しい予約',
      message: '田中様から15:00にカットのご予約をいただきました',
      read: false,
      urgent: false,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      data: {
        appointment_id: 1,
        customer_name: '田中様',
        service_name: 'カット',
        appointment_time: '15:00'
      }
    },
    {
      id: 2,
      type: 'reminder',
      title: '予約リマインダー',
      message: '佐藤様の予約まで30分です',
      read: false,
      urgent: true,
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      data: {
        appointment_id: 2,
        customer_name: '佐藤様',
        service_name: 'カラー',
        appointment_time: '11:30'
      }
    },
    {
      id: 3,
      type: 'cancellation',
      title: 'キャンセル通知',
      message: '山田様の予約がキャンセルされました',
      read: true,
      urgent: false,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      data: {
        appointment_id: 3,
        customer_name: '山田様',
        service_name: 'パーマ',
        appointment_time: '14:30'
      }
    },
    {
      id: 4,
      type: 'review',
      title: '新しいレビュー',
      message: '鈴木様から5つ星のレビューをいただきました',
      read: true,
      urgent: false,
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      data: {
        customer_name: '鈴木様',
        rating: 5
      }
    },
    {
      id: 5,
      type: 'system',
      title: 'システム更新',
      message: 'スケジュール管理機能が更新されました',
      read: true,
      urgent: false,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      data: {}
    },
    {
      id: 6,
      type: 'appointment',
      title: '予約変更',
      message: '高橋様の予約時間が変更されました',
      read: false,
      urgent: false,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      data: {
        appointment_id: 6,
        customer_name: '高橋様',
        service_name: 'カット',
        appointment_time: '16:00'
      }
    },
    {
      id: 7,
      type: 'reminder',
      title: '定期メンテナンス',
      message: '明日21:00からシステムメンテナンスを実施します',
      read: true,
      urgent: false,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      data: {}
    }
  ];

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
      
      loadNotifications();
    }
  }, [mounted, isLoading, user, router]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // 実際のAPIを使用
      const response = await notificationsAPI.getAll();
      
      // APIレスポンスが配列であることを確認
      const notificationsData = Array.isArray(response.data) ? response.data : [];
      setNotifications(notificationsData);
    } catch (error) {
      console.error('通知の取得に失敗しました:', error);
      // エラー時はダミーデータを使用
      setNotifications(dummyNotifications);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => 
        Array.isArray(prev) ? prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true }
            : notification
        ) : []
      );
    } catch (error) {
      console.error('通知の既読化に失敗しました:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => 
        Array.isArray(prev) ? prev.map(notification => ({ ...notification, read: true })) : []
      );
    } catch (error) {
      console.error('全通知の既読化に失敗しました:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      // APIで削除処理を実行（実装時）
      // await notificationsAPI.delete(id);
      setNotifications(prev => 
        Array.isArray(prev) ? prev.filter(notification => notification.id !== id) : []
      );
    } catch (error) {
      console.error('通知の削除に失敗しました:', error);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'cancellation':
        return <X className="w-5 h-5 text-red-500" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'review':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'たった今';
    if (diffInMinutes < 60) return `${diffInMinutes}分前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}時間前`;
    return `${Math.floor(diffInMinutes / 1440)}日前`;
  };

  const filteredNotifications = notifications.filter(notification => {
    // 読み取り状態フィルター
    if (filter === 'read' && !notification.read) return false;
    if (filter === 'unread' && notification.read) return false;
    
    // タイプフィルター
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    
    // 検索フィルター
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/stylist/dashboard"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                    <Bell className="w-6 h-6 mr-3 text-orange-500" />
                    通知一覧
                  </h1>
                  <p className="text-gray-600">
                    {unreadCount > 0 && (
                      <span className="text-orange-600 font-medium">
                        {unreadCount}件の未読通知があります
                      </span>
                    )}
                    {unreadCount === 0 && (
                      <span className="text-green-600">すべての通知を確認済みです</span>
                    )}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  すべて既読にする
                </button>
              )}
            </div>
          </div>

          {/* フィルターとサーチ */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* 検索 */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="通知を検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* 読み取り状態フィルター */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === 'all'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === 'unread'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  未読
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === 'read'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  既読
                </button>
              </div>

              {/* タイプフィルター */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">すべてのタイプ</option>
                <option value="appointment">予約</option>
                <option value="cancellation">キャンセル</option>
                <option value="reminder">リマインダー</option>
                <option value="review">レビュー</option>
                <option value="system">システム</option>
              </select>
            </div>
          </div>

          {/* 通知リスト */}
          <div className="bg-white rounded-2xl shadow-sm">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center p-12 text-gray-500">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">通知がありません</p>
                <p>フィルター条件に一致する通知が見つかりませんでした。</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    } ${notification.urgent ? 'border-l-4 border-l-red-500' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className={`text-lg font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h3>
                            {notification.urgent && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                緊急
                              </span>
                            )}
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">
                            {notification.message}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="既読にする"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="削除"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
