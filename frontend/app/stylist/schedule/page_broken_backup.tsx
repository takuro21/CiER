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
  isRecurring?: boolean;
  recurringId?: string;
  tags?: string[];
  customerRating?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  profit?: number;
  preparation?: number; // minutes needed before appointment
  cleanup?: number; // minutes needed after appointment
}

interface EnhancedTimeSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  duration_minutes: number;
  price?: number;
  service_type?: string;
  appointment?: Appointment;
  appointmentBlock?: AppointmentBlock;
  is_extension_time?: boolean;
  is_appointment_start?: boolean;
  is_appointment_continuation?: boolean;
  gridPosition?: { row: number; column: number };
  conflictLevel?: 'none' | 'warning' | 'error';
  efficiency?: number; // 0-100 utilization score
  breakTime?: boolean;
  bufferTime?: boolean;
  isHighlight?: boolean;
  animation?: string;
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
  weather?: string;
  mood?: 'productive' | 'relaxed' | 'busy' | 'stressed';
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
  theme: 'light' | 'dark' | 'auto';
  animations: boolean;
  gridSize: 'compact' | 'normal' | 'spacious';
  showStatistics: boolean;
  smartSuggestions: boolean;
}

interface MonthlySchedule {
  [date: string]: DayStatus;
}

// Advanced scheduling features
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

interface SmartFeatures {
  autoOptimize: boolean;
  predictiveScheduling: boolean;
  dynamicPricing: boolean;
  bufferTimeManagement: boolean;
  overbookingPrevention: boolean;
  waitlistManagement: boolean;
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
  const [isLoading3D, setIsLoading3D] = useState(false);
  const [scheduleMetrics, setScheduleMetrics] = useState<ScheduleMetrics>({
    weeklyRevenue: 0,
    weeklyBookings: 0,
    averageUtilization: 0,
    peakHours: [],
    suggestions: [],
    trends: { revenue: [], bookings: [], utilization: [] }
  });
  const [smartFeatures, setSmartFeatures] = useState<SmartFeatures>({
    autoOptimize: false,
    predictiveScheduling: true,
    dynamicPricing: false,
    bufferTimeManagement: true,
    overbookingPrevention: true,
    waitlistManagement: false
  });

  // Advanced UI state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCompactView, setIsCompactView] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedSlot, setDraggedSlot] = useState<EnhancedTimeSlot | null>(null);
  
  // Missing state variables
  const [showAppointmentDetailModal, setShowAppointmentDetailModal] = useState(false);
  const [selectedAppointmentBlock, setSelectedAppointmentBlock] = useState<AppointmentBlock | null>(null);
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'hours' | 'extension' | 'calendar'>('hours');
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
  const SLOT_HEIGHT = 72; // Increased for better spacing
  const TIME_PRECISION = 30; // 30-minute slots
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

  const [monthlySchedule, setMonthlySchedule] = useState<MonthlySchedule>({});

  const [extensionSettings, setExtensionSettings] = useState<ExtensionSettings>({
    allowExtension: false,
    maxExtensionMinutes: 60,
    showExtensionWarning: true
  });

  // Enhanced calendar settings with modern features
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>({
    workLabel: '営業',
    offLabel: '休業',
    shortLabel: '短縮',
    showTimes: true,
    backgroundColor: '#ffffff',
    textColor: '#1a202c',
    headerColor: '#4f46e5',
    theme: 'auto',
    animations: true,
    gridSize: 'normal',
    showStatistics: true,
    smartSuggestions: true
  });

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
          gridPosition: { row: index, column: dayOfWeek },
          conflictLevel: 'none',
          efficiency: 100,
          isHighlight: false,
          animation: animationsEnabled ? 'fadeIn' : 'none'
        });
      }
    });

    return applyAdvancedSchedulingLogic(slots, dateStr);
  }, [workingHours, timeGrid, animationsEnabled]);

  // Advanced scheduling logic with AI-like features
  const applyAdvancedSchedulingLogic = useCallback((slots: EnhancedTimeSlot[], dateStr: string): EnhancedTimeSlot[] => {
    // Sample enhanced appointments with realistic data
    const enhancedAppointments: AppointmentBlock[] = [
      {
        id: '1',
        customerName: '田中 花子',
        service: 'プレミアムカット＆カラー',
        startTime: '10:00',
        endTime: '12:00',
        duration: 120,
        price: 15000,
        phone: '090-1234-5678',
        email: 'tanaka@example.com',
        notes: 'VIPカスタマー - 特別対応',
        status: 'confirmed',
        priority: 'high',
        color: '#10b981',
        tags: ['VIP', 'カラー', 'カット'],
        customerRating: 5,
        preparation: 10,
        cleanup: 15
      },
      {
        id: '2',
        customerName: '佐藤 美咲',
        service: 'トリートメント＋ブロー',
        startTime: '14:00',
        endTime: '15:30',
        duration: 90,
        price: 8000,
        phone: '090-2345-6789',
        email: 'sato@example.com',
        notes: '髪質改善コース',
        status: 'confirmed',
        priority: 'normal',
        color: '#3b82f6',
        tags: ['トリートメント', 'リピーター'],
        customerRating: 4,
        preparation: 5,
        cleanup: 10
      },
      {
        id: '3',
        customerName: '山田 太郎',
        service: 'メンズカット',
        startTime: '16:00',
        endTime: '17:00',
        duration: 60,
        price: 4500,
        phone: '090-3456-7890',
        email: 'yamada@example.com',
        notes: 'ビジネスカット希望',
        status: 'pending',
        priority: 'normal',
        color: '#f59e0b',
        tags: ['メンズ', '新規'],
        customerRating: 0,
        preparation: 5,
        cleanup: 5
      }
    ];

    // Apply appointments to slots with perfect time alignment
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
    
    if (dateStr === today || dateStr === tomorrow) {
      enhancedAppointments.forEach(appointment => {
        const startSlotIndex = slots.findIndex(slot => slot.start_time === appointment.startTime);
        const endTime = appointment.endTime;
        
        if (startSlotIndex !== -1) {
          let currentIndex = startSlotIndex;
          let duration = 0;
          
          while (duration < appointment.duration && currentIndex < slots.length) {
            const slot = slots[currentIndex];
            slot.is_available = false;
            slot.appointmentBlock = appointment;
            slot.is_appointment_start = currentIndex === startSlotIndex;
            slot.is_appointment_continuation = currentIndex > startSlotIndex;
            slot.conflictLevel = appointment.priority === 'urgent' ? 'warning' : 'none';
            slot.efficiency = (appointment.customerRating || 0) * 20;
            
            duration += TIME_PRECISION;
            currentIndex++;
          }
        }
      });
    }

    return slots;
  }, []);

  // Advanced week generation with statistics
  const generateAdvancedWeeklySchedule = useCallback(() => {
    const startOfWeek = new Date(currentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekDays: ScheduleDay[] = [];
    let totalRevenue = 0;
    let totalBookings = 0;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const slots = generateEnhancedDaySlots(dateStr, date.getDay());
      
      // Calculate daily statistics
      const bookedSlots = slots.filter(slot => !slot.is_available);
      const dailyRevenue = bookedSlots.reduce((sum, slot) => 
        sum + (slot.appointmentBlock?.price || 0), 0);
      const utilization = slots.length > 0 ? (bookedSlots.length / slots.length) * 100 : 0;
      
      totalRevenue += dailyRevenue;
      totalBookings += bookedSlots.filter(slot => slot.is_appointment_start).length;
      
      weekDays.push({
        date: dateStr,
        dayOfWeek: ['日', '月', '火', '水', '木', '金', '土'][date.getDay()],
        slots,
        statistics: {
          totalBookings: bookedSlots.filter(slot => slot.is_appointment_start).length,
          totalRevenue: dailyRevenue,
          utilization,
          efficiency: bookedSlots.reduce((sum, slot) => sum + (slot.efficiency || 0), 0) / bookedSlots.length || 0,
          averageRating: bookedSlots.reduce((sum, slot) => 
            sum + (slot.appointmentBlock?.customerRating || 0), 0) / bookedSlots.length || 0
        },
        mood: utilization > 80 ? 'busy' : utilization > 60 ? 'productive' : 'relaxed'
      });
    }
    
    // Update metrics
    setScheduleMetrics(prev => ({
      ...prev,
      weeklyRevenue: totalRevenue,
      weeklyBookings: totalBookings,
      averageUtilization: weekDays.reduce((sum, day) => 
        sum + (day.statistics?.utilization || 0), 0) / weekDays.length,
      peakHours: calculatePeakHours(weekDays),
      suggestions: generateSmartSuggestions(weekDays)
    }));
    
    setSchedule(weekDays);
  }, [currentWeek, generateEnhancedDaySlots]);

  // Smart analytics functions
  const calculatePeakHours = useCallback((weekDays: ScheduleDay[]): string[] => {
    const hourStats: { [hour: string]: number } = {};
    
    weekDays.forEach(day => {
      day.slots.forEach(slot => {
        if (!slot.is_available) {
          const hour = slot.start_time.split(':')[0];
          hourStats[hour] = (hourStats[hour] || 0) + 1;
        }
      });
    });
    
    return Object.entries(hourStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
  }, []);

  const generateSmartSuggestions = useCallback((weekDays: ScheduleDay[]): string[] => {
    const suggestions = [];
    const avgUtilization = weekDays.reduce((sum, day) => 
      sum + (day.statistics?.utilization || 0), 0) / weekDays.length;
    
    if (avgUtilization < 60) {
      suggestions.push('📈 プロモーション実施で予約率向上を検討');
    }
    if (avgUtilization > 90) {
      suggestions.push('⚡ 営業時間延長で収益機会拡大');
    }
    
    return suggestions;
  }, []);

  // QRコード・ブッキングリンク機能
  const [showQRModal, setShowQRModal] = useState(false);
  const [bookingUrl, setBookingUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // 設定モーダルとその他のUI状態は上部で定義済み

  // 予約枠ハイライト用の状態
  const [hoveredAppointmentId, setHoveredAppointmentId] = useState<string | null>(null);

  // 必要な関数群
  const generateWeeklySchedule = useCallback(() => {
    // スケジュール生成ロジック
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
  }, [currentWeek]);

  const createManualBooking = () => {
    // 実装予定: 手動予約の作成
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
  };

  const handleDeleteAppointment = () => {
    // 実装予定: 予約の削除
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

  // 重複した関数定義は削除済み

  // 時間スロットを生成する関数
  const generateTimeSlots = () => {
    const timeRange = getTimeRange();
    const times = [];
    
    let currentHour = timeRange.startHour;
    let currentMinute = timeRange.startMinute;
    
    while (currentHour < timeRange.endHour || (currentHour === timeRange.endHour && currentMinute < timeRange.endMinute)) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      times.push(timeStr);
      
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentHour++;
        currentMinute = 0;
      }
    }
    
    return times;
  };

  const generateDaySlots = (dateStr: string, dayOfWeek: number): EnhancedTimeSlot[] => {
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

    // generateTimeSlotsと同じ時間軸を使用
    const timeSlots = generateTimeSlots();
    const slots: EnhancedTimeSlot[] = [];
    
    // 営業時間の範囲を取得
    const startHour = parseInt(workingDay.start.split(':')[0]);
    const startMinute = parseInt(workingDay.start.split(':')[1]);
    const endHour = parseInt(workingDay.end.split(':')[0]);
    const endMinute = parseInt(workingDay.end.split(':')[1]);

    // 全時間軸から営業時間内のもののみを抽出
    timeSlots.forEach((timeStr, index) => {
      const [hour, minute] = timeStr.split(':').map(Number);
      const timeMinutes = hour * 60 + minute;
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      // 営業時間内かチェック
      if (timeMinutes >= startMinutes && timeMinutes < endMinutes) {
        let nextMinute = minute + 30;
        let nextHour = hour;
        if (nextMinute >= 60) {
          nextHour++;
          nextMinute = 0;
        }
        
        const endTimeStr = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;

        // 予約枠のtop位置を時間軸インデックスに基づいて計算
        slots.push({
          id: `${dateStr}-${timeStr}`,
          date: dateStr,
          start_time: timeStr,
          end_time: endTimeStr,
          is_available: true,
          duration_minutes: 30,
          is_extension_time: hour >= endHour || (hour === endHour && minute >= endMinute),
        });
      }
    });

    // サンプル予約データを適用
    const sampleAppointments = [
      { 
        id: '1',
        customerName: '田中花子', 
        serviceName: 'カット', 
        duration: 60, 
        price: 4000,
        phone: '090-1234-5678',
        email: 'tanaka@example.com',
        notes: '前髪短めでお願いします',
        status: 'confirmed' as const
      },
      { 
        id: '2',
        customerName: '佐藤美咲', 
        serviceName: 'カラー', 
        duration: 120, 
        price: 8000,
        phone: '090-2345-6789',
        email: 'sato@example.com',
        notes: 'アッシュブラウンでお願いします',
        status: 'confirmed' as const
      },
      { 
        id: '3',
        customerName: '山田太郎', 
        serviceName: 'パーマ', 
        duration: 180, 
        price: 12000,
        phone: '090-3456-7890',
        email: 'yamada@example.com',
        notes: '強めのパーマでお願いします',
        status: 'pending' as const
      }
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
        
        // 予約ブロックを作成
        const appointmentBlock: AppointmentBlock = {
          id: randomAppointment.id,
          customerName: randomAppointment.customerName,
          service: randomAppointment.serviceName,
          startTime: slots[startSlotIndex].start_time,
          endTime: slots[Math.min(startSlotIndex + slotsNeeded - 1, slots.length - 1)].end_time,
          duration: randomAppointment.duration,
          price: randomAppointment.price,
          phone: randomAppointment.phone,
          email: randomAppointment.email,
          notes: randomAppointment.notes,
          status: randomAppointment.status,
          priority: 'normal',
          color: '#3b82f6',
          tags: ['標準'],
          customerRating: 4
        };
        
        for (let i = 0; i < slotsNeeded && startSlotIndex + i < slots.length; i++) {
          const slot = slots[startSlotIndex + i];
          slot.is_available = false;
          slot.service_type = randomAppointment.serviceName;
          slot.price = randomAppointment.price;
          slot.appointmentBlock = appointmentBlock;
          slot.is_appointment_start = i === 0;
          slot.is_appointment_continuation = i > 0;
        }
      }
    }

    return slots;
  };

  const openAppointmentDetail = (appointmentBlock: AppointmentBlock) => {
    setSelectedAppointmentBlock(appointmentBlock);
    setShowAppointmentDetailModal(true);
  };

  const openManualBookingModal = (slot: EnhancedTimeSlot) => {
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

  // 重複した関数定義は削除済み（上部で定義済み）

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
      <div className="min-h-screen bg-gray-50 p-4 pb-20">
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
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
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
            
            {/* スケジュールグリッド */}
            <div className="flex relative">
              {/* 時間軸 */}
              <div className="w-20 pr-2 relative">
                <div className="h-20 mb-3"></div>
                <div className="relative" style={{ height: `${generateTimeSlots().length * 68}px` }}>
                  {generateTimeSlots().map((time, index) => (
                    <div key={time} className="absolute w-full flex items-center justify-end text-xs text-gray-600 border-r pr-2 bg-gray-50/30" style={{
                      top: `${index * 68}px`,
                      height: '68px'
                    }}>
                      {/* 水平ガイドライン */}
                      <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
                      {time}
                    </div>
                  ))}
                  {/* 最後の水平線 */}
                  <div className="absolute top-full left-0 right-0 h-px bg-gray-300"></div>
                </div>
              </div>
              
              {/* 曜日別スケジュール */}
              <div className="flex-1 grid grid-cols-7 gap-2 relative">
                {/* 水平ガイドラインオーバーレイ */}
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="h-20 mb-3"></div> {/* ヘッダー部分のスペース */}
                  <div className="relative">
                    {generateTimeSlots().map((time, index) => (
                      <div key={`guideline-${time}`} className="absolute w-full h-px bg-gray-300 opacity-30" style={{
                        top: `${index * 68}px`
                      }}></div>
                    ))}
                    <div className="absolute w-full h-px bg-gray-300 opacity-60" style={{
                      top: `${generateTimeSlots().length * 68}px`
                    }}></div>
                  </div>
                </div>
                
                {schedule.map((day) => {
                  const dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date(day.date).getDay()] as keyof WorkingHours;
                  const workingDay = workingHours[dayKey];
                  const daySchedule = monthlySchedule[day.date];
                  
                  return (
                    <div key={day.date} className="min-h-[500px]">
                      {/* 日付ヘッダー */}
                      <div className="h-20 text-center mb-3 p-3 rounded-lg border" style={{
                        backgroundColor: daySchedule?.color || (workingDay.isWorking ? '#f0f9ff' : '#f8f9fa'),
                        color: calendarSettings.textColor,
                        borderColor: workingDay.isWorking ? '#0ea5e9' : '#d1d5db'
                      }}>
                        <div className="font-semibold text-gray-800">{day.dayOfWeek}</div>
                        <div className="text-lg font-bold text-gray-900">{new Date(day.date).getDate()}日</div>
                        {workingDay.isWorking && (
                          <div className="text-xs mt-1 text-blue-700">
                            {workingDay.start} - {workingDay.end}
                          </div>
                        )}
                        {daySchedule && (
                          <div className="text-xs mt-1 font-medium text-purple-700">
                            {daySchedule.label}
                          </div>
                        )}
                      </div>
                      
                      {/* スケジュールスロット */}
                      <div className="relative" style={{ height: `${generateTimeSlots().length * 68}px` }}>
                        {generateTimeSlots().map((timeStr, timeIndex) => {
                          // 全時間軸から該当する時間のスロットを検索
                          const matchingSlot = day.slots.find(slot => slot.start_time === timeStr);
                          
                          if (!matchingSlot) {
                            return null; // その時間にスロットがない場合は何も表示しない
                          }
                          
                          // viewModeによるフィルタリング
                          if (viewMode === 'available' && !matchingSlot.is_available) return null;
                          if (viewMode === 'booked' && matchingSlot.is_available) return null;
                          
                          // 時間軸インデックスを直接使用して正確な位置を計算
                          const topPosition = timeIndex * 68;
                            
                            // 連続する予約枠の位置を判定（同じappointmentBlockのIDを持つスロット間）
                            const allTimeSlots = generateTimeSlots();
                            const prevTimeStr = timeIndex > 0 ? allTimeSlots[timeIndex - 1] : null;
                            const nextTimeStr = timeIndex < allTimeSlots.length - 1 ? allTimeSlots[timeIndex + 1] : null;
                            
                            const prevSlot = prevTimeStr ? day.slots.find(s => s.start_time === prevTimeStr && s.appointmentBlock?.id === matchingSlot.appointmentBlock?.id) : null;
                            const nextSlot = nextTimeStr ? day.slots.find(s => s.start_time === nextTimeStr && s.appointmentBlock?.id === matchingSlot.appointmentBlock?.id) : null;
                            
                            const isAppointmentGroup = matchingSlot.appointmentBlock;
                            const hasPrevConnection = prevSlot?.appointmentBlock?.id === matchingSlot.appointmentBlock?.id;
                            const hasNextConnection = nextSlot?.appointmentBlock?.id === matchingSlot.appointmentBlock?.id;
                            
                            // 角丸とボーダーの設定
                            let roundedClass = 'rounded';
                            let borderClass = 'border';
                            let connectionBarClass = '';
                            
                            if (isAppointmentGroup) {
                              if (matchingSlot.is_appointment_start && hasNextConnection) {
                                // 開始枠（継続あり）：上角丸のみ、下境界なし
                                roundedClass = 'rounded-t';
                                borderClass = 'border border-b-0';
                                connectionBarClass = 'border-l-4 border-l-blue-500';
                              } else if (matchingSlot.is_appointment_continuation) {
                                if (hasPrevConnection && hasNextConnection) {
                                  // 中間継続枠：角丸なし、上下境界なし
                                  roundedClass = '';
                                  borderClass = 'border-l border-r border-b-0';
                                  connectionBarClass = 'border-l-4 border-l-blue-400';
                                } else if (hasPrevConnection && !hasNextConnection) {
                                  // 最終継続枠：下角丸のみ、上境界なし
                                  roundedClass = 'rounded-b';
                                  borderClass = 'border border-t-0';
                                  connectionBarClass = 'border-l-4 border-l-blue-400';
                                } else {
                                  // 単独継続枠（通常はないが念のため）
                                  roundedClass = 'rounded';
                                  borderClass = 'border';
                                  connectionBarClass = 'border-l-4 border-l-blue-400';
                                }
                              } else if (matchingSlot.is_appointment_start && !hasNextConnection) {
                                // 単独開始枠（継続なし）：通常の角丸
                                roundedClass = 'rounded';
                                borderClass = 'border';
                                connectionBarClass = 'border-l-4 border-l-blue-500';
                              }
                            } else {
                              roundedClass = 'rounded';
                              borderClass = 'border';
                            }
                            
                            // ホバー時のハイライト判定
                            const isHighlighted = hoveredAppointmentId && matchingSlot.appointmentBlock?.id === hoveredAppointmentId;
                            
                            return (
                              <div
                                key={`${day.date}-${timeStr}`}
                                onClick={() => {
                                  if (matchingSlot.is_available) {
                                    openManualBookingModal(matchingSlot);
                                  } else if (matchingSlot.appointmentBlock) {
                                    openAppointmentDetail(matchingSlot.appointmentBlock);
                                  }
                                }}
                                onMouseEnter={() => {
                                  if (matchingSlot.appointmentBlock?.id) {
                                    setHoveredAppointmentId(matchingSlot.appointmentBlock.id);
                                  }
                                }}
                                onMouseLeave={() => {
                                  setHoveredAppointmentId(null);
                                }}
                                className={`absolute w-full text-xs ${roundedClass} ${borderClass} ${connectionBarClass} cursor-pointer transition-all duration-200 z-20 ${
                                  matchingSlot.is_available
                                    ? 'bg-green-50 border-green-300 hover:bg-green-100 hover:shadow-md'
                                    : isHighlighted
                                    ? matchingSlot.is_appointment_start
                                      ? 'bg-blue-200 border-blue-400 shadow-lg'
                                      : 'bg-blue-150 border-blue-350 shadow-lg'
                                    : matchingSlot.is_appointment_start
                                    ? 'bg-blue-100 border-blue-300 hover:bg-blue-150 hover:shadow-md'
                                    : matchingSlot.is_appointment_continuation
                                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                    : 'bg-orange-50 border-orange-300 hover:bg-orange-100 hover:shadow-md'
                                } ${matchingSlot.is_extension_time ? 'border-dashed opacity-80' : ''} group relative overflow-hidden`}
                                style={{
                                  top: `${topPosition}px`,
                                  height: '68px',
                                  boxShadow: isHighlighted 
                                    ? '0 4px 12px rgba(59, 130, 246, 0.3)' 
                                    : matchingSlot.is_appointment_start 
                                    ? '0 2px 4px rgba(0, 0, 0, 0.1)' 
                                    : undefined
                                }}
                              >
                                {matchingSlot.is_available ? (
                                  <div className="h-full flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="text-green-700 font-medium text-sm">空き</div>
                                      {matchingSlot.is_extension_time && (
                                        <div className="text-orange-600 text-xs mt-1 px-2 py-0.5 bg-orange-100 rounded">
                                          延長時間
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : matchingSlot.is_appointment_start && matchingSlot.appointmentBlock ? (
                                  <div className="h-full flex flex-col p-2 text-xs">
                                    {/* ステータスバッジ */}
                                    <div className="flex justify-between items-start mb-1">
                                      <div className={`text-xs px-2 py-0.5 rounded ${
                                        matchingSlot.appointmentBlock.status === 'confirmed' 
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {matchingSlot.appointmentBlock.status === 'confirmed' ? '確定' : '未確定'}
                                      </div>
                                    </div>
                                    
                                    {/* 顧客名 */}
                                    <div className="font-semibold text-gray-900 mb-1 truncate">
                                      {matchingSlot.appointmentBlock.customerName}
                                    </div>
                                    
                                    {/* サービス名 */}
                                    <div className="text-gray-700 mb-1 truncate">
                                      {matchingSlot.appointmentBlock.service}
                                    </div>
                                    
                                    {/* 時間と料金 */}
                                    <div className="flex justify-between items-center text-xs text-gray-600">
                                      <span>{matchingSlot.appointmentBlock.startTime}-{matchingSlot.appointmentBlock.endTime}</span>
                                      <span className="font-semibold">¥{matchingSlot.appointmentBlock.price.toLocaleString()}</span>
                                    </div>
                                  </div>
                                ) : matchingSlot.is_appointment_continuation && matchingSlot.appointmentBlock ? (
                                  <div className="h-full flex items-center justify-center">
                                    <div className="w-1 h-6 bg-blue-400 rounded-full opacity-60"></div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                      </div>
                      
                      <div className="mt-3 text-center">
                        <div className="text-sm text-gray-600">
                          {day.slots.filter(s => s.is_appointment_start).length}件の予約
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* 右側時間軸 */}
              <div className="w-20 pl-2 relative">
                <div className="h-20 mb-3"></div>
                <div className="relative" style={{ height: `${generateTimeSlots().length * 68}px` }}>
                  {generateTimeSlots().map((time, index) => (
                    <div key={`right-${time}`} className="absolute w-full flex items-center justify-start text-xs text-gray-600 border-l pl-2 bg-gray-50/30" style={{
                      top: `${index * 68}px`,
                      height: '68px'
                    }}>
                      {/* 水平ガイドライン */}
                      <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
                      {time}
                    </div>
                  ))}
                  {/* 最後の水平線 */}
                  <div className="absolute top-full left-0 right-0 h-px bg-gray-300"></div>
                </div>
              </div>
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

        {/* 予約詳細モーダル */}
        {showAppointmentDetailModal && selectedAppointmentBlock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">予約詳細</h3>
                <button
                  onClick={() => setShowAppointmentDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      顧客名
                    </label>
                    <div className="p-2 bg-gray-50 rounded-lg text-sm">
                      {selectedAppointmentBlock.customerName}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ステータス
                    </label>
                    <div className={`p-2 rounded-lg text-sm text-center font-medium ${
                      selectedAppointmentBlock.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedAppointmentBlock.status === 'confirmed' ? '予約確定' : '予約未確定'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      サービス
                    </label>
                    <div className="p-2 bg-gray-50 rounded-lg text-sm">
                      {selectedAppointmentBlock.service}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      料金
                    </label>
                    <div className="p-2 bg-gray-50 rounded-lg text-sm font-medium">
                      ¥{selectedAppointmentBlock.price.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      開始時間
                    </label>
                    <div className="p-2 bg-gray-50 rounded-lg text-sm">
                      {selectedAppointmentBlock.startTime}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      終了時間
                    </label>
                    <div className="p-2 bg-gray-50 rounded-lg text-sm">
                      {selectedAppointmentBlock.endTime}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    所要時間
                  </label>
                  <div className="p-2 bg-gray-50 rounded-lg text-sm">
                    {selectedAppointmentBlock.duration}分
                  </div>
                </div>

                {selectedAppointmentBlock.phone && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電話番号
                    </label>
                    <div className="p-2 bg-gray-50 rounded-lg text-sm">
                      <a href={`tel:${selectedAppointmentBlock.phone}`} className="text-blue-600 hover:text-blue-800">
                        {selectedAppointmentBlock.phone}
                      </a>
                    </div>
                  </div>
                )}

                {selectedAppointmentBlock.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス
                    </label>
                    <div className="p-2 bg-gray-50 rounded-lg text-sm">
                      <a href={`mailto:${selectedAppointmentBlock.email}`} className="text-blue-600 hover:text-blue-800">
                        {selectedAppointmentBlock.email}
                      </a>
                    </div>
                  </div>
                )}

                {selectedAppointmentBlock.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      備考・要望
                    </label>
                    <div className="p-2 bg-gray-50 rounded-lg text-sm">
                      {selectedAppointmentBlock.notes}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAppointmentDetailModal(false)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  閉じる
                </button>
                <button
                  onClick={() => {
                    // 予約の編集機能（今後実装）
                    alert('予約編集機能は今後実装予定です');
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  編集
                </button>
                <button
                  onClick={() => {
                    if (confirm('この予約をキャンセルしますか？')) {
                      setShowAppointmentDetailModal(false);
                      generateWeeklySchedule(); // スケジュールを再生成
                      alert('予約をキャンセルしました');
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  キャンセル
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
        {/* Ultra-Modern Header */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ✨ 次世代スケジュール
                </h1>
                <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-full">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">AI最適化アクティブ</span>
                </div>
              </div>
              
              {/* Advanced Control Panel */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1.5">
                  <button
                    onClick={() => setViewMode('both')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      viewMode === 'both' ? 'bg-white shadow-md text-indigo-600 transform scale-105' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    全体表示
                  </button>
                  <button
                    onClick={() => setViewMode('analytics')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      viewMode === 'analytics' ? 'bg-white shadow-md text-indigo-600 transform scale-105' : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    分析モード
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      showAnalytics ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-3 rounded-xl bg-white text-gray-600 hover:bg-gray-50 transition-all duration-300"
                  >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Enhanced Week Navigation with Analytics */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setCurrentWeek(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
                  className="p-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>
                
                <div className="text-xl font-bold text-gray-800">
                  {currentWeek.getFullYear()}年 {currentWeek.getMonth() + 1}月
                  <span className="text-base font-normal text-gray-600 ml-2">
                    Week {Math.ceil(currentWeek.getDate() / 7)}
                  </span>
                </div>
                
                <button
                  onClick={() => setCurrentWeek(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
                  className="p-3 rounded-xl bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              
              {/* Real-time Analytics Dashboard */}
              <div className="flex items-center gap-8 text-sm">
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-sm"></div>
                  <span className="font-medium text-gray-700">週売上</span>
                  <span className="font-bold text-green-600">¥{scheduleMetrics.weeklyRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm">
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full shadow-sm"></div>
                  <span className="font-medium text-gray-700">予約数</span>
                  <span className="font-bold text-blue-600">{scheduleMetrics.weeklyBookings}件</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm">
                  <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full shadow-sm"></div>
                  <span className="font-medium text-gray-700">稼働率</span>
                  <span className="font-bold text-purple-600">{scheduleMetrics.averageUtilization.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Perfect Schedule Grid Container */}
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/50">
            
            {/* Enhanced Day Headers */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
              <div className="flex">
                <div className="w-20 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-r border-gray-200">
                  <div className="text-sm font-semibold text-gray-700">時間</div>
                </div>
                
                {schedule.map((day, index) => (
                  <div key={day.date} className="flex-1 p-4 text-center border-r border-gray-200 last:border-r-0">
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-lg font-bold text-gray-800">
                        {day.dayOfWeek}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(day.date).getDate()}日
                      </div>
                      
                      {day.statistics && (
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full shadow-sm ${
                            day.mood === 'busy' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                            day.mood === 'productive' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                            'bg-gradient-to-r from-blue-400 to-blue-500'
                          }`}></div>
                          <span className="text-xs font-medium text-gray-600">
                            {day.statistics.utilization.toFixed(0)}%
                          </span>
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-gray-500">
                            {day.statistics.averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Revolutionary Schedule Grid with Perfect Alignment */}
            <div className="flex relative" style={{ height: `${timeGrid.length * SLOT_HEIGHT}px` }}>
              
              {/* Ultra-Modern Time Axis */}
              <div className="sticky left-0 bg-gradient-to-r from-white to-gray-50 border-r-2 border-indigo-200 z-30" 
                   style={{ width: '80px' }}>
                {timeGrid.map((timePoint, index) => (
                  <div
                    key={timePoint.time}
                    className={`
                      flex items-center justify-end pr-4 text-sm transition-all duration-300
                      ${timePoint.isHour ? 'font-bold text-indigo-700 bg-gradient-to-r from-indigo-50 to-blue-50' : 'text-gray-500 bg-white'}
                      border-b border-gray-100 hover:bg-indigo-50/50
                    `}
                    style={{ 
                      height: `${SLOT_HEIGHT}px`,
                      boxShadow: timePoint.isHour ? '0 2px 4px rgba(99, 102, 241, 0.1)' : 'none'
                    }}
                  >
                    <div className="flex flex-col items-end">
                      <span className={`${timePoint.isHour ? 'text-base' : 'text-xs'} transition-all duration-300`}>
                        {timePoint.time}
                      </span>
                      {timePoint.isHour && (
                        <div className="w-6 h-1 bg-gradient-to-r from-indigo-300 to-purple-300 rounded-full mt-1 shadow-sm"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Perfect Schedule Grid */}
              <div className="flex-1 grid grid-cols-7 relative bg-gradient-to-br from-gray-50/30 to-indigo-50/30">
                {schedule.map((day, dayIndex) => (
                  <div key={day.date} className="relative border-r border-gray-100/50 last:border-r-0">
                    {timeGrid.map((timePoint, timeIndex) => {
                      const slot = day.slots.find(s => s.start_time === timePoint.time);
                      return (
                        <div
                          key={`${day.date}-${timePoint.time}`}
                          className="absolute w-full border-b border-gray-50/50"
                          style={{
                            top: `${timeIndex * SLOT_HEIGHT}px`,
                            height: `${SLOT_HEIGHT}px`
                          }}
                        >
                          {slot?.is_available === false && slot.appointmentBlock && slot.is_appointment_start ? (
                            /* Ultra-Modern Appointment Block */
                            <div
                              className={`
                                h-full mx-2 my-1 rounded-2xl shadow-lg border-l-4 overflow-hidden
                                ${slot.appointmentBlock.priority === 'high' ? 'border-red-400 bg-gradient-to-br from-red-50 via-red-100 to-red-50' :
                                  slot.appointmentBlock.priority === 'urgent' ? 'border-orange-400 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50' :
                                  'border-blue-400 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50'}
                                hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1
                                transition-all duration-500 cursor-pointer group relative
                                backdrop-blur-sm
                              `}
                              style={{
                                height: `${(slot.appointmentBlock.duration / TIME_PRECISION) * SLOT_HEIGHT - 8}px`,
                                background: `linear-gradient(135deg, ${slot.appointmentBlock.color || '#3b82f6'}15, ${slot.appointmentBlock.color || '#3b82f6'}25)`
                              }}
                              onClick={() => {
                                setSelectedAppointmentBlock(slot.appointmentBlock!);
                                setShowAppointmentDetailModal(true);
                              }}
                            >
                              <div className="p-4 h-full flex flex-col justify-between relative">
                                {/* Appointment Content */}
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-gray-800 text-sm truncate">
                                      {slot.appointmentBlock.customerName}
                                    </h4>
                                    <div className="flex items-center gap-1">
                                      {slot.appointmentBlock.priority === 'high' && (
                                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                      )}
                                      {slot.appointmentBlock.customerRating && (
                                        <div className="flex items-center">
                                          {[...Array(Math.min(slot.appointmentBlock.customerRating, 5))].map((_, i) => (
                                            <Star key={i} className="w-2 h-2 text-yellow-400 fill-current" />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                                    {slot.appointmentBlock.service}
                                  </div>
                                  
                                  {/* Tags */}
                                  {slot.appointmentBlock.tags && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      {slot.appointmentBlock.tags.slice(0, 2).map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-white/60 text-gray-700 text-xs rounded-full font-medium">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Status and Price */}
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-green-600 text-sm">
                                    ¥{slot.appointmentBlock.price.toLocaleString()}
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                                    slot.appointmentBlock.status === 'confirmed' ? 'bg-green-200 text-green-800' :
                                    slot.appointmentBlock.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                                    'bg-gray-200 text-gray-800'
                                  }`}>
                                    {slot.appointmentBlock.status === 'confirmed' ? '確定' :
                                     slot.appointmentBlock.status === 'pending' ? '仮予約' : '完了'}
                                  </span>
                                </div>
                                
                                {/* Hover Actions */}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 rounded-2xl">
                                  <button className="p-2 bg-white/90 rounded-lg shadow-lg hover:bg-white transition-colors">
                                    <Edit className="w-4 h-4 text-gray-600" />
                                  </button>
                                  <button className="p-2 bg-white/90 rounded-lg shadow-lg hover:bg-white transition-colors">
                                    <Eye className="w-4 h-4 text-gray-600" />
                                  </button>
                                </div>
                                
                                {/* Gradient Border Effect */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              </div>
                            </div>
                          ) : slot?.is_available ? (
                            /* Available Slot */
                            <div
                              className="h-full mx-2 my-1 border-2 border-dashed border-green-300 rounded-lg 
                                         hover:border-green-400 hover:bg-green-50/50 transition-all duration-300 
                                         cursor-pointer group flex items-center justify-center
                                         hover:shadow-lg hover:scale-105"
                              onClick={() => openManualBookingModal(slot)}
                            >
                              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-green-500" />
                                <span className="text-xs font-medium text-green-600">予約追加</span>
                              </div>
                            </div>
                          ) : (
                            /* Empty/Non-working Slot */
                            <div className="h-full bg-gray-100/30 rounded-md mx-2 my-1"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* AI Suggestions Panel */}
        {scheduleMetrics.suggestions.length > 0 && (
          <div className="max-w-7xl mx-auto px-6 mb-6">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-30"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-white/20 rounded-full">
                    <Zap className="w-8 h-8 text-yellow-300" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">AI スマート提案</h3>
                    <p className="text-indigo-100">データ分析に基づく最適化提案</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scheduleMetrics.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                      <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0" />
                      <span className="text-sm font-medium">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}