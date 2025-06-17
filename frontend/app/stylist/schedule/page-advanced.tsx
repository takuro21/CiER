'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/StylistLayout';
import { 
  Calendar, Clock, Plus, Edit, Trash2, Share2, ChevronLeft, ChevronRight, 
  Users, Eye, X, QrCode, Save, Download, Settings, Camera, Copy, ArrowLeft
} from 'lucide-react';
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
  appointment?: Appointment;
  is_extension_time?: boolean;
}

interface ScheduleDay {
  date: string;
  dayOfWeek: string;
  slots: TimeSlot[];
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

interface ExtensionSettings {
  allowExtension: boolean;
  maxExtensionMinutes: number;
  showExtensionWarning: boolean;
}

interface DayStatus {
  type: 'work' | 'off' | 'short' | 'custom';
  label: string;
  color: string;
}

interface CalendarSettings {
  workLabel: string;
  offLabel: string;
  shortLabel: string;
  showTimes: boolean;
  backgroundColor: string;
  textColor: string;
  headerColor: string;
}

interface MonthlySchedule {
  [date: string]: DayStatus;
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

  // 高度な機能の状態
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: { start: '09:00', end: '18:00', isWorking: true },
    tuesday: { start: '09:00', end: '18:00', isWorking: true },
    wednesday: { start: '09:00', end: '18:00', isWorking: true },
    thursday: { start: '09:00', end: '18:00', isWorking: true },
    friday: { start: '09:00', end: '18:00', isWorking: true },
    saturday: { start: '09:00', end: '17:00', isWorking: true },
    sunday: { start: '10:00', end: '16:00', isWorking: false }
  });

  const [monthlySchedule, setMonthlySchedule] = useState<MonthlySchedule>({});

  const [extensionSettings, setExtensionSettings] = useState<ExtensionSettings>({
    allowExtension: false,
    maxExtensionMinutes: 60,
    showExtensionWarning: true
  });

  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>({
    workLabel: '出勤',
    offLabel: '休み',
    shortLabel: '時短',
    showTimes: true,
    backgroundColor: '#ffffff',
    textColor: '#212529',
    headerColor: '#007bff'
  });

  // QRコード・ブッキングリンク機能
  const [showQRModal, setShowQRModal] = useState(false);
  const [bookingUrl, setBookingUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // 設定モーダル
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'hours' | 'extension' | 'calendar'>('hours');

  // 手動予約用の状態
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; startTime: string; endTime: string } | null>(null);
  const [manualBookingData, setManualBookingData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    service: '',
    notes: '',
    durationMinutes: 60
  });

  const predefinedStatuses: DayStatus[] = [
    { type: 'work', label: '出勤', color: '#28a745' },
    { type: 'off', label: '休み', color: '#dc3545' },
    { type: 'short', label: '時短', color: '#ffc107' }
  ];

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
      
      // 保存されたデータを読み込み
      loadSavedSettings();
      generateWeeklySchedule();
    }
  }, [mounted, isLoading, user, router, currentWeek]);

  const loadSavedSettings = () => {
    if (!user?.id) return;

    const savedWorkingHours = localStorage.getItem(`workingHours_${user.id}`);
    if (savedWorkingHours) {
      setWorkingHours(JSON.parse(savedWorkingHours));
    }

    const savedMonthlySchedule = localStorage.getItem(`monthlySchedule_${user.id}`);
    if (savedMonthlySchedule) {
      setMonthlySchedule(JSON.parse(savedMonthlySchedule));
    }

    const savedCalendarSettings = localStorage.getItem(`calendarSettings_${user.id}`);
    if (savedCalendarSettings) {
      setCalendarSettings(JSON.parse(savedCalendarSettings));
    }

    const savedExtensionSettings = localStorage.getItem(`extensionSettings_${user.id}`);
    if (savedExtensionSettings) {
      setExtensionSettings(JSON.parse(savedExtensionSettings));
    }
  };

  const saveSettings = () => {
    if (!user?.id) return;

    localStorage.setItem(`workingHours_${user.id}`, JSON.stringify(workingHours));
    localStorage.setItem(`monthlySchedule_${user.id}`, JSON.stringify(monthlySchedule));
    localStorage.setItem(`calendarSettings_${user.id}`, JSON.stringify(calendarSettings));
    localStorage.setItem(`extensionSettings_${user.id}`, JSON.stringify(extensionSettings));
  };

  // 営業時間の範囲を取得
  const getTimeRange = () => {
    let earliestStart = 24 * 60; // 24:00を分で表現
    let latestEnd = 0;

    Object.values(workingHours).forEach(day => {
      if (day.isWorking) {
        const startMinutes = parseInt(day.start.split(':')[0]) * 60 + parseInt(day.start.split(':')[1]);
        const endMinutes = parseInt(day.end.split(':')[0]) * 60 + parseInt(day.end.split(':')[1]);
        
        earliestStart = Math.min(earliestStart, startMinutes);
        latestEnd = Math.max(latestEnd, endMinutes);
      }
    });

    // 延長営業を考慮
    if (extensionSettings.allowExtension) {
      latestEnd += extensionSettings.maxExtensionMinutes;
    }

    return {
      startHour: Math.floor(earliestStart / 60),
      startMinute: earliestStart % 60,
      endHour: Math.floor(latestEnd / 60),
      endMinute: latestEnd % 60
    };
  };

  const generateWeeklySchedule = () => {
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      weekDays.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek: dayShortNames[date.getDay()],
        slots: generateDaySlots(date.toISOString().split('T')[0], date.getDay()) as TimeSlot[]
      });
    }
    
    setSchedule(weekDays);
  };

  const generateDaySlots = (dateStr: string, dayOfWeek: number): TimeSlot[] => {
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayKeys[dayOfWeek] as keyof WorkingHours;
    const workingDay = workingHours[dayKey];

    // その日のスケジュール設定をチェック
    const daySchedule = monthlySchedule[dateStr];
    if (daySchedule && daySchedule.type === 'off') {
      return []; // 休みの日は空のスロットを返す
    }

    if (!workingDay.isWorking) {
      return [];
    }

    const timeRange = getTimeRange();
    const slots: TimeSlot[] = [];
    
    // 実際の営業時間を使用
    const startHour = parseInt(workingDay.start.split(':')[0]);
    const startMinute = parseInt(workingDay.start.split(':')[1]);
    const endHour = parseInt(workingDay.end.split(':')[0]);
    const endMinute = parseInt(workingDay.end.split(':')[1]);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      let nextMinute = currentMinute + 30;
      let nextHour = currentHour;
      if (nextMinute >= 60) {
        nextHour++;
        nextMinute = 0;
      }
      
      const endTimeStr = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;

      slots.push({
        id: `${dateStr}-${timeStr}`,
        date: dateStr,
        start_time: timeStr,
        end_time: endTimeStr,
        is_available: true,
        duration_minutes: 30,
        is_extension_time: currentHour >= parseInt(workingDay.end.split(':')[0])
      });

      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour++;
        currentMinute = 0;
      }
    }

    // サンプル予約データを適用
    const sampleAppointments = [
      { serviceName: 'カット', duration: 60, price: 4000 },
      { serviceName: 'カラー', duration: 120, price: 8000 },
      { serviceName: 'パーマ', duration: 180, price: 12000 },
      { serviceName: 'トリートメント', duration: 90, price: 6000 }
    ];

    // ランダムに予約を配置（デモ用）
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
    
    if ((dateStr === today || dateStr === tomorrow) && Math.random() > 0.3) {
      const randomAppointment = sampleAppointments[Math.floor(Math.random() * sampleAppointments.length)];
      const availableSlots = slots.filter(slot => slot.is_available);
      
      if (availableSlots.length > 0) {
        const randomSlotIndex = Math.floor(Math.random() * Math.max(1, availableSlots.length - 2));
        const startSlotIndex = slots.indexOf(availableSlots[randomSlotIndex]);
        const slotsNeeded = Math.ceil(randomAppointment.duration / 30);
        
        for (let i = 0; i < slotsNeeded && startSlotIndex + i < slots.length; i++) {
          const slot = slots[startSlotIndex + i];
          slot.is_available = false;
          slot.service_type = randomAppointment.serviceName;
          slot.price = randomAppointment.price;
        }
      }
    }

    return slots;
  };

  const openManualBookingModal = (slot: TimeSlot) => {
    setSelectedTimeSlot({
      date: slot.date,
      startTime: slot.start_time,
      endTime: slot.end_time
    });
    setManualBookingData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      service: '',
      notes: '',
      durationMinutes: 60
    });
    setShowManualBookingModal(true);
  };

  const createManualBooking = async () => {
    if (!selectedTimeSlot || !manualBookingData.customerName || !manualBookingData.service) {
      alert('必要な情報を入力してください');
      return;
    }

    try {
      console.log('手動予約作成:', {
        ...manualBookingData,
        appointmentDate: `${selectedTimeSlot.date}T${selectedTimeSlot.startTime}:00`,
        stylistId: user?.id
      });

      setShowManualBookingModal(false);
      alert('予約を作成しました');
      generateWeeklySchedule();
    } catch (error) {
      console.error('予約作成エラー:', error);
      alert('予約作成に失敗しました');
    }
  };

  const generateQRCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${baseUrl}/book/${user?.id || 'demo'}`;
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
                <h1 className="text-2xl font-bold text-gray-900 mb-2">高度なスケジュール管理</h1>
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
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  QRコード
                </button>
                <Link
                  href="/stylist/booking-link"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  予約リンク
                </Link>
              </div>
            </div>
          </div>

          {/* ウィークリービュー */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={goToPreviousWeek}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-lg font-medium">
                  {currentWeek.getFullYear()}年{currentWeek.getMonth() + 1}月 
                  ({schedule[0]?.date.split('-')[2]}日 - {schedule[6]?.date.split('-')[2]}日)
                </span>
                <button
                  onClick={goToNextWeek}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as any)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="both">すべて表示</option>
                  <option value="available">空き枠のみ</option>
                  <option value="booked">予約済みのみ</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {schedule.map((day) => {
                const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(day.date).getDay()] as keyof WorkingHours;
                const workingDay = workingHours[dayKey];
                const daySchedule = monthlySchedule[day.date];
                
                return (
                  <div key={day.date} className="min-h-[500px]">
                    <div className="text-center mb-3 p-2 rounded-lg" style={{
                      backgroundColor: daySchedule?.color || (workingDay.isWorking ? '#e8f5e8' : '#f8f9fa'),
                      color: calendarSettings.textColor
                    }}>
                      <div className="font-medium text-sm">{day.dayOfWeek}</div>
                      <div className="text-xs text-gray-500">{new Date(day.date).getDate()}日</div>
                      {workingDay.isWorking && (
                        <div className="text-xs mt-1">
                          {workingDay.start} - {workingDay.end}
                        </div>
                      )}
                      {daySchedule && (
                        <div className="text-xs mt-1 font-medium">
                          {daySchedule.label}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {day.slots
                        .filter(slot => {
                          if (viewMode === 'available') return slot.is_available;
                          if (viewMode === 'booked') return !slot.is_available;
                          return true;
                        })
                        .map((slot) => (
                        <div
                          key={slot.id}
                          onClick={() => slot.is_available && openManualBookingModal(slot)}
                          className={`p-2 text-xs rounded border cursor-pointer transition-colors ${
                            slot.is_available
                              ? 'bg-green-50 border-green-200 hover:bg-green-100'
                              : 'bg-orange-50 border-orange-200'
                          } ${slot.is_extension_time ? 'border-dashed opacity-75' : ''}`}
                        >
                          <div className="font-medium flex items-center justify-between">
                            <span>{slot.start_time}</span>
                            {slot.is_extension_time && (
                              <span className="text-orange-500 text-xs">延長</span>
                            )}
                          </div>
                          {!slot.is_available && slot.service_type && (
                            <div className="text-orange-700 mt-1">
                              予約済み
                              <br />
                              {slot.service_type}
                              {slot.price ? (
                                <br />¥{slot.price.toLocaleString()}
                              ) : (
                                <br />価格未設定
                              )}
                            </div>
                          )}
                          {slot.is_available && (
                            <div className="text-green-700 mt-1">空き</div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 text-xs text-gray-500 text-center">
                      {day.slots.filter(s => !s.is_available).length}件の予約
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* QRコードモーダル */}
        {showQRModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">予約用QRコード</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center">
                <div className="mb-4">
                  <img src={qrCodeUrl} alt="QR Code" className="mx-auto border rounded-lg" />
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">予約URL:</p>
                  <div className="flex items-center gap-2 p-2 bg-gray-100 rounded text-sm">
                    <span className="flex-1 truncate">{bookingUrl}</span>
                    <button
                      onClick={copyBookingUrl}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowQRModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    閉じる
                  </button>
                  <a
                    href={qrCodeUrl}
                    download="qr-code.png"
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-center"
                  >
                    ダウンロード
                  </a>
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
                    <button
                      onClick={() => setSettingsTab('extension')}
                      className={`w-full text-left p-3 rounded-lg mb-2 ${
                        settingsTab === 'extension' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      延長営業設定
                    </button>
                    <button
                      onClick={() => setSettingsTab('calendar')}
                      className={`w-full text-left p-3 rounded-lg mb-2 ${
                        settingsTab === 'calendar' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      カレンダー表示
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

                  {settingsTab === 'extension' && (
                    <div>
                      <h4 className="text-md font-medium mb-4">延長営業設定</h4>
                      <div className="space-y-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={extensionSettings.allowExtension}
                            onChange={(e) => setExtensionSettings({
                              ...extensionSettings,
                              allowExtension: e.target.checked
                            })}
                          />
                          <span>延長営業を許可する</span>
                        </label>
                        
                        {extensionSettings.allowExtension && (
                          <>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                最大延長時間（分）
                              </label>
                              <input
                                type="number"
                                value={extensionSettings.maxExtensionMinutes}
                                onChange={(e) => setExtensionSettings({
                                  ...extensionSettings,
                                  maxExtensionMinutes: parseInt(e.target.value) || 0
                                })}
                                min="0"
                                max="180"
                                step="30"
                                className="px-3 py-2 border rounded-lg w-full"
                              />
                            </div>
                            
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={extensionSettings.showExtensionWarning}
                                onChange={(e) => setExtensionSettings({
                                  ...extensionSettings,
                                  showExtensionWarning: e.target.checked
                                })}
                              />
                              <span>延長時間の警告を表示する</span>
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {settingsTab === 'calendar' && (
                    <div>
                      <h4 className="text-md font-medium mb-4">カレンダー表示設定</h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            出勤日ラベル
                          </label>
                          <input
                            type="text"
                            value={calendarSettings.workLabel}
                            onChange={(e) => setCalendarSettings({
                              ...calendarSettings,
                              workLabel: e.target.value
                            })}
                            className="px-3 py-2 border rounded-lg w-full"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            休日ラベル
                          </label>
                          <input
                            type="text"
                            value={calendarSettings.offLabel}
                            onChange={(e) => setCalendarSettings({
                              ...calendarSettings,
                              offLabel: e.target.value
                            })}
                            className="px-3 py-2 border rounded-lg w-full"
                          />
                        </div>

                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={calendarSettings.showTimes}
                            onChange={(e) => setCalendarSettings({
                              ...calendarSettings,
                              showTimes: e.target.checked
                            })}
                          />
                          <span>営業時間を表示する</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 p-6 border-t">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => {
                    saveSettings();
                    generateWeeklySchedule();
                    setShowSettingsModal(false);
                    alert('設定を保存しました');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 手動予約モーダル */}
        {showManualBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">手動予約作成</h3>
                <button
                  onClick={() => setShowManualBookingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    顧客名
                  </label>
                  <input
                    type="text"
                    value={manualBookingData.customerName}
                    onChange={(e) => setManualBookingData({...manualBookingData, customerName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="山田太郎"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    サービス
                  </label>
                  <select
                    value={manualBookingData.service}
                    onChange={(e) => setManualBookingData({...manualBookingData, service: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">サービスを選択</option>
                    <option value="1">カット (60分)</option>
                    <option value="2">カラー (120分)</option>
                    <option value="3">パーマ (180分)</option>
                    <option value="4">トリートメント (90分)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    value={manualBookingData.customerPhone}
                    onChange={(e) => setManualBookingData({...manualBookingData, customerPhone: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="090-1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={manualBookingData.customerEmail}
                    onChange={(e) => setManualBookingData({...manualBookingData, customerEmail: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="customer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    備考
                  </label>
                  <textarea
                    value={manualBookingData.notes}
                    onChange={(e) => setManualBookingData({...manualBookingData, notes: e.target.value})}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="特別な要望があれば記入してください"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowManualBookingModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={createManualBooking}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  予約作成
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
