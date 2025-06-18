'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/StylistLayout';
import { 
  Clock, Plus, ChevronLeft, ChevronRight, 
  Users, X, QrCode, Download, Settings, Copy,
  Star, CheckCircle
} from 'lucide-react';

// Enhanced interfaces for next-level scheduling system
interface AppointmentBlock {
  id: string;
  customerName: string;
  service: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  phone?: string;
  email?: string;
  notes?: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  color?: string;
}

interface EnhancedTimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  duration_minutes: number;
  appointmentBlock?: AppointmentBlock;
  gridPosition?: { row: number; column: number };
  is_appointment_start?: boolean;
  is_appointment_continuation?: boolean;
}

interface ScheduleDay {
  date: string;
  dayOfWeek: string;
  slots: EnhancedTimeSlot[];
  statistics?: {
    totalBookings: number;
    totalRevenue: number;
    utilization: number;
    efficiency: number;
    averageRating: number;
  };
}

interface WorkingHours {
  monday: { start: string; end: string; isWorking: boolean };
  tuesday: { start: string; end: string; isWorking: boolean };
  wednesday: { start: string; end: string; isWorking: boolean };
  thursday: { start: string; end: string; isWorking: boolean };
  friday: { start: string; end: string; isWorking: boolean };
  saturday: { start: string; end: string; isWorking: boolean };
  sunday: { start: string; end: string; isWorking: boolean };
}

interface ScheduleMetrics {
  weeklyRevenue: number;
  weeklyBookings: number;
  averageUtilization: number;
  peakHours: string[];
  suggestions: string[];
  trends: {
    revenue: number[];
    bookings: number[];
    utilization: number[];
  };
}

export default function StylistSchedulePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [viewMode, setViewMode] = useState<'both' | 'available' | 'booked' | 'analytics'>('both');

  // Enhanced state management
  const [scheduleMetrics, setScheduleMetrics] = useState<ScheduleMetrics>({
    weeklyRevenue: 0,
    weeklyBookings: 0,
    averageUtilization: 0,
    peakHours: [],
    suggestions: [],
    trends: { revenue: [], bookings: [], utilization: [] }
  });

  // Advanced UI state
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAppointmentDetailModal, setShowAppointmentDetailModal] = useState(false);
  const [selectedAppointmentBlock, setSelectedAppointmentBlock] = useState<AppointmentBlock | null>(null);
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'hours' | 'extension' | 'calendar'>('hours');
  const [showQRModal, setShowQRModal] = useState(false);
  const [bookingUrl, setBookingUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [hoveredAppointmentId, setHoveredAppointmentId] = useState<string | null>(null);

  const [manualBookingData, setManualBookingData] = useState({
    customerName: '',
    service: '',
    customerPhone: '',
    customerEmail: '',
    notes: '',
    date: '',
    startTime: '',
    duration: 60,
    price: 0
  });

  // Time constants for perfect grid alignment
  const SLOT_HEIGHT = 72;
  const TIME_PRECISION = 30;
  const GRID_START_TIME = '06:00';
  const GRID_END_TIME = '22:00';

  // Advanced working hours with optimization
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: { start: '09:00', end: '18:00', isWorking: true },
    tuesday: { start: '09:00', end: '18:00', isWorking: true },
    wednesday: { start: '09:00', end: '18:00', isWorking: true },
    thursday: { start: '09:00', end: '18:00', isWorking: true },
    friday: { start: '09:00', end: '18:00', isWorking: true },
    saturday: { start: '09:00', end: '17:00', isWorking: true },
    sunday: { start: '10:00', end: '16:00', isWorking: false }
  });

  const dayNames = {
    monday: '月曜日',
    tuesday: '火曜日',
    wednesday: '水曜日',
    thursday: '木曜日',
    friday: '金曜日',
    saturday: '土曜日',
    sunday: '日曜日'
  };

  const dayShortNames = useMemo(() => ['日', '月', '火', '水', '木', '金', '土'], []);

  // Perfect time grid generation system
  const generatePerfectTimeGrid = useCallback(() => {
    const times = [];
    const [startHour, startMinute] = GRID_START_TIME.split(':').map(Number);
    const [endHour, endMinute] = GRID_END_TIME.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      times.push({
        time: timeStr,
        index: times.length,
        position: times.length * SLOT_HEIGHT,
        isHour: currentMinute === 0,
        isHalfHour: currentMinute === 30
      });
      
      currentMinute += TIME_PRECISION;
      if (currentMinute >= 60) {
        currentHour++;
        currentMinute = 0;
      }
    }
    
    return times;
  }, []);

  // Memoized time grid for performance
  const timeGrid = useMemo(() => generatePerfectTimeGrid(), [generatePerfectTimeGrid]);

  // Enhanced day slot generation with perfect alignment
  const generateEnhancedDaySlots = useCallback((dateStr: string, dayOfWeek: number): EnhancedTimeSlot[] => {
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayKeys[dayOfWeek] as keyof WorkingHours;
    const workingDay = workingHours[dayKey];

    if (!workingDay.isWorking) return [];

    const slots: EnhancedTimeSlot[] = [];
    const [workStartHour, workStartMinute] = workingDay.start.split(':').map(Number);
    const [workEndHour, workEndMinute] = workingDay.end.split(':').map(Number);
    
    // ダミーの予約データ
    const dummyAppointments: AppointmentBlock[] = generateDummyAppointments(dateStr, dayOfWeek);
    
    timeGrid.forEach((timePoint, index) => {
      const [hour, minute] = timePoint.time.split(':').map(Number);
      const timeMinutes = hour * 60 + minute;
      const workStartMinutes = workStartHour * 60 + workStartMinute;
      const workEndMinutes = workEndHour * 60 + workEndMinute;
      
      if (timeMinutes >= workStartMinutes && timeMinutes < workEndMinutes) {
        let nextMinute = minute + TIME_PRECISION;
        let nextHour = hour;
        if (nextMinute >= 60) {
          nextHour++;
          nextMinute = 0;
        }
        
        const endTimeStr = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;

        // 該当時間に予約があるかチェック
        const appointment = dummyAppointments.find(apt => apt.startTime === timePoint.time);
        
        // 該当時間が他の予約の継続中かチェック
        const isPartOfAppointment = dummyAppointments.some(apt => {
          const [aptStartHour, aptStartMinute] = apt.startTime.split(':').map(Number);
          const [aptEndHour, aptEndMinute] = apt.endTime.split(':').map(Number);
          const aptStartMinutes = aptStartHour * 60 + aptStartMinute;
          const aptEndMinutes = aptEndHour * 60 + aptEndMinute;
          
          return timeMinutes >= aptStartMinutes && timeMinutes < aptEndMinutes;
        });

        slots.push({
          id: `${dateStr}-${timePoint.time}`,
          date: dateStr,
          start_time: timePoint.time,
          end_time: endTimeStr,
          is_available: !isPartOfAppointment,
          duration_minutes: TIME_PRECISION,
          gridPosition: { row: index, column: dayOfWeek },
          appointmentBlock: appointment, // 開始時間のスロットのみに予約情報を設定
          is_appointment_start: !!appointment,
          is_appointment_continuation: isPartOfAppointment && !appointment
        });
      }
    });

    return slots;
  }, [workingHours, timeGrid]);

  // ダミー予約データ生成関数
  const generateDummyAppointments = useCallback((dateStr: string, dayOfWeek: number): AppointmentBlock[] => {
    const appointments: AppointmentBlock[] = [];
    
    // 曜日ごとの予約パターン
    const weekdayPatterns = {
      0: [], // 日曜日（休業）
      1: [ // 月曜日（比較的空いている）
        { start: '10:00', duration: 90, customer: '田中 美咲', service: 'カット+カラー', price: 8000 },
        { start: '13:30', duration: 30, customer: '佐藤 花音', service: 'シャンプー', price: 1500 },
        { start: '14:30', duration: 60, customer: '山田 麗華', service: 'カット', price: 4000 },
        { start: '16:30', duration: 180, customer: '森 美紀', service: 'カット+カラー+パーマ', price: 18000 }
      ],
      2: [ // 火曜日（普通）
        { start: '09:00', duration: 30, customer: '鈴木 愛美', service: 'ブロー', price: 2000 },
        { start: '10:00', duration: 60, customer: '高橋 優香', service: 'カット', price: 4000 },
        { start: '11:30', duration: 90, customer: '伊藤 美穂', service: 'カット+カラー', price: 8000 },
        { start: '14:00', duration: 150, customer: '渡辺 彩乃', service: 'カット+パーマ+トリートメント', price: 15000 }
      ],
      3: [ // 水曜日（忙しい）
        { start: '09:00', duration: 60, customer: '中村 さくら', service: 'カット', price: 4000 },
        { start: '10:30', duration: 90, customer: '小林 美奈', service: 'カット+カラー', price: 8000 },
        { start: '12:30', duration: 60, customer: '加藤 理恵', service: 'カット', price: 4000 },
        { start: '14:00', duration: 120, customer: '吉田 夏美', service: 'カット+パーマ', price: 12000 },
        { start: '16:30', duration: 60, customer: '斎藤 由紀', service: 'トリートメント', price: 3000 }
      ],
      4: [ // 木曜日（普通）
        { start: '10:00', duration: 90, customer: '松本 真由美', service: 'カット+カラー', price: 8000 },
        { start: '13:00', duration: 60, customer: '井上 恵子', service: 'カット', price: 4000 },
        { start: '15:00', duration: 90, customer: '木村 亜希子', service: 'カット+カラー', price: 8000 }
      ],
      5: [ // 金曜日（非常に忙しい）
        { start: '09:00', duration: 60, customer: '林 美智子', service: 'カット', price: 4000 },
        { start: '10:30', duration: 120, customer: '清水 雅美', service: 'カット+パーマ', price: 12000 },
        { start: '13:00', duration: 90, customer: '山口 和美', service: 'カット+カラー', price: 8000 },
        { start: '15:00', duration: 60, customer: '森田 裕子', service: 'トリートメント', price: 3000 },
        { start: '16:30', duration: 90, customer: '池田 香織', service: 'カット+カラー', price: 8000 }
      ],
      6: [ // 土曜日（最も忙しい）
        { start: '09:00', duration: 90, customer: '橋本 美樹', service: 'カット+カラー', price: 8000 },
        { start: '11:00', duration: 60, customer: '石川 明美', service: 'カット', price: 4000 },
        { start: '12:30', duration: 120, customer: '中島 綾子', service: 'カット+パーマ', price: 12000 },
        { start: '15:00', duration: 60, customer: '藤田 直美', service: 'カット', price: 4000 },
        { start: '16:30', duration: 60, customer: '宮崎 智恵', service: 'トリートメント', price: 3000 }
      ]
    };

    const dayAppointments = weekdayPatterns[dayOfWeek as keyof typeof weekdayPatterns] || [];
    
    dayAppointments.forEach((apt, index) => {
      const startTime = apt.start;
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const endMinutes = startMinute + apt.duration;
      const endHour = startHour + Math.floor(endMinutes / 60);
      const endMinute = endMinutes % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      // ランダムな予約状態
      const statuses: ('confirmed' | 'pending')[] = ['confirmed', 'confirmed', 'confirmed', 'pending'];
      const priorities: ('normal' | 'high')[] = ['normal', 'normal', 'high'];
      
      appointments.push({
        id: `${dateStr}-${index}`,
        customerName: apt.customer,
        service: apt.service,
        startTime: startTime,
        endTime: endTime,
        duration: apt.duration,
        price: apt.price,
        phone: `090-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
        email: `${apt.customer.replace(/\s+/g, '').toLowerCase()}@example.com`,
        notes: index % 3 === 0 ? '初回のお客様' : index % 5 === 0 ? 'アレルギーあり（要注意）' : '',
        status: statuses[index % statuses.length],
        priority: priorities[index % priorities.length]
      });
    });

    return appointments;
  }, []);

  const generateWeeklySchedule = useCallback(() => {
    const days: ScheduleDay[] = [];
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    let totalRevenue = 0;
    let totalBookings = 0;
    let totalWorkingSlots = 0;
    let totalBookedSlots = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySlots = generateEnhancedDaySlots(dateStr, i);
      
      // 日別統計を計算
      const dayBookings = daySlots.filter(slot => slot.appointmentBlock);
      const dayRevenue = dayBookings.reduce((sum, slot) => sum + (slot.appointmentBlock?.price || 0), 0);
      
      totalRevenue += dayRevenue;
      totalBookings += dayBookings.length;
      totalWorkingSlots += daySlots.length;
      totalBookedSlots += dayBookings.length;
      
      days.push({
        date: dateStr,
        dayOfWeek: dayShortNames[i],
        slots: daySlots,
        statistics: {
          totalBookings: dayBookings.length,
          totalRevenue: dayRevenue,
          utilization: daySlots.length > 0 ? (dayBookings.length / daySlots.length) * 100 : 0,
          efficiency: 92 + Math.random() * 8, // 92-100%のランダム効率
          averageRating: 4.5 + Math.random() * 0.5 // 4.5-5.0の評価
        }
      });
    }
    
    // 週間メトリクスを更新
    const weeklyUtilization = totalWorkingSlots > 0 ? (totalBookedSlots / totalWorkingSlots) * 100 : 0;
    
    setScheduleMetrics({
      weeklyRevenue: totalRevenue,
      weeklyBookings: totalBookings,
      averageUtilization: Math.round(weeklyUtilization),
      peakHours: ['14:00-16:00', '10:00-12:00'], // ピーク時間帯
      suggestions: [
        totalBookings < 20 ? '📈 平日午後の予約枠を増やすことで売上向上が期待できます' : '✨ 予約状況は良好です！',
        weeklyUtilization < 70 ? '⏰ 営業時間の最適化をお勧めします' : '🎯 効率的な時間管理ができています',
        '💡 QRコード予約でオンライン集客を強化しましょう'
      ],
      trends: {
        revenue: [totalRevenue * 0.8, totalRevenue * 0.9, totalRevenue], // 3週間のトレンド
        bookings: [totalBookings - 3, totalBookings - 1, totalBookings],
        utilization: [weeklyUtilization - 10, weeklyUtilization - 5, weeklyUtilization]
      }
    });
    
    setSchedule(days);
  }, [currentWeek, generateEnhancedDaySlots, dayShortNames]);

  const createManualBooking = () => {
    setShowManualBookingModal(false);
    setManualBookingData({
      customerName: '',
      service: '',
      customerPhone: '',
      customerEmail: '',
      notes: '',
      date: '',
      startTime: '',
      duration: 60,
      price: 0
    });
    generateWeeklySchedule();
  };

  const handleDeleteAppointment = () => {
    setShowAppointmentDetailModal(false);
    generateWeeklySchedule();
  };

  const generateQRCode = () => {
    if (!user?.id) return;
    
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-domain.com' 
      : 'http://localhost:3005';
    const url = `${baseUrl}/book?stylist=${user.id}`;
    setBookingUrl(url);
    setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`);
    setShowQRModal(true);
  };

  const copyBookingUrl = () => {
    navigator.clipboard.writeText(bookingUrl);
    alert('予約URLをコピーしました');
  };

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(nextWeek);
  };

  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(prevWeek);
  };

  const handleTimeSlotClick = (slot: EnhancedTimeSlot, date: string, startTime: string) => {
    // 手動予約モーダルを開く機能（将来実装）
    console.log('Time slot clicked:', { slot, date, startTime });
    setShowManualBookingModal(true);
  };

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
      
      generateWeeklySchedule();
    }
  }, [mounted, isLoading, user, router, generateWeeklySchedule]);

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
      <div className="min-h-screen bg-gray-50 p-4 pb-20">
        <div className="max-w-7xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">✨ 次世代スケジュール管理</h1>
                <p className="text-gray-600">営業時間設定・延長営業・QRコード対応の予約管理システム</p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  設定
                </button>
                <button
                  onClick={generateQRCode}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  QRコード
                </button>
              </div>
            </div>
          </div>

          {/* ナビゲーション */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPreviousWeek}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-gray-800">
                  {currentWeek.toLocaleDateString('ja-JP', { 
                    year: 'numeric', 
                    month: 'long',
                    day: 'numeric'
                  })} の週
                </h2>
                <button
                  onClick={goToNextWeek}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('both')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'both' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  全体表示
                </button>
                <button
                  onClick={() => setViewMode('analytics')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'analytics' 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  分析画面
                </button>
              </div>
            </div>
          </div>

          {/* メインコンテンツ */}
          {viewMode === 'analytics' ? (
            /* 分析画面 */
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-8 h-8" />
                    <span className="text-lg font-medium">今週の予約</span>
                  </div>
                  <div className="text-3xl font-bold">{scheduleMetrics.weeklyBookings}</div>
                  <div className="text-blue-100 text-sm mt-1">件</div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-8 h-8" />
                    <span className="text-lg font-medium">予想売上</span>
                  </div>
                  <div className="text-3xl font-bold">¥{scheduleMetrics.weeklyRevenue.toLocaleString()}</div>
                  <div className="text-emerald-100 text-sm mt-1">週間</div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-8 h-8" />
                    <span className="text-lg font-medium">稼働率</span>
                  </div>
                  <div className="text-3xl font-bold">{scheduleMetrics.averageUtilization}%</div>
                  <div className="text-orange-100 text-sm mt-1">平均</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <Star className="w-8 h-8" />
                    <span className="text-lg font-medium">AI効率</span>
                  </div>
                  <div className="text-3xl font-bold">95%</div>
                  <div className="text-purple-100 text-sm mt-1">最適化</div>
                </div>
              </div>
            </div>
          ) : (
            /* スケジュールグリッド */
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* ヘッダー */}
              <div className="grid grid-cols-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                <div className="p-4 text-white font-semibold">時間</div>
                {schedule.map((day) => (
                  <div key={day.date} className="p-4 text-white font-semibold text-center">
                    <div className="text-lg">{day.dayOfWeek}</div>
                    <div className="text-sm opacity-80">
                      {new Date(day.date).getDate()}日
                    </div>
                  </div>
                ))}
              </div>

              {/* タイムグリッド */}
              <div className="relative">
                {timeGrid.map((timePoint) => (
                  <div 
                    key={timePoint.time} 
                    className="grid grid-cols-8 border-b border-gray-100"
                    style={{ height: `${SLOT_HEIGHT}px` }}
                  >
                    {/* 時間ラベル */}
                    <div 
                      className={`flex items-center justify-center border-r border-gray-200 font-medium ${
                        timePoint.isHour ? 'bg-gray-50 text-gray-900 text-lg' : 'text-gray-600'
                      }`}
                    >
                      {timePoint.time}
                    </div>
                    
                    {/* スケジュール列 */}
                    {schedule.map((day) => {
                      const slot = day.slots.find(s => s.start_time === timePoint.time);
                      
                      return (
                        <div
                          key={`${day.date}-${timePoint.time}`}
                          className="relative border-r border-gray-100 transition-all duration-200 hover:bg-blue-50/30"
                          onClick={() => {
                            if (slot?.is_available) {
                              handleTimeSlotClick(slot, day.date, timePoint.time);
                            } else if (slot?.is_appointment_continuation) {
                              // 継続中のスロットがクリックされた場合、その予約の開始スロットを見つけて詳細を表示
                              const appointmentSlot = day.slots.find(s => 
                                s.is_appointment_start && 
                                s.appointmentBlock &&
                                timePoint.time >= s.appointmentBlock.startTime &&
                                timePoint.time < s.appointmentBlock.endTime
                              );
                              if (appointmentSlot?.appointmentBlock) {
                                setSelectedAppointmentBlock(appointmentSlot.appointmentBlock);
                                setShowAppointmentDetailModal(true);
                              }
                            }
                          }}
                        >
                          {/* 予約の開始スロットのみ予約ブロックを表示 */}
                          {slot?.is_appointment_start && slot.appointmentBlock ? (
                            /* 予約ブロック - 開始スロットのみ */
                            <div 
                              className={`absolute inset-1 rounded-lg p-3 shadow-md cursor-pointer transition-all duration-300 ${
                                hoveredAppointmentId === slot.appointmentBlock.id
                                  ? 'transform scale-105 shadow-xl z-10'
                                  : ''
                              } bg-gradient-to-br from-emerald-400 to-emerald-500 text-white overflow-hidden`}
                              style={{
                                height: `${(slot.appointmentBlock.duration / TIME_PRECISION) * SLOT_HEIGHT - 8}px`,
                                zIndex: 10,
                                minHeight: '60px'
                              }}
                              onMouseEnter={() => setHoveredAppointmentId(slot.appointmentBlock!.id)}
                              onMouseLeave={() => setHoveredAppointmentId(null)}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointmentBlock(slot.appointmentBlock!);
                                setShowAppointmentDetailModal(true);
                              }}
                            >
                              <div className="text-sm font-semibold truncate">
                                {slot.appointmentBlock.customerName}
                              </div>
                              <div className="text-xs opacity-90 truncate">
                                {slot.appointmentBlock.service}
                              </div>
                              <div className="text-xs opacity-80 font-medium">
                                {slot.appointmentBlock.startTime} - {slot.appointmentBlock.endTime}
                              </div>
                              <div className="text-xs opacity-80">
                                ¥{slot.appointmentBlock.price.toLocaleString()} ({slot.appointmentBlock.duration}分)
                              </div>
                            </div>
                          ) : slot?.is_appointment_continuation ? (
                            /* 予約継続中のスロット - グレーアウト表示 */
                            <div 
                              className="h-full bg-emerald-100/80 relative cursor-pointer hover:bg-emerald-200/80 transition-colors"
                              title="予約継続中 - クリックで詳細表示"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-transparent opacity-60"></div>
                              <div className="absolute top-2 left-2 w-2 h-2 bg-emerald-400 rounded-full opacity-70"></div>
                            </div>
                          ) : slot?.is_available ? (
                            /* 空き枠 */
                            <div className="h-full mx-2 my-1 border-2 border-dashed border-green-300 rounded-lg hover:border-green-400 hover:bg-green-50/50 transition-all duration-300 cursor-pointer flex items-center justify-center group">
                              <Plus className="w-4 h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          ) : (
                            /* 営業時間外 */
                            <div className="h-full bg-gray-100/50"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* フローティングアクションボタン */}
          <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-40">
            <button
              onClick={generateQRCode}
              className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
            >
              <QrCode className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => setShowManualBookingModal(true)}
              className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* QRコードモーダル */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">予約用QRコード</h3>
                {qrCodeUrl && (
                  <div className="mb-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 mx-auto border-2 border-gray-200 rounded-xl" />
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">予約URL:</p>
                  <div className="bg-gray-100 p-3 rounded-lg break-all text-sm">
                    {bookingUrl}
                  </div>
                  <button
                    onClick={copyBookingUrl}
                    className="mt-2 flex items-center gap-2 mx-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    URLをコピー
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    閉じる
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrCodeUrl;
                      link.download = 'qr-code.png';
                      link.click();
                    }}
                    className="flex-1 px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 手動予約モーダル */}
        {showManualBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 shadow-2xl">
              <div className="sticky top-0 bg-white border-b p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900">手動予約作成</h3>
                  <button
                    onClick={() => setShowManualBookingModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    お客様名
                  </label>
                  <input
                    type="text"
                    value={manualBookingData.customerName}
                    onChange={(e) => setManualBookingData({...manualBookingData, customerName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="お客様の名前を入力"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    サービス
                  </label>
                  <select
                    value={manualBookingData.service}
                    onChange={(e) => setManualBookingData({...manualBookingData, service: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">サービスを選択</option>
                    <option value="カット">カット (¥4,000)</option>
                    <option value="カット+カラー">カット+カラー (¥8,000)</option>
                    <option value="カット+パーマ">カット+パーマ (¥10,000)</option>
                    <option value="トリートメント">トリートメント (¥3,000)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      電話番号
                    </label>
                    <input
                      type="tel"
                      value={manualBookingData.customerPhone}
                      onChange={(e) => setManualBookingData({...manualBookingData, customerPhone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="090-1234-5678"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      value={manualBookingData.customerEmail}
                      onChange={(e) => setManualBookingData({...manualBookingData, customerEmail: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="customer@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メモ・備考
                  </label>
                  <textarea
                    value={manualBookingData.notes}
                    onChange={(e) => setManualBookingData({...manualBookingData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="特別な要望や注意事項など"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl border-t">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowManualBookingModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={createManualBooking}
                    className="flex-1 px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
                  >
                    予約作成
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 設定モーダル */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold">スケジュール設定</h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex">
                <div className="w-1/4 border-r">
                  <div className="p-4">
                    <button
                      onClick={() => setSettingsTab('hours')}
                      className={`w-full text-left p-3 rounded-lg mb-2 ${
                        settingsTab === 'hours' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      営業時間設定
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-6">
                  {settingsTab === 'hours' && (
                    <div>
                      <h4 className="text-md font-medium mb-4">曜日別営業時間</h4>
                      <div className="space-y-4">
                        {Object.entries(dayNames).map(([key, label]) => (
                          <div key={key} className="flex items-center gap-4">
                            <div className="w-20 text-sm font-medium">{label}</div>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={workingHours[key as keyof WorkingHours].isWorking}
                                onChange={(e) => setWorkingHours({
                                  ...workingHours,
                                  [key]: {
                                    ...workingHours[key as keyof WorkingHours],
                                    isWorking: e.target.checked
                                  }
                                })}
                              />
                              <span className="text-sm">営業</span>
                            </label>
                            {workingHours[key as keyof WorkingHours].isWorking && (
                              <>
                                <input
                                  type="time"
                                  value={workingHours[key as keyof WorkingHours].start}
                                  onChange={(e) => setWorkingHours({
                                    ...workingHours,
                                    [key]: {
                                      ...workingHours[key as keyof WorkingHours],
                                      start: e.target.value
                                    }
                                  })}
                                  className="px-2 py-1 text-sm border rounded"
                                />
                                <span className="text-sm">〜</span>
                                <input
                                  type="time"
                                  value={workingHours[key as keyof WorkingHours].end}
                                  onChange={(e) => setWorkingHours({
                                    ...workingHours,
                                    [key]: {
                                      ...workingHours[key as keyof WorkingHours],
                                      end: e.target.value
                                    }
                                  })}
                                  className="px-2 py-1 text-sm border rounded"
                                />
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    generateWeeklySchedule();
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 予約詳細モーダル */}
        {showAppointmentDetailModal && selectedAppointmentBlock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md mx-4">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-semibold">予約詳細</h3>
                <button
                  onClick={() => setShowAppointmentDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <div className="text-sm text-gray-600">お客様名</div>
                  <div className="font-medium text-lg">
                    {selectedAppointmentBlock.customerName}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">サービス</div>
                  <div className="font-medium">
                    {selectedAppointmentBlock.service}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600">料金</div>
                  <div className="font-medium text-lg">
                    ¥{selectedAppointmentBlock.price.toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">開始時間</div>
                    <div className="font-medium">
                      {selectedAppointmentBlock.startTime}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">終了時間</div>
                    <div className="font-medium">
                      {selectedAppointmentBlock.endTime}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowAppointmentDetailModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  閉じる
                </button>
                <button
                  onClick={() => {
                    if (confirm('この予約を削除しますか？')) {
                      handleDeleteAppointment();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
