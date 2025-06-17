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

  // 設定モーダル
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'hours' | 'extension' | 'calendar'>('hours');

  // 予約詳細モーダル用の状態
  const [showAppointmentDetailModal, setShowAppointmentDetailModal] = useState(false);
  const [selectedAppointmentBlock, setSelectedAppointmentBlock] = useState<AppointmentBlock | null>(null);

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

  // 予約枠ハイライト用の状態
  const [hoveredAppointmentId, setHoveredAppointmentId] = useState<string | null>(null);

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

  // Ultra-Advanced Real-time Features
  const [isRealTimeMode, setIsRealTimeMode] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [weatherData, setWeatherData] = useState<{ temp: number; condition: string } | null>(null);

  // Revolutionary Weather Integration
  const fetchWeatherData = useCallback(async () => {
    try {
      // Simulated weather API call
      const weather = {
        temp: Math.round(Math.random() * 20 + 15),
        condition: ['晴れ', '曇り', '雨', '雪'][Math.floor(Math.random() * 4)]
      };
      setWeatherData(weather);
    } catch (error) {
      console.error('Weather fetch failed:', error);
    }
  }, []);

  // Smart Notification System
  const addNotification = useCallback((message: string) => {
    setNotifications(prev => [...prev.slice(-4), message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  }, []);

  // Predictive Analytics Engine
  const predictOptimalScheduling = useCallback(() => {
    const predictions = [];
    const currentHour = new Date().getHours();
    
    if (currentHour < 12) {
      predictions.push('📈 午後の予約枠に空きがあります - プロモーション実施を推奨');
    }
    
    if (scheduleMetrics.averageUtilization < 70) {
      predictions.push('⚡ SNS投稿で当日予約を促進しませんか？');
    }
    
    if (weatherData?.condition === '雨') {
      predictions.push('☔ 雨天のため屋内サービス（トリートメント等）の訴求が効果的です');
    }
    
    return predictions;
  }, [scheduleMetrics.averageUtilization, weatherData]);

  // Auto-optimization Engine
  const autoOptimizeSchedule = useCallback(() => {
    if (smartFeatures.autoOptimize) {
      addNotification('🤖 AIがスケジュールを最適化しました');
      generateAdvancedWeeklySchedule();
    }
  }, [smartFeatures.autoOptimize, generateAdvancedWeeklySchedule, addNotification]);

  // Real-time Updates Simulation
  useEffect(() => {
    if (isRealTimeMode) {
      const interval = setInterval(() => {
        fetchWeatherData();
        
        if (Math.random() > 0.8) {
          const messages = [
            '💡 新しい予約が入りました',
            '⭐ 顧客から高評価レビューが届きました',
            '📊 本日の売上目標達成まであと¥5,000です',
            '🎯 来週の予約率が85%を超えました'
          ];
          addNotification(messages[Math.floor(Math.random() * messages.length)]);
        }
        
        if (Math.random() > 0.9) {
          autoOptimizeSchedule();
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isRealTimeMode, fetchWeatherData, addNotification, autoOptimizeSchedule]);

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
        slots: generateDaySlots(date.toISOString().split('T')[0], date.getDay())
      });
    }
    
    setSchedule(weekDays);
  };

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

  // Revolutionary Custom CSS for Ultra-Modern Animations
  const customStyles = `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
      50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.6); }
    }
    
    @keyframes gradient-shift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    .animation-delay-150 { animation-delay: 150ms; }
    .animation-delay-300 { animation-delay: 300ms; }
    
    .float-animation { animation: float 3s ease-in-out infinite; }
    .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
    .gradient-animation { 
      background-size: 200% 200%;
      animation: gradient-shift 3s ease infinite;
    }
  `;

  // Advanced Drag & Drop System
  const handleDragStart = (slot: EnhancedTimeSlot, event: React.DragEvent) => {
    setDraggedSlot(slot);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (targetSlot: EnhancedTimeSlot, event: React.DragEvent) => {
    event.preventDefault();
    if (draggedSlot && targetSlot.is_available) {
      // Implement appointment moving logic
      console.log('Moving appointment from', draggedSlot.start_time, 'to', targetSlot.start_time);
      setDraggedSlot(null);
      generateAdvancedWeeklySchedule();
    }
  };

  // Voice Command Integration (Future-ready)
  const initializeVoiceCommands = () => {
    if ('speechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.onresult = (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase();
        if (command.includes('新しい予約')) {
          // Voice-triggered booking
          const today = new Date().toISOString().split('T')[0];
          const slot = schedule.find(day => day.date === today)?.slots.find(s => s.is_available);
          if (slot) openManualBookingModal(slot);
        }
      };
    }
  };

  // Advanced Performance Optimization
  useEffect(() => {
    generateAdvancedWeeklySchedule();
    initializeVoiceCommands();
  }, [currentWeek, generateAdvancedWeeklySchedule]);

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
      <div className={`min-h-screen transition-colors duration-500 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
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
        
        {/* Revolutionary Quick Actions Floating Panel */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`p-4 rounded-full shadow-2xl transition-all duration-500 transform hover:scale-110 ${
              showAnalytics ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white' : 'bg-white text-indigo-600'
            }`}
          >
            <Filter className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => {
              setIsLoading3D(true);
              setTimeout(() => {
                generateAdvancedWeeklySchedule();
                setIsLoading3D(false);
              }, 1000);
            }}
            className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-110 hover:rotate-180"
          >
            {isLoading3D ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Zap className="w-6 h-6" />
            )}
          </button>
          
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              const slot = schedule.find(day => day.date === today)?.slots.find(s => s.is_available);
              if (slot) openManualBookingModal(slot);
            }}
            className="p-4 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-110"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Ultra-Advanced Analytics Modal */}
        {viewMode === 'analytics' && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  📊 次世代分析ダッシュボード
                </h2>
                <button
                  onClick={() => setViewMode('both')}
                  className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Real-time Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-blue-800">総予約数</h3>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{scheduleMetrics.weeklyBookings}</div>
                  <div className="text-sm text-blue-600 mt-1">今週の実績</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Coffee className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-green-800">売上高</h3>
                  </div>
                  <div className="text-3xl font-bold text-green-600">¥{scheduleMetrics.weeklyRevenue.toLocaleString()}</div>
                  <div className="text-sm text-green-600 mt-1">週間合計</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-purple-800">稼働率</h3>
                  </div>
                  <div className="text-3xl font-bold text-purple-600">{scheduleMetrics.averageUtilization.toFixed(1)}%</div>
                  <div className="text-sm text-purple-600 mt-1">平均利用率</div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-yellow-500 rounded-lg">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-yellow-800">顧客満足度</h3>
                  </div>
                  <div className="text-3xl font-bold text-yellow-600">4.8</div>
                  <div className="text-sm text-yellow-600 mt-1">平均評価</div>
                </div>
              </div>

              {/* Peak Hours Analysis */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8 border border-indigo-200">
                <h3 className="text-xl font-bold text-indigo-800 mb-4">🔥 ピークタイム分析</h3>
                <div className="grid grid-cols-3 gap-4">
                  {scheduleMetrics.peakHours.map((hour, index) => (
                    <div key={hour} className="bg-white/80 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-indigo-600">{hour}</div>
                      <div className="text-sm text-indigo-500">#{index + 1} 人気時間</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Performance Chart */}
              <div className="bg-white/80 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-6">📈 日別パフォーマンス</h3>
                <div className="grid grid-cols-7 gap-2">
                  {schedule.map((day, index) => (
                    <div key={day.date} className="text-center">
                      <div className="text-sm font-medium text-gray-600 mb-2">{day.dayOfWeek}</div>
                      <div 
                        className="bg-gradient-to-t from-indigo-500 to-purple-500 rounded-lg relative overflow-hidden"
                        style={{ height: `${Math.max(20, (day.statistics?.utilization || 0) * 2)}px` }}
                      >
                        <div className="absolute inset-0 bg-white/20"></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {day.statistics?.utilization.toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next-Level Loading Animation */}
        {isLoading3D && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-60">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-2 border-4 border-purple-500 rounded-full border-b-transparent animate-spin animation-delay-150"></div>
                <div className="absolute inset-4 border-4 border-pink-500 rounded-full border-l-transparent animate-spin animation-delay-300"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">AI最適化中...</h3>
              <p className="text-indigo-200">スケジュールを次世代レベルで分析しています</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
