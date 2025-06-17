'use client';

import { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Clock, Users, Star } from 'lucide-react';
import Link from 'next/link';
import { Notification } from '../lib/types';
import { notificationsAPI } from '../lib/api';

interface NotificationPanelProps {
  className?: string;
}

export default function NotificationPanel({ className = '' }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
    }
  ];

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // 実際のAPIを使用
      const [notificationsRes, unreadCountRes] = await Promise.all([
        notificationsAPI.getAll(),
        notificationsAPI.getUnreadCount()
      ]);
      
      // APIレスポンスが配列であることを確認
      const notificationsData = Array.isArray(notificationsRes.data) ? notificationsRes.data : [];
      const unreadCountData = unreadCountRes.data?.count || 0;
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('通知の取得に失敗しました:', error);
      // エラー時はダミーデータを使用
      setNotifications(dummyNotifications);
      setUnreadCount(dummyNotifications.filter(n => !n.read).length);
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
      setUnreadCount(prev => Math.max(0, prev - 1));
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
      setUnreadCount(0);
    } catch (error) {
      console.error('全通知の既読化に失敗しました:', error);
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

  return (
    <div className={`relative ${className}`}>
      {/* 通知ベルボタン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知パネル */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">通知</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  すべて既読
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 通知リスト */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>通知はありません</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {Array.isArray(notifications) && notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    } ${notification.urgent ? 'border-l-4 border-l-red-500' : ''}`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                            {notification.urgent && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                緊急
                              </span>
                            )}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* フッター */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <Link
                href="/stylist/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                すべての通知を表示
              </Link>
            </div>
          )}
        </div>
      )}

      {/* オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
