'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/StylistLayout';
import { 
  User, Save, ArrowLeft, MessageSquare, Clock, Share2, ExternalLink, Copy, QrCode,
  Camera, Phone, Mail, MapPin, Instagram, Globe, Star, Award, Calendar,
  Scissors, Edit, Eye, EyeOff, Upload, Plus, X, Target
} from 'lucide-react';
import Link from 'next/link';

interface StylistProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  bio: string;
  specialties: string[];
  experience: number; // 経験年数
  certifications: string[];
  workingHours: {
    monday: { start: string; end: string; isWorking: boolean };
    tuesday: { start: string; end: string; isWorking: boolean };
    wednesday: { start: string; end: string; isWorking: boolean };
    thursday: { start: string; end: string; isWorking: boolean };
    friday: { start: string; end: string; isWorking: boolean };
    saturday: { start: string; end: string; isWorking: boolean };
    sunday: { start: string; end: string; isWorking: boolean };
  };
  profileImage: string;
  portfolioImages: string[];
  socialMedia: {
    instagram: string;
    website: string;
  };
  isPublic: boolean;
}

interface ShareSettings {
  shopName: string;
  contactInfo: string;
  services: string;
  todayPrefix: string;
  weekPrefix: string;
  hashtags: string;
  timeFormat: 'individual' | 'range';
  bookingUrl: string;
  showBookingUrl: boolean;
}

export default function StylistProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'schedule' | 'share' | 'goals'>('profile');
  
  // プロフィール情報
  const [profile, setProfile] = useState<StylistProfile>({
    id: user?.id?.toString() || '',
    firstName: '',
    lastName: '',
    displayName: '',
    email: user?.email || '',
    phone: '',
    bio: '',
    specialties: [],
    experience: 0,
    certifications: [],
    workingHours: {
      monday: { start: '09:00', end: '18:00', isWorking: true },
      tuesday: { start: '09:00', end: '18:00', isWorking: true },
      wednesday: { start: '09:00', end: '18:00', isWorking: true },
      thursday: { start: '09:00', end: '18:00', isWorking: true },
      friday: { start: '09:00', end: '18:00', isWorking: true },
      saturday: { start: '09:00', end: '17:00', isWorking: true },
      sunday: { start: '10:00', end: '16:00', isWorking: false }
    },
    profileImage: '',
    portfolioImages: [],
    socialMedia: {
      instagram: '',
      website: ''
    },
    isPublic: false
  });

  // 予約共有設定
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    shopName: '美容室',
    contactInfo: 'DM または お電話でお待ちしております',
    services: 'カット・カラー・パーマ・トリートメント',
    todayPrefix: '💫 本日の空き状況をお知らせ 💫',
    weekPrefix: '🗓️ 今週の空き状況 🗓️',
    hashtags: '#美容室 #予約受付中 #ヘアサロン',
    timeFormat: 'individual',
    bookingUrl: '',
    showBookingUrl: false
  });
  
  const [previewText, setPreviewText] = useState('');
  const [previewType, setPreviewType] = useState<'today' | 'week'>('today');
  const [urlValidation, setUrlValidation] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: true, message: '' });

  // 目標設定
  const [goals, setGoals] = useState({
    monthlyRevenue: 500000, // 月間売上目標
    monthlyAppointments: 80, // 月間予約件数目標
    averageRating: 4.5, // 平均評価目標
    repeatCustomerRate: 70, // リピート率目標
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear()
  });

  // 利用可能な専門分野
  const availableSpecialties = [
    'カット', 'カラー', 'パーマ', 'ストレート', 'トリートメント', 
    'ヘッドスパ', 'メンズカット', 'ブライダル', 'セット', 'エクステ'
  ];

  // 曜日の日本語名
  const dayNames = {
    monday: '月曜日',
    tuesday: '火曜日', 
    wednesday: '水曜日',
    thursday: '木曜日',
    friday: '金曜日',
    saturday: '土曜日',
    sunday: '日曜日'
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

      // プロフィール情報をローカルストレージから読み込み
      const savedProfile = localStorage.getItem(`profile_${user?.id}`);
      if (savedProfile) {
        setProfile(prev => ({ ...prev, ...JSON.parse(savedProfile) }));
      }
      
      // 予約共有設定をローカルストレージから読み込み
      const savedSettings = localStorage.getItem(`shareSettings_${user?.id}`);
      if (savedSettings) {
        setShareSettings(JSON.parse(savedSettings));
      }

      // 目標設定をローカルストレージから読み込み
      const savedGoals = localStorage.getItem(`goals_${user?.id}`);
      if (savedGoals) {
        setGoals(prev => ({ ...prev, ...JSON.parse(savedGoals) }));
      }
    }
  }, [mounted, isLoading, user, router]);

  // プロフィール保存
  const handleSaveProfile = () => {
    localStorage.setItem(`profile_${user?.id}`, JSON.stringify(profile));
    alert('プロフィールが保存されました');
  };

  // 予約共有設定保存
  const handleSaveShareSettings = () => {
    localStorage.setItem(`shareSettings_${user?.id}`, JSON.stringify(shareSettings));
    alert('共有設定が保存されました');
  };

  // 専門分野の追加/削除
  const toggleSpecialty = (specialty: string) => {
    setProfile(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  // 認定資格の追加
  const addCertification = () => {
    const cert = prompt('認定資格を入力してください：');
    if (cert && cert.trim()) {
      setProfile(prev => ({
        ...prev,
        certifications: [...prev.certifications, cert.trim()]
      }));
    }
  };

  // 認定資格の削除
  const removeCertification = (index: number) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  // 勤務時間の更新
  const updateWorkingHours = (day: keyof StylistProfile['workingHours'], field: 'start' | 'end' | 'isWorking', value: string | boolean) => {
    setProfile(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  };

  // URL検証
  const validateUrl = (url: string) => {
    if (!url) {
      setUrlValidation({ isValid: true, message: '' });
      return;
    }
    
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
        setUrlValidation({ isValid: true, message: '✓ 有効なURLです' });
      } else {
        setUrlValidation({ isValid: false, message: '✗ http:// または https:// で始まるURLを入力してください' });
      }
    } catch {
      setUrlValidation({ isValid: false, message: '✗ 有効なURL形式を入力してください (例: https://example.com)' });
    }
  };

  useEffect(() => {
    validateUrl(shareSettings.bookingUrl);
  }, [shareSettings.bookingUrl]);

  // プレビューテキスト生成
  const generatePreview = () => {
    const slots = [
      { time: '10:00', duration: 60 },
      { time: '14:30', duration: 90 },
      { time: '16:00', duration: 60 }
    ];

    let text = '';
    
    if (previewType === 'today') {
      text += shareSettings.todayPrefix + '\n\n';
      text += `【${shareSettings.shopName}】\n`;
      text += `${shareSettings.services}\n\n`;
      
      if (shareSettings.timeFormat === 'individual') {
        slots.forEach(slot => {
          text += `⏰ ${slot.time}～ (${slot.duration}分)\n`;
        });
      } else {
        text += `⏰ ${slots[0].time}～${slots[slots.length-1].time}\n`;
      }
      
      text += `\n${shareSettings.contactInfo}\n`;
      if (shareSettings.showBookingUrl && shareSettings.bookingUrl) {
        text += `📱 予約はこちら: ${shareSettings.bookingUrl}\n`;
      }
      text += `\n${shareSettings.hashtags}`;
    } else {
      text += shareSettings.weekPrefix + '\n\n';
      text += `【${shareSettings.shopName}】\n`;
      text += `${shareSettings.services}\n\n`;
      text += '📅 今週の空き状況\n';
      text += '月: ⭕️ 火: ⭕️ 水: ❌\n';
      text += '木: ⭕️ 金: ⭕️ 土: ⭕️\n';
      text += '日: 定休日\n\n';
      text += `${shareSettings.contactInfo}\n`;
      if (shareSettings.showBookingUrl && shareSettings.bookingUrl) {
        text += `📱 予約はこちら: ${shareSettings.bookingUrl}\n`;
      }
      text += `\n${shareSettings.hashtags}`;
    }
    
    setPreviewText(text);
  };

  useEffect(() => {
    generatePreview();
  }, [shareSettings, previewType]);

  // テキストコピー
  const copyToClipboard = () => {
    navigator.clipboard.writeText(previewText);
    alert('テキストをコピーしました');
  };

  if (!mounted || isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">読み込み中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/stylist/dashboard"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <User className="mr-2" />
                    プロフィール設定
                  </h1>
                  <p className="text-gray-600">基本情報・勤務時間・予約共有設定の管理</p>
                </div>
              </div>
            </div>
          </div>

          {/* タブナビゲーション */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <User className="inline mr-2" size={16} />
                  基本情報
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'schedule'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Calendar className="inline mr-2" size={16} />
                  勤務時間
                </button>
                <button
                  onClick={() => setActiveTab('share')}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'share'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Share2 className="inline mr-2" size={16} />
                  予約共有設定
                </button>
                <button
                  onClick={() => setActiveTab('goals')}
                  className={`py-4 px-6 border-b-2 font-medium text-sm ${
                    activeTab === 'goals'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Target className="inline mr-2" size={16} />
                  目標設定
                </button>
              </nav>
            </div>
          </div>

          {/* プロフィール基本情報タブ */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-6">基本情報</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 基本情報フォーム */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">姓</label>
                    <input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="山田"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">名</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="太郎"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">表示名</label>
                    <input
                      type="text"
                      value={profile.displayName}
                      onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="やまだたろう"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">電話番号</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="090-1234-5678"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">経験年数</label>
                    <input
                      type="number"
                      value={profile.experience}
                      onChange={(e) => setProfile(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5"
                      min="0"
                    />
                  </div>
                </div>

                {/* 詳細情報 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">自己紹介</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="お客様に向けた自己紹介文を入力してください..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                    <input
                      type="text"
                      value={profile.socialMedia.instagram}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        socialMedia: { ...prev.socialMedia, instagram: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="@username"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ウェブサイト</label>
                    <input
                      type="url"
                      value={profile.socialMedia.website}
                      onChange={(e) => setProfile(prev => ({
                        ...prev,
                        socialMedia: { ...prev.socialMedia, website: e.target.value }
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={profile.isPublic}
                      onChange={(e) => setProfile(prev => ({ ...prev, isPublic: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isPublic" className="text-sm text-gray-700">
                      プロフィールを公開する
                    </label>
                  </div>
                </div>
              </div>

              {/* 専門分野 */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">専門分野</label>
                <div className="flex flex-wrap gap-2">
                  {availableSpecialties.map(specialty => (
                    <button
                      key={specialty}
                      onClick={() => toggleSpecialty(specialty)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        profile.specialties.includes(specialty)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>

              {/* 認定資格 */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">認定資格</label>
                  <button
                    onClick={addCertification}
                    className="flex items-center px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Plus size={16} className="mr-1" />
                    追加
                  </button>
                </div>
                <div className="space-y-2">
                  {profile.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <span className="text-sm">{cert}</span>
                      <button
                        onClick={() => removeCertification(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {profile.certifications.length === 0 && (
                    <p className="text-gray-500 text-sm">認定資格が登録されていません</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveProfile}
                  className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  <Save className="mr-2" size={20} />
                  プロフィールを保存
                </button>
              </div>
            </div>
          )}

          {/* 勤務時間設定タブ */}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-6">勤務時間設定</h2>
              
              <div className="space-y-4">
                {Object.entries(profile.workingHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-20 font-medium text-gray-700">
                      {dayNames[day as keyof typeof dayNames]}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={hours.isWorking}
                        onChange={(e) => updateWorkingHours(day as keyof StylistProfile['workingHours'], 'isWorking', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">営業</span>
                    </div>
                    
                    {hours.isWorking && (
                      <>
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            value={hours.start}
                            onChange={(e) => updateWorkingHours(day as keyof StylistProfile['workingHours'], 'start', e.target.value)}
                            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="text-gray-500">〜</span>
                          <input
                            type="time"
                            value={hours.end}
                            onChange={(e) => updateWorkingHours(day as keyof StylistProfile['workingHours'], 'end', e.target.value)}
                            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </>
                    )}
                    
                    {!hours.isWorking && (
                      <span className="text-gray-400 text-sm">定休日</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveProfile}
                  className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  <Save className="mr-2" size={20} />
                  勤務時間を保存
                </button>
              </div>
            </div>
          )}

          {/* 予約共有設定タブ */}
          {activeTab === 'share' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">予約共有設定</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">店舗名</label>
                      <input
                        type="text"
                        value={shareSettings.shopName}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, shopName: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="美容室名"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">提供サービス</label>
                      <input
                        type="text"
                        value={shareSettings.services}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, services: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="カット・カラー・パーマ・トリートメント"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">連絡先情報</label>
                      <textarea
                        value={shareSettings.contactInfo}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, contactInfo: e.target.value }))}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="DM または お電話でお待ちしております"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ハッシュタグ</label>
                      <input
                        type="text"
                        value={shareSettings.hashtags}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, hashtags: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#美容室 #予約受付中 #ヘアサロン"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">本日の投稿プレフィックス</label>
                      <input
                        type="text"
                        value={shareSettings.todayPrefix}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, todayPrefix: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="💫 本日の空き状況をお知らせ 💫"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">今週の投稿プレフィックス</label>
                      <input
                        type="text"
                        value={shareSettings.weekPrefix}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, weekPrefix: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="🗓️ 今週の空き状況 🗓️"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">時間表示形式</label>
                      <select
                        value={shareSettings.timeFormat}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, timeFormat: e.target.value as 'individual' | 'range' }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="individual">個別時間表示</option>
                        <option value="range">時間範囲表示</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">予約URL</label>
                      <input
                        type="url"
                        value={shareSettings.bookingUrl}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, bookingUrl: e.target.value }))}
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          urlValidation.isValid ? 'border-gray-300' : 'border-red-300'
                        }`}
                        placeholder="https://example.com/booking"
                      />
                      {urlValidation.message && (
                        <p className={`text-sm mt-1 ${urlValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                          {urlValidation.message}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showBookingUrl"
                        checked={shareSettings.showBookingUrl}
                        onChange={(e) => setShareSettings(prev => ({ ...prev, showBookingUrl: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="showBookingUrl" className="text-sm text-gray-700">
                        予約URLを投稿に含める
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSaveShareSettings}
                    className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                  >
                    <Save className="mr-2" size={20} />
                    共有設定を保存
                  </button>
                </div>
              </div>

              {/* プレビューセクション */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">投稿プレビュー</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPreviewType('today')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        previewType === 'today'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      本日
                    </button>
                    <button
                      onClick={() => setPreviewType('week')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        previewType === 'week'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      今週
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {previewText}
                  </pre>
                </div>
                
                <button
                  onClick={copyToClipboard}
                  className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                >
                  <Copy className="mr-2" size={20} />
                  テキストをコピー
                </button>
              </div>
            </div>
          )}

          {/* 目標設定タブ */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              {/* 目標設定メインセクション */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Target className="mr-2 text-orange-500" size={24} />
                    月次目標設定
                  </h2>
                  <div className="text-sm text-gray-500">
                    {goals.currentYear}年{goals.currentMonth}月の目標
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 売上目標 */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-blue-900 ml-3">月間売上目標</h3>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-blue-700 mb-2">
                        目標金額（円）
                      </label>
                      <input
                        type="number"
                        value={goals.monthlyRevenue}
                        onChange={(e) => setGoals(prev => ({ ...prev, monthlyRevenue: parseInt(e.target.value) || 0 }))}
                        className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="500000"
                        min="0"
                        step="10000"
                      />
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      ¥{goals.monthlyRevenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-600 mt-2">
                      現在の達成率: 76.8% (¥{Math.floor(goals.monthlyRevenue * 0.768).toLocaleString()})
                    </div>
                  </div>

                  {/* 予約件数目標 */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-green-900 ml-3">月間予約件数目標</h3>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-green-700 mb-2">
                        目標件数
                      </label>
                      <input
                        type="number"
                        value={goals.monthlyAppointments}
                        onChange={(e) => setGoals(prev => ({ ...prev, monthlyAppointments: parseInt(e.target.value) || 0 }))}
                        className="w-full p-3 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="80"
                        min="0"
                      />
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {goals.monthlyAppointments}件
                    </div>
                    <div className="text-sm text-green-600 mt-2">
                      現在の達成率: 62.5% ({Math.floor(goals.monthlyAppointments * 0.625)}件)
                    </div>
                  </div>

                  {/* 平均評価目標 */}
                  <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-yellow-500 rounded-lg">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-yellow-900 ml-3">平均評価目標</h3>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-yellow-700 mb-2">
                        目標評価（5段階）
                      </label>
                      <input
                        type="number"
                        value={goals.averageRating}
                        onChange={(e) => setGoals(prev => ({ ...prev, averageRating: parseFloat(e.target.value) || 0 }))}
                        className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        placeholder="4.5"
                        min="0"
                        max="5"
                        step="0.1"
                      />
                    </div>
                    <div className="flex items-center">
                      <div className="text-2xl font-bold text-yellow-900 mr-2">
                        {goals.averageRating}
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star}
                            className={`w-5 h-5 ${
                              star <= goals.averageRating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-yellow-600 mt-2">
                      現在の平均評価: 4.2/5.0
                    </div>
                  </div>

                  {/* リピート率目標 */}
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-purple-900 ml-3">リピート率目標</h3>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-purple-700 mb-2">
                        目標リピート率（%）
                      </label>
                      <input
                        type="number"
                        value={goals.repeatCustomerRate}
                        onChange={(e) => setGoals(prev => ({ ...prev, repeatCustomerRate: parseInt(e.target.value) || 0 }))}
                        className="w-full p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="70"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {goals.repeatCustomerRate}%
                    </div>
                    <div className="text-sm text-purple-600 mt-2">
                      現在のリピート率: 65%
                    </div>
                  </div>
                </div>

                {/* 目標達成プログレス */}
                <div className="mt-8 bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">今月の目標達成状況</h3>
                  <div className="space-y-4">
                    {/* 売上進捗 */}
                    <div>
                      <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>売上目標</span>
                        <span>76.8% (¥{Math.floor(goals.monthlyRevenue * 0.768).toLocaleString()} / ¥{goals.monthlyRevenue.toLocaleString()})</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-blue-500 h-3 rounded-full transition-all duration-500" style={{ width: '76.8%' }}></div>
                      </div>
                    </div>
                    
                    {/* 予約件数進捗 */}
                    <div>
                      <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>予約件数目標</span>
                        <span>62.5% ({Math.floor(goals.monthlyAppointments * 0.625)}件 / {goals.monthlyAppointments}件)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-green-500 h-3 rounded-full transition-all duration-500" style={{ width: '62.5%' }}></div>
                      </div>
                    </div>
                    
                    {/* 評価進捗 */}
                    <div>
                      <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>評価目標</span>
                        <span>84% (4.2 / {goals.averageRating})</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-yellow-500 h-3 rounded-full transition-all duration-500" style={{ width: '84%' }}></div>
                      </div>
                    </div>
                    
                    {/* リピート率進捗 */}
                    <div>
                      <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>リピート率目標</span>
                        <span>92.8% (65% / {goals.repeatCustomerRate}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-purple-500 h-3 rounded-full transition-all duration-500" style={{ width: '92.8%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 保存ボタン */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      localStorage.setItem(`goals_${user?.id}`, JSON.stringify(goals));
                      alert('目標設定を保存しました');
                    }}
                    className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
                  >
                    <Save className="mr-2" size={20} />
                    目標設定を保存
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
