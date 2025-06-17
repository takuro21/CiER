'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { servicesAPI, stylistsAPI, appointmentsAPI, referralsAPI } from '../../lib/api';
import Layout from '../../components/Layout';
import type { Service, Stylist, CreateAppointmentRequest, TimeSlot } from '../../lib/types';
import { ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function BookPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  
  // State
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<number | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Referral state
  const [referrerInfo, setReferrerInfo] = useState<{ name: string; code: string } | null>(null);
  const [isGuestBooking, setIsGuestBooking] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Authentication check - allow guest booking for referrals
  useEffect(() => {
    if (!isLoading) {
      const referralCode = mounted ? searchParams.get('ref') : null;
      if (!user && !referralCode) {
        setShouldRedirect(true);
      } else {
        setShouldRedirect(false);
        // If there's a referral code but no user, enable guest booking
        if (referralCode && !user) {
          setIsGuestBooking(true);
        }
      }
    }
  }, [user, isLoading, mounted, searchParams]);

  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login');
    }
  }, [shouldRedirect, router]);

  // Check for referral code
  useEffect(() => {
    if (!mounted) return;
    
    const referralCode = searchParams.get('ref');
    if (referralCode) {
      const fetchReferrerInfo = async () => {
        try {
          const response = await referralsAPI.validateReferralCode(referralCode);
          if (response.data && response.data.valid) {
            setReferrerInfo({
              name: `${response.data.referrer.first_name} ${response.data.referrer.last_name}` || 'お友達',
              code: referralCode
            });
          }
        } catch (error) {
          console.log('紹介コードの検証に失敗:', error);
          setReferrerInfo({
            name: 'お友達',
            code: referralCode
          });
        }
      };
      fetchReferrerInfo();
    }
    
    // Check for stylist parameter
    const stylistParam = searchParams.get('stylist');
    if (stylistParam) {
      setSelectedStylist(parseInt(stylistParam, 10));
    }
  }, [mounted, searchParams]);

  // Fetch data
  const { data: servicesResponse } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesAPI.getAll(),
    enabled: mounted && !isLoading && !!user && !shouldRedirect
  });

  const { data: stylistsResponse } = useQuery({
    queryKey: ['stylists'],
    queryFn: () => stylistsAPI.getAll(),
    enabled: mounted && !isLoading && !!user && !shouldRedirect
  });

  const services = Array.isArray(servicesResponse?.data) 
    ? servicesResponse.data 
    : servicesResponse?.data?.results || [];
  const stylists = Array.isArray(stylistsResponse?.data) 
    ? stylistsResponse.data 
    : stylistsResponse?.data?.results || [];

  // サービスまたはスタイリストが変更されたら時間選択をリセット
  useEffect(() => {
    setStartTime('');
  }, [selectedService, selectedStylist]);

  // Set default stylist
  useEffect(() => {
    if (stylists.length > 0 && !selectedStylist) {
      const availableStylist = stylists.find((s: Stylist) => s.is_available) || stylists[0];
      setSelectedStylist(availableStylist?.id);
    }
  }, [stylists, selectedStylist]);

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selected);
    setAppointmentDate(selected.toISOString().split('T')[0]);
    // 日付が変更されたら時間選択をリセット
    setStartTime('');
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day &&
           selectedDate.getMonth() === currentDate.getMonth() &&
           selectedDate.getFullYear() === currentDate.getFullYear();
  };

  // 利用可能な時間枠を動的に取得
  const { data: timeSlotsData, isLoading: isTimeSlotsLoading } = useQuery({
    queryKey: ['timeSlots', appointmentDate, selectedStylist, selectedService],
    queryFn: () => appointmentsAPI.getAvailableTimeSlots(appointmentDate, selectedStylist!, selectedService!),
    enabled: !!(appointmentDate && selectedStylist && selectedService),
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });

  const timeSlots: TimeSlot[] = timeSlotsData?.data?.available_slots || [];
  const selectedServiceDuration = timeSlotsData?.data?.service_duration;

  const handleBooking = async () => {
    if (!selectedService || !selectedStylist || !appointmentDate || !startTime) {
      setError('すべての項目を入力してください');
      return;
    }

    // Guest booking validation
    if (isGuestBooking && (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email || !guestInfo.phoneNumber)) {
      setError('ゲスト予約にはすべての個人情報を入力してください');
      return;
    }

    setIsBookingLoading(true);
    setError('');

    try {
      const appointmentData: CreateAppointmentRequest = {
        service_id: selectedService,
        stylist_id: selectedStylist,
        appointment_date: appointmentDate,
        start_time: startTime,
        notes: notes,
        payment_method: 'in_person',
        ...(referrerInfo?.code && { referral_code: referrerInfo.code }),
        ...(isGuestBooking && {
          guest_info: {
            first_name: guestInfo.firstName,
            last_name: guestInfo.lastName,
            email: guestInfo.email,
            phone_number: guestInfo.phoneNumber
          }
        })
      };

      await appointmentsAPI.create(appointmentData);
      
      if (isGuestBooking) {
        // ゲスト予約の場合は成功ページに遷移
        router.push('/booking-success');
      } else {
        router.push('/appointments');
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || '予約に失敗しました');
    } finally {
      setIsBookingLoading(false);
    }
  };

  // Loading states
  if (!mounted || shouldRedirect) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // For non-guest bookings, check if user exists
  if (!isGuestBooking && !user) {
    return null;
  }

  const selectedStylistData = stylists.find((s: Stylist) => s.id === selectedStylist);

  return (
    <Layout maxWidth="xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">予約する</h1>
            </div>
            
            {referrerInfo && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-800 text-sm">
                  <span className="font-semibold">{referrerInfo.name}</span>さんからの紹介
                </p>
                <p className="text-green-600 text-xs">紹介コード: {referrerInfo.code}</p>
              </div>
            )}
          </div>

          {/* Stylist Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">担当スタイリスト</h2>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-200 to-orange-400 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-xs">👤</span>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedStylistData ? `${selectedStylistData.user.first_name} ${selectedStylistData.user.last_name}` : 'Ava Harper'}
              </h2>
              <p className="text-gray-600">ヘアスタイリスト</p>
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-orange-400 font-semibold">4.8</span>
                <span className="text-gray-500">(120件のレビュー)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Select Service */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">サービスを選択</h3>
          <div className="flex space-x-3">
            {services.slice(0, 3).map((service: Service, index: number) => {
              const labels = ['カット', 'カラーリング', 'スタイリング'];
              return (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedService === service.id
                      ? 'bg-orange-400 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {labels[index] || service.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Guest Information (for non-logged in users with referral) */}
        {isGuestBooking && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">お客様情報</h3>
            <p className="text-gray-600 text-sm mb-4">
              予約に必要な情報を入力してください
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  お名前（姓） *
                </label>
                <input
                  type="text"
                  value={guestInfo.lastName}
                  onChange={(e) => setGuestInfo({...guestInfo, lastName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="田中"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  お名前（名） *
                </label>
                <input
                  type="text"
                  value={guestInfo.firstName}
                  onChange={(e) => setGuestInfo({...guestInfo, firstName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="太郎"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス *
                </label>
                <input
                  type="email"
                  value={guestInfo.email}
                  onChange={(e) => setGuestInfo({...guestInfo, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="example@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号 *
                </label>
                <input
                  type="tel"
                  value={guestInfo.phoneNumber}
                  onChange={(e) => setGuestInfo({...guestInfo, phoneNumber: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="090-1234-5678"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Select Date */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">日付を選択</h3>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <h4 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleDateString('ja-JP', { month: 'long', year: 'numeric' })}
              </h4>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the first day of the month */}
              {Array.from({ length: getFirstDayOfMonth(currentDate) }).map((_, index) => (
                <div key={index} className="h-10"></div>
              ))}
              
              {/* Days of the month */}
              {Array.from({ length: getDaysInMonth(currentDate) }).map((_, index) => {
                const day = index + 1;
                const today = new Date();
                const isToday = currentDate.getFullYear() === today.getFullYear() &&
                               currentDate.getMonth() === today.getMonth() &&
                               day === today.getDate();
                return (
                  <button
                    key={day}
                    onClick={() => handleDateSelect(day)}
                    className={`h-10 w-10 rounded-full text-sm font-medium transition-colors ${
                      isDateSelected(day)
                        ? 'bg-orange-400 text-white'
                        : isToday
                        ? 'bg-gray-200 text-gray-900'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Select Time */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            時間を選択
            {selectedServiceDuration && (
              <span className="text-sm text-gray-500 ml-2">
                (所要時間: {selectedServiceDuration}分)
              </span>
            )}
          </h3>
          
          {isTimeSlotsLoading ? (
            <div className="flex justify-center items-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
              <span className="ml-2 text-gray-600">利用可能な時間を検索中...</span>
            </div>
          ) : timeSlots.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {timeSlots.map((time) => (
                <button
                  key={time.start_time}
                  onClick={() => setStartTime(time.start_time)}
                  className={`p-3 rounded-xl text-sm font-medium transition-colors ${
                    startTime === time.start_time
                      ? 'bg-orange-400 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {time.display}
                </button>
              ))}
            </div>
          ) : appointmentDate && selectedStylist && selectedService ? (
            <div className="text-center py-6 text-gray-500">
              <p>選択された日付・サービスでは予約可能な時間がありません。</p>
              <p className="text-sm mt-1">別の日付をお選びください。</p>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p>日付、スタイリスト、サービスを選択してください</p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">備考</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="特別なリクエストやメモがあれば入力してください..."
            className="w-full p-4 border border-gray-200 rounded-xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Referral Info */}
        {referrerInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm">
              {referrerInfo.name}さんのご紹介でご予約いただきありがとうございます！
            </p>
          </div>
        )}

        {/* Book Button */}
        <button
          onClick={handleBooking}
          disabled={
            isBookingLoading || 
            !selectedService || 
            !appointmentDate || 
            !startTime ||
            (isGuestBooking && (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email || !guestInfo.phoneNumber))
          }
          className="w-full bg-orange-400 text-white py-4 rounded-xl font-semibold text-lg hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isBookingLoading ? '予約中...' : (isGuestBooking ? 'ゲスト予約する' : '予約する')}
        </button>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* Booking Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">予約内容</h3>
            <div className="space-y-3 text-sm">
              {selectedStylistData && (
                <div className="flex justify-between">
                  <span className="text-gray-600">スタイリスト</span>
                  <span className="font-medium">
                    {selectedStylistData.user.first_name} {selectedStylistData.user.last_name}
                  </span>
                </div>
              )}
              {selectedService && services.find(s => s.id === selectedService) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">サービス</span>
                  <span className="font-medium">
                    {services.find(s => s.id === selectedService)?.name}
                  </span>
                </div>
              )}
              {appointmentDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">日付</span>
                  <span className="font-medium">{appointmentDate}</span>
                </div>
              )}
              {startTime && (
                <div className="flex justify-between">
                  <span className="text-gray-600">時間</span>
                  <span className="font-medium">{startTime}</span>
                </div>
              )}
              {selectedService && services.find(s => s.id === selectedService)?.price && (
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-900 font-semibold">料金</span>
                  <span className="text-orange-400 font-bold">
                    ¥{services.find(s => s.id === selectedService)?.price?.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">備考</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="特別なリクエストやメモがあれば入力してください..."
              className="w-full p-4 border border-gray-200 rounded-xl resize-none h-24 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
