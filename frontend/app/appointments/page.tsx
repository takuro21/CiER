'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { appointmentsAPI } from '../../lib/api';
import type { Appointment } from '../../lib/types';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';

export default function AppointmentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 認証チェックをuseEffectで行う
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setShouldRedirect(true);
      } else {
        setShouldRedirect(false);
      }
    }
  }, [user, isLoading]);

  // リダイレクト処理を別のuseEffectで実行
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login');
    }
  }, [shouldRedirect, router]);

  const { data: appointmentsResponse, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsAPI.getAll(),
    enabled: mounted && !isLoading && !!user && !shouldRedirect
  });

  const appointments = appointmentsResponse?.data || [];

  // Prevent hydration mismatch by not rendering until client-side
  if (!mounted || isLoading || shouldRedirect) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ユーザーがログインしていない場合（念のため）
  if (!user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600 bg-green-50';
      case 'RESERVED':
        return 'text-yellow-600 bg-yellow-50';
      case 'CANCELLED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return '支払い済み';
      case 'RESERVED':
        return '予約済み';
      case 'CANCELLED':
        return 'キャンセル';
      default:
        return status;
    }
  };

  const handleCancel = async (appointmentId: number) => {
    if (confirm('この予約をキャンセルしますか？')) {
      try {
        await appointmentsAPI.cancel(appointmentId);
        // Refresh the appointments list
        window.location.reload();
      } catch (error) {
        alert('キャンセルに失敗しました');
      }
    }
  };

  return (
    <Layout maxWidth="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">予約一覧</h1>
            <button
              onClick={() => router.push('/book')}
              className="bg-orange-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-500 transition-colors"
            >
              新しい予約
            </button>
          </div>
        </div>

        {appointmentsLoading ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-4"></div>
            <p className="text-gray-600">予約を読み込み中...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">📅</span>
            </div>
            <p className="text-gray-500 mb-4">まだ予約がありません</p>
            <button
              onClick={() => router.push('/book')}
              className="bg-orange-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-500 transition-colors"
            >
              予約する
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appointments.map((appointment: Appointment) => (
              <div key={appointment.id} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{appointment.service.name}</h3>
                    <p className="text-gray-600 text-sm">
                      {appointment.stylist.user.first_name} {appointment.stylist.user.last_name}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      appointment.status
                    )}`}
                  >
                    {getStatusText(appointment.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">日時</span>
                    <span className="font-medium text-gray-900">
                      {appointment.appointment_date} {appointment.start_time}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">料金</span>
                    <span className="font-medium text-gray-900">¥{appointment.total_amount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">予約日</span>
                    <span className="text-gray-600">
                      {new Date(appointment.created_at).toLocaleDateString('ja-JP')}
                    </span>
                  </div>
                </div>

                {appointment.status === 'RESERVED' && (
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    {appointment.requires_payment && (
                      <span className="text-yellow-600 text-xs bg-yellow-50 px-2 py-1 rounded">
                        店舗でお支払い
                      </span>
                    )}
                    <button
                      onClick={() => handleCancel(appointment.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      キャンセル
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Book New Appointment Button */}
        {appointments.length > 0 && (
          <div className="text-center">
            <button
              onClick={() => router.push('/book')}
              className="bg-orange-400 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-orange-500 transition-colors"
            >
              新しい予約をする
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
