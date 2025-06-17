'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/StylistLayout';
import { Link as LinkIcon, Copy, QrCode, Settings, Eye, Calendar, Share2 } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001/api';

interface BookingLink {
  id: number;
  unique_code: string;
  booking_url: string;
  is_active: boolean;
  max_advance_days: number;
  allow_guest_booking: boolean;
  stylist_name: string;
  created_at: string;
  updated_at: string;
}

export default function StylistBookingLinkPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [bookingLink, setBookingLink] = useState<BookingLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showQR, setShowQR] = useState(false);

  const [settings, setSettings] = useState({
    max_advance_days: 30,
    allow_guest_booking: true,
    is_active: true
  });

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
      loadBookingLink();
    }
  }, [mounted, isLoading, user, router]);

  const loadBookingLink = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/bookings/booking-link/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (response.data && response.data.id) {
        setBookingLink(response.data);
        setSettings({
          max_advance_days: response.data.max_advance_days,
          allow_guest_booking: response.data.allow_guest_booking,
          is_active: response.data.is_active
        });
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        // ブッキングリンクがまだ作成されていない
        setBookingLink(null);
      } else {
        console.error('ブッキングリンク取得エラー:', error);
        setError('ブッキングリンクの取得に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const createOrUpdateBookingLink = async () => {
    try {
      setSaving(true);
      setError('');
      
      const response = await axios.post(`${API_BASE_URL}/bookings/booking-link/`, settings, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      setBookingLink(response.data);
      setSuccessMessage('ブッキングリンクを更新しました');
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      console.error('ブッキングリンク更新エラー:', error);
      setError(error.response?.data?.error || 'ブッキングリンクの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccessMessage('URLをクリップボードにコピーしました');
      setTimeout(() => setSuccessMessage(''), 3000);
    }).catch(() => {
      setError('クリップボードへのコピーに失敗しました');
    });
  };

  const shareBookingLink = () => {
    if (bookingLink && navigator.share) {
      navigator.share({
        title: `${user?.first_name}さんの予約ページ`,
        text: '美容院の予約はこちらから',
        url: bookingLink.booking_url
      }).catch(() => {
        copyToClipboard(bookingLink.booking_url);
      });
    } else if (bookingLink) {
      copyToClipboard(bookingLink.booking_url);
    }
  };

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
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">専用予約リンク</h1>
              <p className="text-gray-600">お客様専用の予約ページを管理できます</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/stylist/schedule"
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
              >
                <Calendar className="w-4 h-4 mr-2" />
                スケジュール
              </Link>
              <Link
                href="/stylist/dashboard"
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ダッシュボード
              </Link>
            </div>
          </div>
        </div>

        {/* メッセージ */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 現在のブッキングリンク */}
            {bookingLink && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">現在の予約リンク</h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 mb-1">予約URL</p>
                        <p className="text-sm font-mono text-gray-900 truncate">
                          {bookingLink.booking_url}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => copyToClipboard(bookingLink.booking_url)}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                          title="URLをコピー"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={shareBookingLink}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                          title="共有"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(bookingLink.booking_url, '_blank')}
                          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                          title="プレビュー"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">ステータス</p>
                      <p className="text-blue-900">
                        {bookingLink.is_active ? '有効' : '無効'}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">事前予約日数</p>
                      <p className="text-green-900">{bookingLink.max_advance_days}日前まで</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-600 font-medium">ゲスト予約</p>
                      <p className="text-purple-900">
                        {bookingLink.allow_guest_booking ? '許可' : '不許可'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 設定 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {bookingLink ? 'リンク設定の変更' : '予約リンクを作成'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大事前予約日数
                  </label>
                  <select
                    value={settings.max_advance_days}
                    onChange={(e) => setSettings({...settings, max_advance_days: parseInt(e.target.value)})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value={7}>1週間前まで</option>
                    <option value={14}>2週間前まで</option>
                    <option value={30}>1ヶ月前まで</option>
                    <option value={60}>2ヶ月前まで</option>
                    <option value={90}>3ヶ月前まで</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allow_guest_booking"
                    checked={settings.allow_guest_booking}
                    onChange={(e) => setSettings({...settings, allow_guest_booking: e.target.checked})}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allow_guest_booking" className="ml-2 block text-sm text-gray-700">
                    ゲスト予約を許可する（会員登録なしでの予約）
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={settings.is_active}
                    onChange={(e) => setSettings({...settings, is_active: e.target.checked})}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    予約リンクを有効にする
                  </label>
                </div>

                <button
                  onClick={createOrUpdateBookingLink}
                  disabled={saving}
                  className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      保存中...
                    </>
                  ) : bookingLink ? (
                    '設定を更新'
                  ) : (
                    '予約リンクを作成'
                  )}
                </button>
              </div>
            </div>

            {/* 使用方法 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">使用方法</h2>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                    1
                  </div>
                  <p>上記の予約URLをお客様に共有してください</p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                    2
                  </div>
                  <p>お客様は専用ページから直接予約を取ることができます</p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                    3
                  </div>
                  <p>予約が入ると自動的に通知が届きます</p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                    4
                  </div>
                  <p>スケジュール管理ページで予約状況を確認できます</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
