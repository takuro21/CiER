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
  startTime?: string;
  endTime?: string;
  color: string;
}

interface MonthlySchedule {
  [date: string]: DayStatus;
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

export default function StylistSchedulePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'booking' | 'calendar' | 'settings' | 'export'>('booking');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'both' | 'available' | 'booked'>('both');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 勤務時間設定
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: { start: '09:00', end: '18:00', isWorking: true },
    tuesday: { start: '09:00', end: '18:00', isWorking: true },
    wednesday: { start: '09:00', end: '18:00', isWorking: true },
    thursday: { start: '09:00', end: '18:00', isWorking: true },
    friday: { start: '09:00', end: '18:00', isWorking: true },
    saturday: { start: '09:00', end: '17:00', isWorking: true },
    sunday: { start: '10:00', end: '16:00', isWorking: false }
  });

  // 手動予約用の状態
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; startTime: string; endTime: string } | null>(null);
  const [manualBookingData, setManualBookingData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    service: '',
    notes: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    durationMinutes: 60
  });

  // 月間スケジュール
  const [monthlySchedule, setMonthlySchedule] = useState<MonthlySchedule>({});
  
  // 延長営業設定
  const [extensionSettings, setExtensionSettings] = useState<ExtensionSettings>({
    allowExtension: false,
    maxExtensionMinutes: 60,
    showExtensionWarning: true
  });
  
  // カレンダー設定
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>({
    workLabel: '出勤',
    offLabel: '休み',
    shortLabel: '時短',
  // 月間スケジュール: true,
  const [monthlySchedule, setMonthlySchedule] = useState<MonthlySchedule>({});
    textColor: '#212529',
  // 延長営業設定olor: '#007bff'
  const [extensionSettings, setExtensionSettings] = useState<ExtensionSettings>({
    allowExtension: false,
    maxExtensionMinutes: 60,
    showExtensionWarning: trueyStatus[] = [
  }); type: 'work', label: '出勤', color: '#28a745' },
    { type: 'off', label: '休み', color: '#dc3545' },
  // カレンダー設定'short', label: '時短', color: '#ffc107' }
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>({
    workLabel: '出勤',
    offLabel: '休み',{
    shortLabel: '時短',
    showTimes: true,
    backgroundColor: '#ffffff',
    textColor: '#212529',
    headerColor: '#007bff'
  });aturday: '土曜日',
    sunday: '日曜日'
  // 定義済みステータス
  const predefinedStatuses: DayStatus[] = [
    { type: 'work', label: '出勤', color: '#28a745' },', '土'];
    { type: 'off', label: '休み', color: '#dc3545' },
    { type: 'short', label: '時短', color: '#ffc107' }
  ];setMounted(true);
  }, []);
  const dayNames = {
    monday: '月曜日',{
    tuesday: '火曜日',!isLoading) {
    wednesday: '水曜日',
    thursday: '木曜日','/stylist/login');
    friday: '金曜日',
    saturday: '土曜日',
    sunday: '日曜日'er_type !== 'stylist') {
  };    router.push('/');
        return;
  const dayShortNames = ['日', '月', '火', '水', '木', '金', '土'];

  useEffect(() => {み込み
    setMounted(true);ingHours = localStorage.getItem(`workingHours_${user?.id}`);
  }, []);(savedWorkingHours) {
        setWorkingHours(JSON.parse(savedWorkingHours));
  useEffect(() => {
    if (mounted && !isLoading) {
      if (!user) {onthlySchedule = localStorage.getItem(`monthlySchedule_${user?.id}`);
        router.push('/stylist/login');
        return;hlySchedule(JSON.parse(savedMonthlySchedule));
      }
      if (user.user_type !== 'stylist') {
        router.push('/');Settings = localStorage.getItem(`calendarSettings_${user?.id}`);
        return;CalendarSettings) {
      } setCalendarSettings(JSON.parse(savedCalendarSettings));
      }
      // 保存されたデータを読み込み
      const savedWorkingHours = localStorage.getItem(`workingHours_${user?.id}`);er?.id}`);
      if (savedWorkingHours) {gs) {
        setWorkingHours(JSON.parse(savedWorkingHours));ettings));
      }

      const savedMonthlySchedule = localStorage.getItem(`monthlySchedule_${user?.id}`);
      if (savedMonthlySchedule) {
        setMonthlySchedule(JSON.parse(savedMonthlySchedule));ours, extensionSettings]);
      }
  // 全体の勤務時間範囲を取得（延長営業を考慮）
      const savedCalendarSettings = localStorage.getItem(`calendarSettings_${user?.id}`);
      if (savedCalendarSettings) {/ 24:00を分で表現
        setCalendarSettings(JSON.parse(savedCalendarSettings));
      }
    Object.values(workingHours).forEach(day => {
      const savedExtensionSettings = localStorage.getItem(`extensionSettings_${user?.id}`);
      if (savedExtensionSettings) {nt(day.start.split(':')[0]) * 60 + parseInt(day.start.split(':')[1]);
        setExtensionSettings(JSON.parse(savedExtensionSettings));arseInt(day.end.split(':')[1]);
      } 
        // 延長営業が許可されている場合は延長時間を追加
      generateWeeklySchedule();llowExtension) {
    }     endMinutes += extensionSettings.maxExtensionMinutes;
  }, [mounted, isLoading, user, router, currentWeek, workingHours, extensionSettings]);
        
  // 全体の勤務時間範囲を取得（延長営業を考慮） earliestStart) {
  const getWorkingTimeRange = () => {s;
    let earliestStart = 24 * 60; // 24:00を分で表現
    let latestEnd = 0; > latestEnd) {
          latestEnd = endMinutes;
    Object.values(workingHours).forEach(day => {
      if (day.isWorking) {
        const startMinutes = parseInt(day.start.split(':')[0]) * 60 + parseInt(day.start.split(':')[1]);
        let endMinutes = parseInt(day.end.split(':')[0]) * 60 + parseInt(day.end.split(':')[1]);
        rn {
        // 延長営業が許可されている場合は延長時間を追加estStart / 60),
        if (extensionSettings.allowExtension) {
          endMinutes += extensionSettings.maxExtensionMinutes;
        }Minute: latestEnd % 60
        
        if (startMinutes < earliestStart) {
          earliestStart = startMinutes;
        }ジュール生成（ダミーデータ）
        if (endMinutes > latestEnd) {> {
          latestEnd = endMinutes;currentWeek);
        }OfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      }
    });st weekDays: ScheduleDay[] = [];
    for (let i = 0; i < 7; i++) {
    return {date = new Date(startOfWeek);
      startHour: Math.floor(earliestStart / 60),
      startMinute: earliestStart % 60,().split('T')[0];
      endHour: Math.floor(latestEnd / 60),
      endMinute: latestEnd % 60', '火', '水', '木', '金', '土'];
    };const dayOfWeek = dayNames[date.getDay()];
  };
      // 曜日に対応する勤務時間を取得
  // 週間スケジュール生成（ダミーデータ） ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()] as keyof WorkingHours;
  const generateWeeklySchedule = () => {yNameEn];
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      
    const weekDays: ScheduleDay[] = [];
    for (let i = 0; i < 7; i++) {gTimeRange();
      const date = new Date(startOfWeek);ur;
      date.setDate(date.getDate() + i);rtMinute;
      const dateStr = date.toISOString().split('T')[0];
      const endMinute = timeRange.endMinute;
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      const dayOfWeek = dayNames[date.getDay()];
      if (!workingDay.isWorking) {
      // 曜日に対応する勤務時間を取得 = startHour;
      const dayNameEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()] as keyof WorkingHours;
      const workingDay = workingHours[dayNameEn];
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const slots: TimeSlot[] = [];tHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          const nextM = currentMinute + 30;
      // 勤務時間に基づいて時間枠を作成（共通の時間範囲を使用）? currentHour + 1 : currentHour;
      const timeRange = getWorkingTimeRange(); nextM;
      const startHour = timeRange.startHour;).padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
      const startMinute = timeRange.startMinute;
      const endHour = timeRange.endHour;
      const endMinute = timeRange.endMinute;rrentHour}_${currentMinute}`,
            date: dateStr,
      // 勤務日でない場合でも時間軸と合わせるため、空のスロットを作成
      if (!workingDay.isWorking) {
        let currentHour = startHour;非勤務日は利用不可
        let currentMinute = startMinute;
            is_extension_time: false
        while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
          const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
          const nextM = currentMinute + 30;
          const nextH = nextM >= 60 ? currentHour + 1 : currentHour;
          const nextMinute = nextM >= 60 ? 0 : nextM;
          const endTime = `${nextH.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
          if (currentMinute >= 60) {
          const slot: TimeSlot = {
            id: `slot_${date.getTime()}_${currentHour}_${currentMinute}`,
            date: dateStr,
            start_time: timeStr,
            end_time: endTime,
            is_available: false, // 非勤務日は利用不可
            duration_minutes: 30,
            is_extension_time: false
          };ots
          ;
          slots.push(slot);
          
          // 次の30分スロットに進む
          currentMinute += 30;
          if (currentMinute >= 60) {
            currentHour++;ation: 60, price: 4000 },
            currentMinute = 0;ation: 120, price: 8000 },
          }ame: 'パーマ', duration: 180, price: 12000 },
        } name: 'トリートメント', duration: 90, price: 6000 }
        
        weekDays.push({
          date: dateStr,[];
          dayOfWeek,r = startHour;
          slotsntMinute = startMinute;
        });
        continue;時間枠を作成
      }hile (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      // サービス別の時間設定
      const services = [判定（このスタイリストの勤務時間に基づく）
        { name: 'カット', duration: 60, price: 4000 },end.split(':')[0]);
        { name: 'カット+カラー', duration: 120, price: 8000 },.split(':')[1]);
        { name: 'パーマ', duration: 180, price: 12000 },+ currentMinute;
        { name: 'トリートメント', duration: 90, price: 6000 }* 60 + workingEndMinute;
      ];const isExtensionTime = currentTotalMinutes >= workingEndTotalMinutes;
        
      const timeSlots = [];
      let currentHour = startHour;
      let currentMinute = startMinute;
          minute: currentMinute,
      // 全体の時間範囲で時間枠を作成alse,
      while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
        const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        
        // 通常勤務時間か延長時間かを判定（このスタイリストの勤務時間に基づく）
        const workingEndHour = parseInt(workingDay.end.split(':')[0]);
        const workingEndMinute = parseInt(workingDay.end.split(':')[1]);
        const currentTotalMinutes = currentHour * 60 + currentMinute;
        const workingEndTotalMinutes = workingEndHour * 60 + workingEndMinute;
        const isExtensionTime = currentTotalMinutes >= workingEndTotalMinutes;
        
        timeSlots.push({
          time: timeStr,うに）
          hour: currentHour,y[] = [];
          minute: currentMinute,
          isOccupied: false,
          isExtensionTime: isExtensionTimeth) {
        });ランダムに予約を配置するかどうか決める（確率30%で予約）
        const hasAppointment = Math.random() > 0.7;
        // 次の30分スロットに進む
        currentMinute += 30;{
        if (currentMinute >= 60) {services[Math.floor(Math.random() * services.length)];
          currentHour++;Slots = Math.ceil(selectedService.duration / 30); // 30分刻みでのスロット数
          currentMinute = 0;
        } // 勤務終了時間をチェック（このスタイリストの勤務時間）
      }   const workingEndHour = parseInt(workingDay.end.split(':')[0]);
          const workingEndMinute = parseInt(workingDay.end.split(':')[1]);
      // 予約を配置（時間がかぶらないように）inutes = workingEndHour * 60 + workingEndMinute;
      const appointments: any[] = [];rentIndex + durationSlots;
      let currentIndex = 0;
          // サービスが勤務時間内に収まるかチェック
      while (currentIndex < timeSlots.length) {
        // ランダムに予約を配置するかどうか決める（確率30%で予約）ts.length) {
        const hasAppointment = Math.random() > 0.7;in(serviceEndIndex - 1, timeSlots.length - 1)];
            const serviceEndMinutes = serviceEndTime.hour * 60 + serviceEndTime.minute + 30;
        if (hasAppointment) {
          const selectedService = services[Math.floor(Math.random() * services.length)];
          const durationSlots = Math.ceil(selectedService.duration / 30); // 30分刻みでのスロット数
              canBook = true;
          // 勤務終了時間をチェック（このスタイリストの勤務時間）s.allowExtension) {
          const workingEndHour = parseInt(workingDay.end.split(':')[0]);
          const workingEndMinute = parseInt(workingDay.end.split(':')[1]);maxExtensionMinutes;
          const workingEndMinutes = workingEndHour * 60 + workingEndMinute;
          const serviceEndIndex = currentIndex + durationSlots;
              }
          // サービスが勤務時間内に収まるかチェック
          let canBook = false;
          if (serviceEndIndex <= timeSlots.length) {
            const serviceEndTime = timeSlots[Math.min(serviceEndIndex - 1, timeSlots.length - 1)];
            const serviceEndMinutes = serviceEndTime.hour * 60 + serviceEndTime.minute + 30;
            continue;
            if (serviceEndMinutes <= workingEndMinutes) {
              // 通常の勤務時間内
              canBook = true;
            } else if (extensionSettings.allowExtension) {
              // 延長営業時間内かチェックSlots.length) {
              const maxEndMinutes = workingEndMinutes + extensionSettings.maxExtensionMinutes;
              if (serviceEndMinutes <= maxEndMinutes) {
                canBook = true;
              }時間の計算
            }st startTime = timeSlots[currentIndex].time;
          }onst endTimeIndex = Math.min(endIndex, timeSlots.length - 1);
          const endTimeSlot = timeSlots[endTimeIndex];
          if (!canBook) {ndHour = endTimeSlot.hour;
            currentIndex++;Minute = endTimeSlot.minute + 30;
            continue;tedEndMinute >= 60) {
          } calculatedEndHour += 1;
            calculatedEndMinute = 0;
          // 終了時間を計算
          let endIndex = currentIndex + durationSlots;g().padStart(2, '0')}:${calculatedEndMinute.toString().padStart(2, '0')}`;
          if (endIndex > timeSlots.length) {
            endIndex = timeSlots.length; '太郎', gender: '男性', age: 28 },
          } { lastName: '佐藤', firstName: '花子', gender: '女性', age: 32 },
            { lastName: '山田', firstName: '次郎', gender: '男性', age: 25 },
          // 予約時間の計算me: '鈴木', firstName: '美咲', gender: '女性', age: 29 },
          const startTime = timeSlots[currentIndex].time;性', age: 35 },
          const endTimeIndex = Math.min(endIndex, timeSlots.length - 1);
          const endTimeSlot = timeSlots[endTimeIndex]; '男性', age: 31 },
          let calculatedEndHour = endTimeSlot.hour;er: '女性', age: 26 }
          let calculatedEndMinute = endTimeSlot.minute + 30;
          if (calculatedEndMinute >= 60) {rs[Math.floor(Math.random() * customers.length)];
            calculatedEndHour += 1;
            calculatedEndMinute = 0;ment = {
          } id: Math.floor(Math.random() * 10000),
          const endTime = `${calculatedEndHour.toString().padStart(2, '0')}:${calculatedEndMinute.toString().padStart(2, '0')}`;
          const customers = [vice.name === 'カット' ? 1 : 
            { lastName: '田中', firstName: '太郎', gender: '男性', age: 28 },
            { lastName: '佐藤', firstName: '花子', gender: '女性', age: 32 },
            { lastName: '山田', firstName: '次郎', gender: '男性', age: 25 },
            { lastName: '鈴木', firstName: '美咲', gender: '女性', age: 29 },
            { lastName: '高橋', firstName: '健太', gender: '男性', age: 35 },
            { lastName: '渡辺', firstName: '由美', gender: '女性', age: 27 },
            { lastName: '伊藤', firstName: '雄介', gender: '男性', age: 31 },
            { lastName: '中村', firstName: '恵子', gender: '女性', age: 26 }
          ];stylist: {
          const selectedCustomer = customers[Math.floor(Math.random() * customers.length)];
              user: {
          const appointment: Appointment = {
            id: Math.floor(Math.random() * 10000),ト',
            service: { user?.email || 'stylist@example.com'
              id: selectedService.name === 'カット' ? 1 : 
                  selectedService.name === 'カット+カラー' ? 2 :
                  selectedService.name === 'パーマ' ? 3 : 4,
              name: selectedService.name,
              description: '',
              duration_minutes: selectedService.duration,
              price: selectedService.price.toString(),
              is_active: true,
            },tal_amount: selectedService.price.toString(),
            stylist: {RESERVED', 'PAID'][Math.floor(Math.random() * 2)] as 'RESERVED' | 'PAID',
              id: 1,_payment: false,
              user: {t: new Date().toISOString(),
                id: 1,ame: `${selectedCustomer.lastName} ${selectedCustomer.firstName}`,
                username: user?.username || 'スタイリスト',
                email: user?.email || 'stylist@example.com'
              },omer_age: selectedCustomer.age,
              experience_years: 5, 0.5 ? 'カラーは明るめで' : ''
              services: [],
              is_available: true
            },用したスロットをマーク
            appointment_date: dateStr, < endIndex && i < timeSlots.length; i++) {
            start_time: startTime,d = true;
            end_time: endTime,
            total_amount: selectedService.price.toString(),
            status: ['RESERVED', 'PAID'][Math.floor(Math.random() * 2)] as 'RESERVED' | 'PAID',
            requires_payment: false,
            created_at: new Date().toISOString(),
            customer_name: `${selectedCustomer.lastName} ${selectedCustomer.firstName}`,
            customer_phone: '090-1234-5678',
            customer_gender: selectedCustomer.gender,
            customer_age: selectedCustomer.age,
            notes: Math.random() > 0.5 ? 'カラーは明るめで' : ''
          };rrentIndex++;
        }
          // 使用したスロットをマーク
          for (let i = currentIndex; i < endIndex && i < timeSlots.length; i++) {
            timeSlots[i].isOccupied = true;
          }lots.forEach((timeSlot, index) => {
        const appointment = appointments.find(app => 
          appointments.push({Index // 開始スロットのみ
            appointment,
            startIndex: currentIndex,
            endIndex: endIndex.minute + 30;
          }); nextH = nextM >= 60 ? timeSlot.hour + 1 : timeSlot.hour;
        const nextMinute = nextM >= 60 ? 0 : nextM;
          currentIndex = endIndex;oString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
        } else {
          currentIndex++;部分）は作成しない
        }onst isContinuation = appointments.some(app => 
      }   index > app.startIndex && index < app.endIndex
        );
      // 最終的なスロット配列を作成（開始スロットのみ）
      timeSlots.forEach((timeSlot, index) => {
        const appointment = appointments.find(app => 
          index === app.startIndex // 開始スロットのみSlot.hour}_${timeSlot.minute}`,
        );  date: dateStr,
            start_time: timeSlot.time,
        const nextM = timeSlot.minute + 30;
        const nextH = nextM >= 60 ? timeSlot.hour + 1 : timeSlot.hour;
        const nextMinute = nextM >= 60 ? 0 : nextM;
        const endTime = `${nextH.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
            service_type: appointment?.appointment?.service.name,
        // 継続中のスロット（予約の中間部分）は作成しないeSlot.isExtensionTime
        const isContinuation = appointments.some(app => 
          index > app.startIndex && index < app.endIndex
        );slots.push(slot);
        }
        if (!isContinuation) {
          const slot: TimeSlot = {
            id: `slot_${date.getTime()}_${timeSlot.hour}_${timeSlot.minute}`,
            date: dateStr,
            start_time: timeSlot.time,
            end_time: endTime,
            is_available: !timeSlot.isOccupied,
            duration_minutes: 30,
            appointment: appointment?.appointment,
            service_type: appointment?.appointment?.service.name,
            is_extension_time: timeSlot.isExtensionTime
          };
  // 週移動
          slots.push(slot);ection: 'prev' | 'next') => {
        }rrentWeek(prev => {
      });st newWeek = new Date(prev);
      if (direction === 'prev') {
      weekDays.push({te(newWeek.getDate() - 7);
        date: dateStr,
        dayOfWeek,tDate(newWeek.getDate() + 7);
        slots
      });urn newWeek;
    });
  };
    setSchedule(weekDays);
  }; 空き時間枠の追加
  const addTimeSlot = () => {
  // 週移動t date = selectedDate;
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => {
      const newWeek = new Date(prev);してください (例: 14:00):');
      if (direction === 'prev') {入力してください (例: 15:00):');
        newWeek.setDate(newWeek.getDate() - 7);
      } else {ime && endTime) {
        newWeek.setDate(newWeek.getDate() + 7);
      } id: `slot_${Date.now()}`,
      return newWeek;
    }); start_time: startTime,
  };    end_time: endTime,
        is_available: true,
  // 空き時間枠の追加ion_minutes: 60
  const addTimeSlot = () => {
    const date = selectedDate;
    if (!date) return; => prev.map(day => 
        day.date === date 
    const startTime = prompt('開始時間を入力してください (例: 14:00):');(a, b) => a.start_time.localeCompare(b.start_time)) }
    const endTime = prompt('終了時間を入力してください (例: 15:00):');
      ));
    if (startTime && endTime) {
      const newSlot: TimeSlot = {
        id: `slot_${Date.now()}`,
        date,
        start_time: startTime,
        end_time: endTime,ails = (appointment: Appointment) => {
        is_available: true,appointment);
        duration_minutes: 60true);
      };

      setSchedule(prev => prev.map(day => 
        day.date === date => {
          ? { ...day, slots: [...day.slots, newSlot].sort((a, b) => a.start_time.localeCompare(b.start_time)) }
          : day.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      )); endOfWeek = new Date(startOfWeek);
    }ndOfWeek.setDate(startOfWeek.getDate() + 6);
    setShowAddSlotModal(false);
  };return `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()} - ${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()}`;
  };
  // 予約の詳細表示
  const showAppointmentDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment); WorkingHours, field: 'start' | 'end' | 'isWorking', value: string | boolean) => {
    setShowAppointmentModal(true);
  };  ...prev,
      [day]: {
  // 週の日付範囲を取得v[day],
  const getWeekRange = () => {
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
     勤務時間の保存
    return `${startOfWeek.getMonth() + 1}/${startOfWeek.getDate()} - ${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()}`;
  };localStorage.setItem(`workingHours_${user?.id}`, JSON.stringify(workingHours));
    localStorage.setItem(`extensionSettings_${user?.id}`, JSON.stringify(extensionSettings));
  // 勤務時間の更新務時間と延長設定を保存しました');
  const updateWorkingHours = (day: keyof WorkingHours, field: 'start' | 'end' | 'isWorking', value: string | boolean) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {teMonth = (direction: 'prev' | 'next') => {
        ...prev[day],rev => {
        [field]: value new Date(prev);
      }f (direction === 'prev') {
    }));newMonth.setMonth(newMonth.getMonth() - 1);
  };  } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
  // 勤務時間の保存
  const saveWorkingHours = () => {
    localStorage.setItem(`workingHours_${user?.id}`, JSON.stringify(workingHours));
    localStorage.setItem(`extensionSettings_${user?.id}`, JSON.stringify(extensionSettings));
    alert('勤務時間と延長設定を保存しました');
  }; カレンダーの日付取得
  const getCalendarDays = () => {
  // 月移動t year = currentMonth.getFullYear();
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {(year, month, 1);
      const newMonth = new Date(prev);th + 1, 0);
      if (direction === 'prev') {rstDay);
        newMonth.setMonth(newMonth.getMonth() - 1);y.getDay()); // 週の始まりを日曜日にする
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      } (let i = 0; i < 42; i++) { // 6週間分
      return newMonth; Date(startDate);
    });ate.setDate(startDate.getDate() + i);
  };  const dateStr = date.toISOString().split('T')[0];
      const isCurrentMonth = date.getMonth() === month;
  // カレンダーの日付取得tus = monthlySchedule[dateStr];
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // 週の始まりを日曜日にする
    }
    const days = [];
    for (let i = 0; i < 42; i++) { // 6週間分
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const isCurrentMonth = date.getMonth() === month;tus) => {
      const status = monthlySchedule[dateStr];
      ...prev,
      days.push({status
        date,
        dateStr,
        isCurrentMonth,
        status作成
      });reateCustomStatus = (): DayStatus | null => {
    }onst label = prompt('カスタムステータス名を入力してください:');
    if (!label) return null;
    return days;
  };const startTime = prompt('開始時間を入力してください (例: 10:00):');
    const endTime = prompt('終了時間を入力してください (例: 16:00):');
  // 日付のステータス設定 = prompt('色を入力してください (例: #ff0000):') || '#6c757d';
  const setDayStatus = (dateStr: string, status: DayStatus) => {
    setMonthlySchedule(prev => ({
      ...prev,ustom',
      [dateStr]: status
    }));artTime: startTime || undefined,
  };  endTime: endTime || undefined,
      color
  // カスタムステータス作成
  const createCustomStatus = (): DayStatus | null => {
    const label = prompt('カスタムステータス名を入力してください:');
    if (!label) return null;
  const saveMonthlySchedule = () => {
    const startTime = prompt('開始時間を入力してください (例: 10:00):');ON.stringify(monthlySchedule));
    const endTime = prompt('終了時間を入力してください (例: 16:00):');
    const color = prompt('色を入力してください (例: #ff0000):') || '#6c757d';

    return {生成
      type: 'custom',darImage = () => {
      label,nvas = canvasRef.current;
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      colortx = canvas.getContext('2d');
    }; (!ctx) return;
  };
    const width = 1200;
  // 月間スケジュール保存t = 800;
  const saveMonthlySchedule = () => {
    localStorage.setItem(`monthlySchedule_${user?.id}`, JSON.stringify(monthlySchedule));
    alert('月間スケジュールを保存しました');
  };// 背景
    ctx.fillStyle = calendarSettings.backgroundColor;
  // カレンダー画像生成ct(0, 0, width, height);
  const generateCalendarImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;ndarSettings.headerColor;
    ctx.fillRect(0, 0, width, 100);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    const width = 1200;px Arial';
    const height = 800;nter';
    canvas.width = width;currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月 勤務スケジュール`;
    canvas.height = height; width / 2, 60);

    // 背景ヘッダー
    ctx.fillStyle = calendarSettings.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    const cellWidth = width / 7;
    // ヘッダーeaderY = 140;
    ctx.fillStyle = calendarSettings.headerColor;
    ctx.fillRect(0, 0, width, 100);ex) => {
      ctx.fillText(day, (index + 0.5) * cellWidth, headerY);
    // タイトル
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';ays();
    const monthYear = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月 勤務スケジュール`;
    ctx.fillText(monthYear, width / 2, 60);
    days.forEach((day, index) => {
    // 曜日ヘッダーow = Math.floor(index / 7);
    ctx.fillStyle = calendarSettings.textColor;
    ctx.font = 'bold 24px Arial';
    const cellWidth = width / 7;Height;
    const headerY = 140;
      // セルの背景
    dayShortNames.forEach((day, index) => {
      ctx.fillText(day, (index + 0.5) * cellWidth, headerY);
    }); else {
        ctx.fillStyle = '#f8f9fa';
    // カレンダーグリッド
    const days = getCalendarDays(); cellHeight);
    const cellHeight = (height - 160) / 6;
      // 境界線
    days.forEach((day, index) => {
      const row = Math.floor(index / 7);
      const col = index % 7;ellWidth, cellHeight);
      const x = col * cellWidth;
      const y = 160 + row * cellHeight;
      ctx.fillStyle = day.isCurrentMonth ? calendarSettings.textColor : '#6c757d';
      // セルの背景 = 'bold 20px Arial';
      if (day.isCurrentMonth) {
        ctx.fillStyle = '#ffffff';e().toString(), x + 10, y + 35);
      } else {
        ctx.fillStyle = '#f8f9fa';
      }f (day.status && day.isCurrentMonth) {
      ctx.fillRect(x, y, cellWidth, cellHeight);
        ctx.fillStyle = day.status.color;
      // 境界線fillRect(x + 10, y + 45, cellWidth - 20, 40);
      ctx.strokeStyle = '#dee2e6';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, cellWidth, cellHeight);
        ctx.font = 'bold 18px Arial';
      // 日付.textAlign = 'center';
      ctx.fillStyle = day.isCurrentMonth ? calendarSettings.textColor : '#6c757d';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(day.date.getDate().toString(), x + 10, y + 35);day.status.endTime) {
          ctx.fillStyle = calendarSettings.textColor;
      // ステータスfont = '14px Arial';
      if (day.status && day.isCurrentMonth) {e}-${day.status.endTime}`, x + cellWidth / 2, y + cellHeight - 15);
        // ステータス背景
        ctx.fillStyle = day.status.color;
        ctx.fillRect(x + 10, y + 45, cellWidth - 20, 40);
        
        // ステータステキスト
        ctx.fillStyle = '#ffffff';ement('a');
        ctx.font = 'bold 18px Arial';ntMonth.getFullYear()}年${currentMonth.getMonth() + 1}月.png`;
        ctx.textAlign = 'center';);
        ctx.fillText(day.status.label, x + cellWidth / 2, y + 70);
  };
        // 時間表示
        if (calendarSettings.showTimes && day.status.startTime && day.status.endTime) {
          ctx.fillStyle = calendarSettings.textColor;
          ctx.font = '14px Arial';e.reduce((total, day) => 
          ctx.fillText(`${day.status.startTime}-${day.status.endTime}`, x + cellWidth / 2, y + cellHeight - 15);
        }
      }
    });st weekRange = getWeekRange();
    return `✨予約受付中✨\n${weekRange}の週に${availableSlots}枠の空きがあります！\n\n📞 ご予約はお気軽に\n💅 最新のスタイルでお待ちしています\n\n#美容室 #予約受付中 #ヘアサロン`;
    // 画像をダウンロード
    const link = document.createElement('a');
    link.download = `勤務スケジュール_${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月.png`;
    link.href = canvas.toDataURL(););
    link.click();
  };switch (platform) {
      case 'twitter':
  // SNS共有機能t twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  const generateShareText = () => {lank');
    const availableSlots = schedule.reduce((total, day) => 
      total + day.slots.filter(slot => slot.is_available).length, 0
    );  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
        window.open(lineUrl, '_blank');
    const weekRange = getWeekRange();
    return `✨予約受付中✨\n${weekRange}の週に${availableSlots}枠の空きがあります！\n\n📞 ご予約はお気軽に\n💅 最新のスタイルでお待ちしています\n\n#美容室 #予約受付中 #ヘアサロン`;
  };    // インスタグラムは直接投稿できないので、テキストをクリップボードにコピー
        navigator.clipboard.writeText(text).then(() => {
  const shareToSNS = (platform: 'twitter' | 'line' | 'instagram') => {
    const text = generateShareText();
        break;
    switch (platform) {
      case 'twitter':
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank');
        break;= window.location.href;
      case 'line':board.writeText(url).then(() => {
        const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`;
        window.open(lineUrl, '_blank');
        break;
      case 'instagram':
        // インスタグラムは直接投稿できないので、テキストをクリップボードにコピー
        navigator.clipboard.writeText(text).then(() => {
          alert('投稿文をクリップボードにコピーしました。Instagramアプリで投稿してください。');
        });v className="min-h-screen flex items-center justify-center">
        break; className="text-lg">読み込み中...</div>
    }   </div>
  };  </Layout>
    );
  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      alert('URLをクリップボードにコピーしました');
    });div className="min-h-screen bg-gray-50 p-4">
  };    <div className="max-w-6xl mx-auto">
          {/* ヘッダー */}
  if (!mounted || isLoading) {hite rounded-lg shadow-sm p-6 mb-6">
    return (<div className="flex items-center justify-between">
      <Layout><div className="flex items-center space-x-4">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">読み込み中...</div>
        </div>    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      </Layout> >
    );            <ArrowLeft size={20} />
  }             </Link>
                <div>
  return (        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
    <Layout>        <Calendar className="mr-2" />
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* ヘッダー */}lassName="text-gray-600">勤務時間設定・月間スケジュール・カレンダー出力</p>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/stylist/dashboard"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >assName="bg-white rounded-lg shadow-sm mb-6">
                  <ArrowLeft size={20} />er-gray-200">
                </Link>sName="-mb-px flex">
                <div>on
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Calendar className="mr-2" />2 font-medium text-sm ${
                    スケジュール管理b === 'booking'
                  </h1> 'border-blue-500 text-blue-600'
                  <p className="text-gray-600">勤務時間設定・月間スケジュール・カレンダー出力</p>700'
                </div>
              </div>
            </div><Users className="inline mr-2" size={16} />
          </div>  予約管理
                </button>
          {/* タブナビゲーション */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">t-medium text-sm ${
              <nav className="-mb-px flex">'
                <button 'border-blue-500 text-blue-600'
                  onClick={() => setActiveTab('booking')} hover:text-gray-700'
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'booking'
                      ? 'border-blue-500 text-blue-600'e={16} />
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}ton>
                >button
                  <Users className="inline mr-2" size={16} />
                  予約管理sName={`py-4 px-6 border-b-2 font-medium text-sm ${
                </button>eTab === 'settings'
                <button 'border-blue-500 text-blue-600'
                  onClick={() => setActiveTab('calendar')}hover:text-gray-700'
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'calendar'
                      ? 'border-blue-500 text-blue-600'e={16} />
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}ton>
                >button
                  <Calendar className="inline mr-2" size={16} />
                  月間カレンダーme={`py-4 px-6 border-b-2 font-medium text-sm ${
                </button>eTab === 'export'
                <button 'border-blue-500 text-blue-600'
                  onClick={() => setActiveTab('settings')}hover:text-gray-700'
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'settings'
                      ? 'border-blue-500 text-blue-600'e={16} />
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}ton>
                >av>
                  <Settings className="inline mr-2" size={16} />
                  勤務時間設定
                </button>
                <button}
                  onClick={() => setActiveTab('export')}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'export'
                      ? 'border-blue-500 text-blue-600'w-sm p-6">
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}v className="flex items-center space-x-4">
                >   <button
                  <Download className="inline mr-2" size={16} />
                  カレンダー出力ssName="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                </button>
              </nav>  <ChevronLeft size={20} />
            </div>  </button>
          </div>    <h2 className="text-xl font-semibold">
                      {getWeekRange()}
          {/* 予約管理タブ */}>
          {activeTab === 'booking' && (
            <div className="space-y-6">vigateWeek('next')}
              {/* 週表示ヘッダー */}me="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => navigateWeek('prev')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >select
                      <ChevronLeft size={20} />
                    </button>e={(e) => setViewMode(e.target.value as 'both' | 'available' | 'booked')}
                    <h2 className="text-xl font-semibold">ray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      {getWeekRange()}
                    </h2>tion value="both">すべて表示</option>
                    <buttonon value="available">空き時間のみ</option>
                      onClick={() => navigateWeek('next')}n>
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>sName="flex items-center space-x-2">
                  </div>utton
                        onClick={() => shareToSNS('twitter')}
                  <div className="flex items-center space-x-4">ounded-lg hover:bg-blue-500 transition-colors"
                    <selectle="Twitterで共有"
                      value={viewMode}
                      onChange={(e) => setViewMode(e.target.value as 'both' | 'available' | 'booked')}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    > <button
                      <option value="both">すべて表示</option>}
                      <option value="available">空き時間のみ</option>rounded-lg hover:bg-green-600 transition-colors"
                      <option value="booked">予約済みのみ</option>
                    </select>
                        <Share2 size={16} />
                    {/* SNS共有ボタン */}
                    <div className="flex items-center space-x-2">
                      <buttonck={() => shareToSNS('instagram')}
                        onClick={() => shareToSNS('twitter')} rounded-lg hover:bg-pink-600 transition-colors"
                        className="p-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
                        title="Twitterで共有"
                      > <Copy size={16} />
                        <Share2 size={16} />
                      </button>
                      <buttonck={copyShareLink}
                        onClick={() => shareToSNS('line')}ite rounded-lg hover:bg-gray-600 transition-colors"
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        title="LINEで共有"
                      > <Copy size={16} />
                        <Share2 size={16} />
                      </button>
                      <button
                        onClick={() => shareToSNS('instagram')}
                        className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                        title="Instagram用テキストをコピー"white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                      >
                        <Copy size={16} />2" size={16} />
                      </button>
                      <button
                        onClick={copyShareLink}
                        className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        title="URLをコピー"
                      >ケジュールテーブル - 9:00から26:00まで30分刻み */}
                        <Copy size={16} />-auto">
                      </button>ame="w-full border-collapse">
                    </div>>
                      <tr className="bg-gray-50">
                    <button className="p-3 text-left border border-gray-200 font-medium text-gray-700 w-20">時間</th>
                      onClick={() => setShowAddSlotModal(true)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                    >       <div>{day.dayOfWeek}</div>
                      <Plus className="mr-2" size={16} />gray-600 font-normal">
                      時間枠追加   {new Date(day.date).getDate()}
                    </button>/div>
                  </div>  </th>
                </div>  ))}
                      </tr>
                {/* 週間スケジュールテーブル - 9:00から26:00まで30分刻み */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>=> {
                      <tr className="bg-gray-50">ingTimeRange();
                        <th className="p-3 text-left border border-gray-200 font-medium text-gray-700 w-20">時間</th>
                        {schedule.map((day) => (
                          <th key={day.date} className="p-3 text-center border border-gray-200 font-medium text-gray-700">
                            <div>{day.dayOfWeek}</div>startMinute;
                            <div className="text-sm text-gray-600 font-normal">
                              {new Date(day.date).getDate()}
                            </div>rentHour < timeRange.endHour || (currentHour === timeRange.endHour && currentMinute < timeRange.endMinute)) {
                          </th> timeLabel = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
                        ))}imeSlots.push(timeLabel);
                      </tr>
                    </thead> 次の30分スロットに進む
                    <tbody>urrentMinute += 30;
                      {/* 時間軸の生成（勤務時間に基づく） */} 60) {
                      {(() => {rentHour++;
                        const timeRange = getWorkingTimeRange();
                        const timeSlots = [];
                        }
                        let currentHour = timeRange.startHour;
                        let currentMinute = timeRange.startMinute; (
                          <tr key={`time-${index}`}>
                        // 勤務開始時間から終了時間まで30分刻みで時間軸を生成 border-gray-200 bg-gray-50 text-sm font-medium text-center">
                        while (currentHour < timeRange.endHour || (currentHour === timeRange.endHour && currentMinute < timeRange.endMinute)) {
                          const timeLabel = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
                          timeSlots.push(timeLabel);ndex) => {
                              // 該当する時間帯のスロットを検索
                          // 次の30分スロットに進むlots = day.slots.filter(slot => {
                          currentMinute += 30; = slot.start_time;
                          if (currentMinute >= 60) {timeLabel;
                            currentHour++;
                            currentMinute = 0;
                          }   return (
                        }       <td key={`${day.date}-${index}`} className={`p-1 border border-gray-200 relative ${
                                  timeSlots.some(slot => slot.is_extension_time && extensionSettings.showExtensionWarning) 
                        return timeSlots.map((timeLabel, index) => (
                          <tr key={`time-${index}`}> '64px' }}>
                            <td className="p-2 border border-gray-200 bg-gray-50 text-sm font-medium text-center">
                              {timeLabel}Slots
                            </td>     .filter(slot => {
                            {schedule.map((day, dayIndex) => {lable') return slot.is_available;
                              // 該当する時間帯のスロットを検索Mode === 'booked') return !slot.is_available;
                              const timeSlots = day.slots.filter(slot => {
                                const slotTime = slot.start_time;
                                return slotTime === timeLabel;
                              });       // 予約がある場合、その予約が何行分続くかを計算
                                        let rowSpan = 1;
                              return (  let actualHeight = 56; // デフォルトの高さ
                                <td key={`${day.date}-${index}`} className={`p-1 border border-gray-200 relative ${
                                  timeSlots.some(slot => slot.is_extension_time && extensionSettings.showExtensionWarning) 
                                    ? 'bg-orange-50' : ''inutes = slot.appointment.service.duration_minutes;
                                }`} style={{ height: '64px' }}>urationMinutes / 30);
                                  <div className="space-y-1">パディング8px考慮）
                                    {timeSlotsalHeight = rowSpan * 64 - 8;
                                      .filter(slot => {
                                        if (viewMode === 'available') return slot.is_available;
                                        if (viewMode === 'booked') return !slot.is_available;
                                        return true;
                                      })    key={slot.id}
                                      .map((slot) => {{`p-2 rounded text-xs cursor-pointer transition-colors ${
                                        // 予約がある場合、その予約が何行分続くかを計算
                                        let rowSpan = 1;s_extension_time && extensionSettings.showExtensionWarning
                                        let actualHeight = 56; // デフォルトの高さange-800 hover:bg-orange-200 border-orange-300'
                                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                                        if (slot.appointment) {sion_time && extensionSettings.showExtensionWarning
                                          const durationMinutes = slot.appointment.service.duration_minutes;'
                                          rowSpan = Math.ceil(durationMinutes / 30);:bg-blue-200'
                                          // 実際の高さを計算（各行64px、パディング8px考慮）er-l-4 border-blue-400 shadow-sm' : ''} ${
                                          actualHeight = rowSpan * 64 - 8;tensionSettings.showExtensionWarning ? 'border border-dashed' : ''
                                        }   }`}
                                            style={{
                                        return (ight: `${actualHeight}px`,
                                          <divdisplay: 'flex',
                                            key={slot.id}on: 'column',
                                            className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                                              slot.is_availablepointment && rowSpan > 1 ? 'absolute' : 'static',
                                                ? slot.is_extension_time && extensionSettings.showExtensionWarning
                                                  ? 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300'
                                                  : 'bg-green-100 text-green-800 hover:bg-green-200',
                                                : slot.is_extension_time && extensionSettings.showExtensionWarning
                                                  ? 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300'
                                                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                            } ${slot.appointment ? 'border-l-4 border-blue-400 shadow-sm' : ''} ${
                                              slot.is_extension_time && extensionSettings.showExtensionWarning ? 'border border-dashed' : ''
                                            }`} else {
                                            style={{electedDate(day.date);
                                              height: `${actualHeight}px`,
                                              display: 'flex',
                                              flexDirection: 'column',
                                              justifyContent: 'center',
                                              position: slot.appointment && rowSpan > 1 ? 'absolute' : 'static',
                                              zIndex: slot.appointment ? 10 : 1,
                                              width: slot.appointment && rowSpan > 1 ? 'calc(100% - 16px)' : 'auto',ame}様</div>
                                              left: slot.appointment && rowSpan > 1 ? '8px' : 'auto',
                                              top: slot.appointment && rowSpan > 1 ? '8px' : 'auto'
                                            }}  </div>
                                            onClick={() => {me="text-xs opacity-60 mb-1">
                                              if (slot.appointment) {tart_time} - {slot.appointment.end_time}
                                                showAppointmentDetails(slot.appointment);
                                              } else {lassName="text-xs opacity-60 font-medium">
                                                setSelectedDate(day.date);e.duration_minutes}分
                                                setShowAddSlotModal(true);&& extensionSettings.showExtensionWarning && (
                                              }     <span className="ml-1 text-orange-600">⏰</span>
                                            }}    )}
                                          >     </div>
                                            {slot.appointment ? (
                                              <div className="text-center">
                                                <div className="font-bold text-sm mb-1">{slot.appointment.customer_name}様</div>
                                                <div className="text-xs opacity-75 mb-1">gs.showExtensionWarning 
                                                  {slot.appointment.service.name}en-600'
                                                </div>
                                                <div className="text-xs opacity-60 mb-1">time}</div>
                                                  {slot.appointment.start_time} - {slot.appointment.end_time}
                                                </div>t.is_extension_time && extensionSettings.showExtensionWarning ? '延長枠' : '空き'}
                                                <div className="text-xs opacity-60 font-medium">
                                                  {slot.appointment.service.duration_minutes}分
                                                  {slot.is_extension_time && extensionSettings.showExtensionWarning && (
                                                    <span className="ml-1 text-orange-600">⏰</span>
                                                  )}
                                                </div>
                                              </div>
                                            ) : (
                                              <div className={`text-xs text-center ${
                                                slot.is_extension_time && extensionSettings.showExtensionWarning 
                                                  ? 'text-orange-600' : 'text-green-600'
                                              }`}>
                                                <div className="font-medium">{slot.start_time}</div>
                                                <div>
                                                  {slot.is_extension_time && extensionSettings.showExtensionWarning ? '延長枠' : '空き'}
                                                </div>
                                              </div>
                                            )}
                                          </div>ols-1 md:grid-cols-5 gap-4">
                                        );50 p-4 rounded-lg">
                                      })}blue-600 text-sm font-medium">今週の予約数</div>
                                  </div>-2xl font-bold text-blue-900">
                                </td>e((total, day) => {
                              );されているスロットをカウント
                            })}ppointmentSlots = day.slots.filter(slot => slot.appointment);
                          </tr>total + appointmentSlots.length;
                        ));}
                      })()}
                    </tbody>
                  </table>ssName="bg-green-50 p-4 rounded-lg">
                </div>iv className="text-green-600 text-sm font-medium">空き時間</div>
                    <div className="text-2xl font-bold text-green-900">
                {/* 統計情報 */}ule.reduce((total, day) => 
                <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">length, 0
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-blue-600 text-sm font-medium">今週の予約数</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {schedule.reduce((total, day) => {ed-lg">
                        // 予約が設定されているスロットをカウントe-600 text-sm font-medium">延長営業予約</div>
                        const appointmentSlots = day.slots.filter(slot => slot.appointment);
                        return total + appointmentSlots.length;
                      }, 0)}t extensionSlots = day.slots.filter(slot => 
                    </div>slot.appointment && slot.is_extension_time
                  </div>);
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-green-600 text-sm font-medium">空き時間</div>
                    <div className="text-2xl font-bold text-green-900">
                      {schedule.reduce((total, day) => -600 mt-1">
                        total + day.slots.filter(slot => slot.is_available).length, 0
                      )}`最大${extensionSettings.maxExtensionMinutes}分` : 
                    </div>長営業なし'
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-orange-600 text-sm font-medium">延長営業予約</div>
                    <div className="text-2xl font-bold text-orange-900">
                      {schedule.reduce((total, day) => {-sm font-medium">今週の売上予定</div>
                        const extensionSlots = day.slots.filter(slot => 
                          slot.appointment && slot.is_extension_time
                        ); 予約が設定されているスロットの売上を計算
                        return total + extensionSlots.length;lter(slot => slot.appointment);
                      }, 0)}rn total + appointmentSlots.reduce((dayTotal, slot) => 
                    </div>dayTotal + parseInt(slot.appointment!.total_amount), 0
                    <div className="text-xs text-orange-600 mt-1">
                      {extensionSettings.allowExtension ? 
                        `最大${extensionSettings.maxExtensionMinutes}分` : 
                        '延長営業なし'
                      }className="bg-purple-50 p-4 rounded-lg">
                    </div>lassName="text-purple-600 text-sm font-medium">稼働率</div>
                  </div> className="text-2xl font-bold text-purple-900">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-yellow-600 text-sm font-medium">今週の売上予定</div>.slots.length, 0);
                    <div className="text-2xl font-bold text-yellow-900"> => 
                      ¥{schedule.reduce((total, day) => {> !slot.is_available).length, 0
                        // 予約が設定されているスロットの売上を計算
                        const appointmentSlots = day.slots.filter(slot => slot.appointment); : 0;
                        return total + appointmentSlots.reduce((dayTotal, slot) => 
                          dayTotal + parseInt(slot.appointment!.total_amount), 0
                        );
                      }, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-purple-600 text-sm font-medium">稼働率</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {(() => {dar' && (
                        const totalSlots = schedule.reduce((total, day) => total + day.slots.length, 0);
                        const bookedSlots = schedule.reduce((total, day) => 
                          total + day.slots.filter(slot => !slot.is_available).length, 0
                        );Name="flex items-center justify-between mb-6">
                        return totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;
                      })()}%
                    </div>ick={() => navigateMonth('prev')}
                  </div>assName="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                </div>
              </div>  <ChevronLeft size={20} />
            </div>  </button>
          )}        <h2 className="text-xl font-semibold">
                      {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          {/* 月間カレンダータブ */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">vigateMonth('next')}
              {/* カレンダーヘッダー */}="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >lassName="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                      <ChevronLeft size={20} />
                    </button>ssName="mr-2" size={16} />
                    <h2 className="text-xl font-semibold">
                      {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                    </h2>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >edefinedStatuses.map((status) => (
                      <ChevronRight size={20} />
                    </button>atus.type}
                  </div>assName="flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                  <buttonle={{ backgroundColor: status.color }}
                    onClick={saveMonthlySchedule}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                  > </div>
                    <Save className="mr-2" size={16} />
                    保存ton
                  </button>={() => {
                </div>const customStatus = createCustomStatus();
                      if (customStatus) {
                {/* ステータス選択 */}ステータスを一時的に利用可能にする機能は省略
                <div className="flex flex-wrap gap-2 mb-6">
                  {predefinedStatuses.map((status) => (
                    <divsName="px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50"
                      key={status.type}
                      className="flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: status.color }}
                    >>
                      {status.label}
                    </div>リッド */}
                  ))}className="grid grid-cols-7 gap-1">
                  <buttonッダー */}
                    onClick={() => {((day) => (
                      const customStatus = createCustomStatus();nt-medium text-gray-600 bg-gray-50">
                      if (customStatus) {
                        // カスタムステータスを一時的に利用可能にする機能は省略
                      }
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >getCalendarDays().map((day, index) => (
                    + カスタム
                  </button>index}
                </div>className={`min-h-[100px] p-2 border border-gray-200 ${
                        day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                {/* カレンダーグリッド */}
                <div className="grid grid-cols-7 gap-1">
                  {/* 曜日ヘッダー */}Name={`text-sm font-medium ${
                  {dayShortNames.map((day) => (ext-gray-900' : 'text-gray-400'
                    <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-50">
                      {day}y.date.getDate()}
                    </div>v>
                  ))} 
                      {day.isCurrentMonth && (
                  {/* 日付セル */}lassName="mt-1">
                  {getCalendarDays().map((day, index) => (
                    <div    <div
                      key={index}ssName="px-2 py-1 rounded text-xs text-white font-medium cursor-pointer"
                      className={`min-h-[100px] p-2 border border-gray-200 ${
                        day.isCurrentMonth ? 'bg-white' : 'bg-gray-50' day.status!)}
                      }`}   >
                    >         {day.status.label}
                      <div className={`text-sm font-medium ${
                        day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      }`}>  <div className="space-y-1">
                        {day.date.getDate()}tuses.map((status) => (
                      </div>    <button
                                  key={status.type}
                      {day.isCurrentMonth && (=> setDayStatus(day.dateStr, status)}
                        <div className="mt-1">-full px-2 py-1 text-xs rounded hover:opacity-80 transition-opacity text-white font-medium"
                          {day.status ? ({ backgroundColor: status.color }}
                            <div>
                              className="px-2 py-1 rounded text-xs text-white font-medium cursor-pointer"
                              style={{ backgroundColor: day.status.color }}
                              onClick={() => setDayStatus(day.dateStr, day.status!)}
                            >/div>
                              {day.status.label}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {predefinedStatuses.map((status) => (
                                <button
                                  key={status.type}
                                  onClick={() => setDayStatus(day.dateStr, status)}
                                  className="w-full px-2 py-1 text-xs rounded hover:opacity-80 transition-opacity text-white font-medium"
                                  style={{ backgroundColor: status.color }}
                                >
                                  {status.label}
                                </button>ded-lg shadow-sm p-6">
                              ))}-xl font-semibold mb-6">基本勤務時間設定</h2>
                            </div>
                          )}="space-y-4">
                        </div>s(workingHours).map(([day, hours]) => (
                      )}ey={day} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    </div>lassName="w-20 font-medium text-gray-700">
                  ))} {dayNames[day as keyof typeof dayNames]}
                </div>div>
              </div>
            </div>  <div className="flex items-center space-x-2">
          )}          <input
                        type="checkbox"
          {/* 勤務時間設定タブ */}ecked={hours.isWorking}
          {activeTab === 'settings' && ( updateWorkingHours(day as keyof WorkingHours, 'isWorking', e.target.checked)}
            <div className="bg-white rounded-lg shadow-sm p-6">-gray-300 rounded focus:ring-blue-500"
              <h2 className="text-xl font-semibold mb-6">基本勤務時間設定</h2>
                      <span className="text-sm text-gray-600">営業</span>
              <div className="space-y-4">
                {Object.entries(workingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-20 font-medium text-gray-700">
                      {dayNames[day as keyof typeof dayNames]}
                    </div>type="time"
                          value={hours.start}
                    <div className="flex items-center space-x-2"> as keyof WorkingHours, 'start', e.target.value)}
                      <inputassName="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        type="checkbox"
                        checked={hours.isWorking}y-500">〜</span>
                        onChange={(e) => updateWorkingHours(day as keyof WorkingHours, 'isWorking', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />  value={hours.end}
                      <span className="text-sm text-gray-600">営業</span>yof WorkingHours, 'end', e.target.value)}
                    </div>className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    {hours.isWorking && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="time" && (
                          value={hours.start}ray-400 text-sm">定休日</span>
                          onChange={(e) => updateWorkingHours(day as keyof WorkingHours, 'start', e.target.value)}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-gray-500">〜</span>
                        <input
                          type="time"-6 border-t border-gray-200">
                          value={hours.end}
                          onChange={(e) => updateWorkingHours(day as keyof WorkingHours, 'end', e.target.value)}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"ter justify-center"
                        />
                      </div>sName="mr-2" size={20} />
                    )}を保存
                    tton>
                    {!hours.isWorking && (
                      <span className="text-gray-400 text-sm">定休日</span>
                    )}設定 */}
                  </div>Name="mt-8 border-t pt-6">
                ))} className="text-lg font-semibold mb-4">延長営業設定</h3>
              </div>
                <div className="space-y-4">
              <div className="mt-6 pt-6 border-t border-gray-200">
                <buttonput
                  onClick={saveWorkingHours}
                  className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                >     checked={extensionSettings.allowExtension}
                  <Save className="mr-2" size={20} />ttings(prev => ({ ...prev, allowExtension: e.target.checked }))}
                  勤務時間を保存ssName="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                </button>
              </div><label htmlFor="allowExtension" className="text-sm font-medium text-gray-700">
                      延長営業を許可する
              {/* 延長営業設定 */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">延長営業設定</h3>
                  {extensionSettings.allowExtension && (
                <div className="space-y-4">ace-y-4">
                  <div className="flex items-center space-x-3">-3">
                    <inputabel className="text-sm text-gray-600 w-24">最大延長時間:</label>
                      type="checkbox"
                      id="allowExtension"nSettings.maxExtensionMinutes}
                      checked={extensionSettings.allowExtension}prev => ({ ...prev, maxExtensionMinutes: parseInt(e.target.value) }))}
                      onChange={(e) => setExtensionSettings(prev => ({ ...prev, allowExtension: e.target.checked }))}-transparent"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />    <option value={30}>30分</option>
                    <label htmlFor="allowExtension" className="text-sm font-medium text-gray-700">
                      延長営業を許可するon value={90}>90分</option>
                    </label>ption value={120}>120分</option>
                  </div></select>
                      </div>
                  {extensionSettings.allowExtension && (
                    <div className="ml-7 space-y-4">ter space-x-3">
                      <div className="flex items-center space-x-3">
                        <label className="text-sm text-gray-600 w-24">最大延長時間:</label>
                        <selecthowExtensionWarning"
                          value={extensionSettings.maxExtensionMinutes}ng}
                          onChange={(e) => setExtensionSettings(prev => ({ ...prev, maxExtensionMinutes: parseInt(e.target.value) }))}
                          className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >>
                          <option value={30}>30分</option>ing" className="text-sm text-gray-600">
                          <option value={60}>60分</option>
                          <option value={90}>90分</option>
                          <option value={120}>120分</option>
                        </select>
                      </div>lassName="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                        💡 延長営業時間帯の予約は通常の勤務時間を超えて表示されます。延長営業が無効の場合、勤務時間を超える長時間サービスの予約は制限されます。
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="showExtensionWarning"
                          checked={extensionSettings.showExtensionWarning}
                          onChange={(e) => setExtensionSettings(prev => ({ ...prev, showExtensionWarning: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="showExtensionWarning" className="text-sm text-gray-600">
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">カレンダー出力設定</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">出勤ラベル</label>
                      <input
                        type="text"
                        value={calendarSettings.workLabel}
                        onChange={(e) => setCalendarSettings(prev => ({ ...prev, workLabel: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="出勤"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">休みラベル</label>
                      <input
                        type="text"
                        value={calendarSettings.offLabel}
                        onChange={(e) => setCalendarSettings(prev => ({ ...prev, offLabel: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="休み"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">時短ラベル</label>
                      <input
                        type="text"
                        value={calendarSettings.shortLabel}
                        onChange={(e) => setCalendarSettings(prev => ({ ...prev, shortLabel: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="時短"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">背景色</label>
                      <input
                        type="color"
                        value={calendarSettings.backgroundColor}
                        onChange={(e) => setCalendarSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-full h-12 border border-gray-300 rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">文字色</label>
                      <input
                        type="color"
                        value={calendarSettings.textColor}
                        onChange={(e) => setCalendarSettings(prev => ({ ...prev, textColor: e.target.value }))}
                        className="w-full h-12 border border-gray-300 rounded-lg"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ヘッダー色</label>
                      <input
                        type="color"
                        value={calendarSettings.headerColor}
                        onChange={(e) => setCalendarSettings(prev => ({ ...prev, headerColor: e.target.value }))}
                        className="w-full h-12 border border-gray-300 rounded-lg"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showTimes"
                        checked={calendarSettings.showTimes}
                        onChange={(e) => setCalendarSettings(prev => ({ ...prev, showTimes: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showTimes" className="text-sm text-gray-700">
                        勤務時間を表示する
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={generateCalendarImage}
                    className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                  >
                    <Download className="mr-2" size={20} />
                    カレンダー画像をダウンロード
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 非表示のキャンバス */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* 時間枠追加モーダル */}
          {showAddSlotModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">時間枠を追加</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">日付</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddSlotModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={addTimeSlot}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    追加
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 予約詳細モーダル */}
          {showAppointmentModal && selectedAppointment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">予約詳細</h3>
                  <button
                    onClick={() => setShowAppointmentModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">お客様名</label>
                      <p className="text-gray-900">{selectedAppointment.customer_name}様</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">サービス</label>
                      <p className="text-gray-900">{selectedAppointment.service.name}</p>
                    </div>
                  </div>
                  
                  {/* 性別と年齢を追加 */}
                  {(selectedAppointment.customer_gender || selectedAppointment.customer_age) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAppointment.customer_gender && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">性別</label>
                          <p className="text-gray-900">{selectedAppointment.customer_gender}</p>
                        </div>
                      )}
                      {selectedAppointment.customer_age && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">年齢</label>
                          <p className="text-gray-900">{selectedAppointment.customer_age}歳</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">日時</label>
                      <p className="text-gray-900">
                        {selectedAppointment.appointment_date} {selectedAppointment.start_time}-{selectedAppointment.end_time}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">料金</label>
                      <p className="text-gray-900">¥{selectedAppointment.total_amount}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">電話番号</label>
                    <p className="text-gray-900">{selectedAppointment.customer_phone}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ステータス</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedAppointment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                      selectedAppointment.status === 'RESERVED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedAppointment.status === 'PAID' ? '支払済み' :
                       selectedAppointment.status === 'RESERVED' ? '予約済み' : 'キャンセル'}
                    </span>
                  </div>
                  
                  {selectedAppointment.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">備考</label>
                      <p className="text-gray-900">{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowAppointmentModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    閉じる
                  </button>
                  <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                    編集
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
