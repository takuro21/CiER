'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/StylistLayout';
import { 
  Calendar, Clock, Plus, Edit, Trash2, Share2, ChevronLeft, ChevronRight, 
  Users, Eye, X, QrCode, Save, Download, Settings, Camera, Copy, ArrowLeft,
  Filter, Search, Star, Zap, CheckCircle, AlertCircle, Coffee, Moon, Sun
} from 'lucide-react';
import Link from 'next/link';
import { Appointment } from '../../../lib/types';

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
}

interface ScheduleDay {
  date: string;
  dayOfWeek: string;
  slots: EnhancedTimeSlot[];
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
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'both' | 'available' | 'booked' | 'analytics'>('both');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

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
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; startTime: string; endTime: string } | null>(null);

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

  const dayShortNames = ['日', '月', '火', '水', '木', '金', '土'];

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

        slots.push({
          id: `${dateStr}-${timePoint.time}`,
          date: dateStr,
          start_time: timePoint.time,
          end_time: endTimeStr,
          is_available: true,
          duration_minutes: TIME_PRECISION,
          gridPosition: { row: index, column: dayOfWeek }
        });
      }
    });

    return slots;
  }, [workingHours, timeGrid]);

  const generateWeeklySchedule = useCallback(() => {
    const days: ScheduleDay[] = [];
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      days.push({
        date: dateStr,
        dayOfWeek: dayShortNames[i],
        slots: generateEnhancedDaySlots(dateStr, i)
      });
    }
    
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
    setSelectedTimeSlot({
      date: date,
      startTime: startTime,
      endTime: slot.end_time
    });
    setManualBookingData({
      ...manualBookingData,
      date: date,
      startTime: startTime
    });
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
                {schedule.map((day, index) => (
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
                {timeGrid.map((timePoint, timeIndex) => (
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
                    {schedule.map((day, dayIndex) => {
                      const slot = day.slots.find(s => s.start_time === timePoint.time);
                      
                      return (
                        <div
                          key={`${day.date}-${timePoint.time}`}
                          className="relative border-r border-gray-100 transition-all duration-200 hover:bg-blue-50/30"
                          onClick={() => {
                            if (slot?.is_available) {
                              handleTimeSlotClick(slot, day.date, timePoint.time);
                            }
                          }}
                        >
                          {slot?.appointmentBlock ? (
                            /* 予約ブロック */
                            <div 
                              className={`absolute inset-1 rounded-lg p-3 shadow-md cursor-pointer transition-all duration-300 ${
                                hoveredAppointmentId === slot.appointmentBlock.id
                                  ? 'transform scale-105 shadow-xl z-10'
                                  : ''
                              } bg-gradient-to-br from-emerald-400 to-emerald-500 text-white`}
                              onMouseEnter={() => setHoveredAppointmentId(slot.appointmentBlock!.id)}
                              onMouseLeave={() => setHoveredAppointmentId(null)}
                              onClick={() => {
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
                              <div className="text-xs opacity-80">
                                ¥{slot.appointmentBlock.price.toLocaleString()}
                              </div>
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
          <div className="fixed bottom-6 right-6 flex flex-col gap-3">
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
