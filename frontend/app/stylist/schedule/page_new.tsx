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
  preparation?: number;
  cleanup?: number;
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
  efficiency?: number;
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedAppointmentBlock, setSelectedAppointmentBlock] = useState<AppointmentBlock | null>(null);
  const [showAppointmentDetailModal, setShowAppointmentDetailModal] = useState(false);

  // Time constants for perfect grid alignment
  const SLOT_HEIGHT = 72;
  const TIME_PRECISION = 30;
  const GRID_START_TIME = '06:00';
  const GRID_END_TIME = '22:00';

  // Working hours
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: { start: '09:00', end: '18:00', isWorking: true },
    tuesday: { start: '09:00', end: '18:00', isWorking: true },
    wednesday: { start: '09:00', end: '18:00', isWorking: true },
    thursday: { start: '09:00', end: '18:00', isWorking: true },
    friday: { start: '09:00', end: '18:00', isWorking: true },
    saturday: { start: '09:00', end: '17:00', isWorking: true },
    sunday: { start: '10:00', end: '16:00', isWorking: false }
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
      }
    ];

    // Apply appointments to slots with perfect time alignment
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0];
    
    if (dateStr === today || dateStr === tomorrow) {
      enhancedAppointments.forEach(appointment => {
        const startSlotIndex = slots.findIndex(slot => slot.start_time === appointment.startTime);
        
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
      suggestions: totalRevenue < 50000 ? ['📈 プロモーション実施で予約率向上を検討'] : ['⚡ 営業時間延長で収益機会拡大']
    }));
    
    setSchedule(weekDays);
  }, [currentWeek, generateEnhancedDaySlots]);

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
      
      generateAdvancedWeeklySchedule();
    }
  }, [mounted, isLoading, user, router, generateAdvancedWeeklySchedule]);

  if (!mounted || isLoading) {
    return <div>Loading...</div>;
  }

  // Revolutionary main return - Ultimate Schedule Management System
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

        {/* Appointment Detail Modal */}
        {showAppointmentDetailModal && selectedAppointmentBlock && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">予約詳細</h3>
                <button
                  onClick={() => setShowAppointmentDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      顧客名
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedAppointmentBlock.customerName}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ステータス
                    </label>
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                      selectedAppointmentBlock.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedAppointmentBlock.status === 'confirmed' ? '予約確定' : '予約未確定'}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    サービス
                  </label>
                  <div className="text-gray-900 font-medium">
                    {selectedAppointmentBlock.service}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      料金
                    </label>
                    <div className="text-xl font-bold text-green-600">
                      ¥{selectedAppointmentBlock.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      所要時間
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {selectedAppointmentBlock.duration}分
                    </div>
                  </div>
                </div>

                {selectedAppointmentBlock.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      備考・要望
                    </label>
                    <div className="text-gray-900">
                      {selectedAppointmentBlock.notes}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowAppointmentDetailModal(false)}
                  className="flex-1 px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  閉じる
                </button>
                <button
                  onClick={() => {
                    alert('予約編集機能は今後実装予定です');
                  }}
                  className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 flex items-center gap-2 transition-colors font-medium"
                >
                  <Edit className="w-4 h-4" />
                  編集
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
