'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/Layout';
import { Calendar, Clock, Plus, Edit, Trash2, Share2, ChevronLeft, ChevronRight, Users, Eye, X } from 'lucide-react';
import Link from 'next/link';
import { Appointment } from '../../../lib/types';

interface TimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  duration_minutes: number;
  price?: number;
  service_type?: string;
  appointment?: Appointment; // 予約情報が入っている場合
  is_continuation?: boolean; // 予約の継続枠かどうか
  main_appointment_id?: string; // 継続枠の場合、メインの予約ID
}

interface ScheduleDay {
  date: string;
  dayOfWeek: string;
  slots: TimeSlot[];
}

export default function StylistSchedulePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'both' | 'available' | 'booked'>('both');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

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
      
      // 週のスケジュールを生成
      generateWeeklySchedule();
    }
  }, [mounted, isLoading, user, router, currentWeek]);

  // 週のスケジュールを生成
  const generateWeeklySchedule = () => {
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      weekDays.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek: dayNames[date.getDay()],
        slots: generateDaySlots(date.toISOString().split('T')[0])
      });
    }
    
    setSchedule(weekDays);
  };

  // ダミーデータ生成用の予約サンプル
  const generateDaySlots = (date: string): TimeSlot[] => {
    // サンプル予約データ
    const appointments = [
      { appointmentId: '1', serviceName: 'カット', duration: 60, startTime: '10:00' },
      { appointmentId: '2', serviceName: 'カラー', duration: 120, startTime: '14:00' },
      { appointmentId: '3', serviceName: 'パーマ', duration: 90, startTime: '16:30' }
    ];

    // 基本スロット（30分刻み）
    const baseSlots: TimeSlot[] = [
      {
        id: `${date}-09:00`,
        date,
        start_time: '09:00',
        end_time: '09:30',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-09:30`,
        date,
        start_time: '09:30',
        end_time: '10:00',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-10:00`,
        date,
        start_time: '10:00',
        end_time: '10:30',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-10:30`,
        date,
        start_time: '10:30',
        end_time: '11:00',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-11:00`,
        date,
        start_time: '11:00',
        end_time: '11:30',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-11:30`,
        date,
        start_time: '11:30',
        end_time: '12:00',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-12:00`,
        date,
        start_time: '12:00',
        end_time: '12:30',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-12:30`,
        date,
        start_time: '12:30',
        end_time: '13:00',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-14:00`,
        date,
        start_time: '14:00',
        end_time: '14:30',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-14:30`,
        date,
        start_time: '14:30',
        end_time: '15:00',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-15:00`,
        date,
        start_time: '15:00',
        end_time: '15:30',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-15:30`,
        date,
        start_time: '15:30',
        end_time: '16:00',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-16:00`,
        date,
        start_time: '16:00',
        end_time: '16:30',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-16:30`,
        date,
        start_time: '16:30',
        end_time: '17:00',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-17:00`,
        date,
        start_time: '17:00',
        end_time: '17:30',
        is_available: true,
        duration_minutes: 30
      },
      {
        id: `${date}-17:30`,
        date,
        start_time: '17:30',
        end_time: '18:00',
        is_available: true,
        duration_minutes: 30
      }
    ];

    // ランダムに一部の予約のみ適用
    const activeAppointments = appointments.filter(() => Math.random() > 0.4);

    activeAppointments.forEach((appt, appointmentIndex) => {
      const startIndex = baseSlots.findIndex(slot => slot.start_time === appt.startTime);
      if (startIndex === -1) return;

      const slotsNeeded = Math.ceil(appt.duration / 30); // 30分単位で必要な枠数
      
      for (let i = 0; i < slotsNeeded && startIndex + i < baseSlots.length; i++) {
        const slotIndex = startIndex + i;
        const slot = baseSlots[slotIndex];
        
        slot.is_available = false;
        
        if (i === 0) {
          // 最初の枠：メイン予約情報を設定
          slot.appointment = {
            id: parseInt(appt.appointmentId),
            service: {
              id: appointmentIndex + 1,
              name: appt.serviceName,
              description: appt.serviceName,
              duration_minutes: appt.duration,
              price: appt.serviceName === 'カット' ? '4000' : '8000',
              is_active: true
            },
            stylist: {
              id: 1,
              user: {
                id: 1,
                username: user?.username || 'スタイリスト',
                email: 'stylist@example.com',
                first_name: '太郎',
                last_name: '美容師'
              },
              bio: '',
              experience_years: 5,
              services: [],
              is_available: true
            },
            appointment_date: date,
            start_time: appt.startTime,
            end_time: baseSlots[Math.min(startIndex + slotsNeeded - 1, baseSlots.length - 1)].end_time,
            total_amount: appt.serviceName === 'カット' ? '4000' : '8000',
            status: Math.random() > 0.5 ? 'PAID' as const : 'RESERVED' as const,
            requires_payment: true,
            created_at: new Date().toISOString()
          };
          slot.is_continuation = false;
        } else {
          // 継続枠：継続情報を設定
          slot.is_continuation = true;
          slot.main_appointment_id = appt.appointmentId;
          // 継続枠にも同じ予約情報を参照として設定
          slot.appointment = baseSlots[startIndex].appointment;
        }
      }
    });

    return baseSlots;
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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">スケジュール管理</h1>
                <p className="text-gray-600">予約状況と空き枠を一目で確認・管理できます</p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/stylist/dashboard"
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ダッシュボード
                </Link>
              </div>
            </div>
          </div>

          {/* 簡易テストコンテンツ */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">スケジュール表示テスト</h2>
            <p className="text-gray-600">ページが正常に読み込まれました。</p>
            <div className="mt-4 grid grid-cols-7 gap-2">
              {schedule.map((day) => (
                <div key={day.date} className="text-center">
                  <div className="font-medium text-sm">{day.dayOfWeek}</div>
                  <div className="text-xs text-gray-500">{day.date}</div>
                  <div className="mt-2 text-xs">
                    {day.slots.filter(s => !s.is_available).length}件の予約
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
