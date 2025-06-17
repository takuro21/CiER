'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Layout from '../../../components/Layout';
import { Calendar, Clock, User, Phone, Mail, ArrowLeftIcon } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001/api';

export default function StylistBookingPage() {
  const params = useParams();
  const router = useRouter();
  const bookingCode = params.code as string;
  
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // スタイリスト情報を取得
  const { data: stylistData, isLoading: stylistLoading, error: stylistError } = useQuery({
    queryKey: ['stylist-booking', bookingCode],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/bookings/booking-code/${bookingCode}/`);
      return response.data;
    },
    retry: false
  });

  // 利用可能な時間枠を取得
  const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery({
    queryKey: ['time-slots', selectedService, appointmentDate],
    queryFn: async () => {
      if (!selectedService || !appointmentDate || !stylistData?.stylist?.id) return [];
      const response = await axios.get(
        `${API_BASE_URL}/bookings/appointments/available-slots/?date=${appointmentDate}&stylist_id=${stylistData.stylist.id}&service_id=${selectedService}`
      );
      return response.data.available_slots || [];
    },
    enabled: !!selectedService && !!appointmentDate && !!stylistData?.stylist?.id
  });

  const handleBooking = async () => {
    if (!selectedService || !appointmentDate || !startTime) {
      setError('必要な情報を入力してください');
      return;
    }

    // ゲスト情報のバリデーション
    if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email || !guestInfo.phoneNumber) {
      setError('お客様情報をすべて入力してください');
      return;
    }

    setIsBookingLoading(true);
    setError('');

    try {
      const bookingData = {
        service_id: selectedService,
        stylist_id: stylistData.stylist.id,
        appointment_date: appointmentDate,
        start_time: startTime,
        notes: notes,
        payment_method: 'in_person',
        guest_info: {
          first_name: guestInfo.firstName,
          last_name: guestInfo.lastName,
          email: guestInfo.email,
          phone_number: guestInfo.phoneNumber
        }
      };

      const response = await axios.post(`${API_BASE_URL}/bookings/appointments/`, bookingData);
      
      setSuccessMessage('予約が完了しました！');
      
      // 3秒後にリダイレクト
      setTimeout(() => {
        router.push('/booking-success');
      }, 3000);

    } catch (error: any) {
      console.error('予約エラー:', error);
      setError(error.response?.data?.error || '予約の作成に失敗しました');
    } finally {
      setIsBookingLoading(false);
    }
  };

  if (stylistLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (stylistError || !stylistData) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">無効な予約リンク</h1>
            <p className="text-gray-600 mb-6">
              申し訳ございませんが、このリンクは無効または期限切れです。
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const stylist = stylistData.stylist;
  const bookingSettings = stylistData.booking_settings;

  if (successMessage) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-green-500 mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">予約完了！</h1>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <p className="text-sm text-gray-500">まもなくリダイレクトされます...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // 今日から最大事前予約日数までの日付を生成
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    const maxDays = bookingSettings?.max_advance_days || 30;
    
    for (let i = 0; i < maxDays; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const availableDates = generateAvailableDates();

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            戻る
          </button>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {stylist.user.first_name} {stylist.user.last_name}さんの予約
            </h1>
            <p className="text-gray-600">
              経験年数: {stylist.experience_years}年
            </p>
            {stylist.bio && (
              <p className="text-gray-600 mt-2">{stylist.bio}</p>
            )}
          </div>
        </div>

        {/* 予約フォーム */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">予約情報</h2>
          
          {/* サービス選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              サービス選択
            </label>
            <div className="space-y-2">
              {stylist.stylist_services?.map((stylistService: any) => (
                <div
                  key={stylistService.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedService === stylistService.service.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedService(stylistService.service.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {stylistService.service.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        所要時間: {stylistService.duration_minutes}分
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ¥{stylistService.effective_price}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 日程選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予約日
            </label>
            <select
              value={appointmentDate}
              onChange={(e) => {
                setAppointmentDate(e.target.value);
                setStartTime(''); // 日程が変わったら時間をリセット
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">日程を選択してください</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('ja-JP', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </option>
              ))}
            </select>
          </div>

          {/* 時間選択 */}
          {appointmentDate && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                予約時間
              </label>
              {timeSlotsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                </div>
              ) : timeSlots && timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot: any) => (
                    <button
                      key={slot.start_time}
                      onClick={() => setStartTime(slot.start_time)}
                      className={`p-2 text-sm border rounded-lg transition-colors ${
                        startTime === slot.start_time
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {slot.display}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  選択した日程に空きがありません
                </p>
              )}
            </div>
          )}

          {/* お客様情報 */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">お客様情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓
                </label>
                <input
                  type="text"
                  value={guestInfo.lastName}
                  onChange={(e) => setGuestInfo({...guestInfo, lastName: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="田中"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名
                </label>
                <input
                  type="text"
                  value={guestInfo.firstName}
                  onChange={(e) => setGuestInfo({...guestInfo, firstName: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="太郎"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="example@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号
                </label>
                <input
                  type="tel"
                  value={guestInfo.phoneNumber}
                  onChange={(e) => setGuestInfo({...guestInfo, phoneNumber: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="090-1234-5678"
                />
              </div>
            </div>
          </div>

          {/* 備考 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              備考（任意）
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="ご要望やご質問がございましたらお書きください"
            />
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* 予約ボタン */}
          <button
            onClick={handleBooking}
            disabled={isBookingLoading || !selectedService || !appointmentDate || !startTime}
            className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isBookingLoading ? '予約中...' : '予約を確定する'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
