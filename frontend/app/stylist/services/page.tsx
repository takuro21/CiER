'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/StylistLayout';
import { Scissors, Plus, Edit, Trash2, Save, X, DollarSign, Clock, Star } from 'lucide-react';
import Link from 'next/link';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // 分
  price: number;
  category: string;
  isActive: boolean;
}

export default function StylistServicesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isAddingService, setIsAddingService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState<Partial<Service>>({
    name: '',
    description: '',
    duration: 60,
    price: 5000,
    category: 'カット',
    isActive: true
  });

  useEffect(() => {
    setMounted(true);
    // ダミーサービスデータを設定
    setServices([
      {
        id: '1',
        name: 'カット',
        description: 'スタイリングに合わせたカット',
        duration: 60,
        price: 4000,
        category: 'カット',
        isActive: true
      },
      {
        id: '2',
        name: 'カラー',
        description: 'トレンドに合わせたカラーリング',
        duration: 120,
        price: 8000,
        category: 'カラー',
        isActive: true
      },
      {
        id: '3',
        name: 'パーマ',
        description: 'デジタルパーマ・コールドパーマ',
        duration: 90,
        price: 6500,
        category: 'パーマ',
        isActive: true
      },
      {
        id: '4',
        name: 'トリートメント',
        description: '髪質改善トリートメント',
        duration: 45,
        price: 3000,
        category: 'ケア',
        isActive: true
      }
    ]);
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
    }
  }, [mounted, isLoading, user, router]);

  const categories = ['カット', 'カラー', 'パーマ', 'ケア', 'その他'];

  const handleAddService = () => {
    if (newService.name && newService.description && newService.duration && newService.price) {
      const service: Service = {
        id: Date.now().toString(),
        name: newService.name,
        description: newService.description,
        duration: newService.duration,
        price: newService.price,
        category: newService.category || 'その他',
        isActive: newService.isActive || true
      };
      setServices([...services, service]);
      setNewService({
        name: '',
        description: '',
        duration: 60,
        price: 5000,
        category: 'カット',
        isActive: true
      });
      setIsAddingService(false);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService({ ...service });
  };

  const handleUpdateService = () => {
    if (editingService) {
      setServices(services.map(s => s.id === editingService.id ? editingService : s));
      setEditingService(null);
    }
  };

  const handleDeleteService = (serviceId: string) => {
    if (confirm('このサービスを削除しますか？')) {
      setServices(services.filter(s => s.id !== serviceId));
    }
  };

  const toggleServiceStatus = (serviceId: string) => {
    setServices(services.map(s => 
      s.id === serviceId ? { ...s, isActive: !s.isActive } : s
    ));
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
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          {/* ヘッダー */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                  <Scissors className="w-7 h-7 mr-3 text-orange-500" />
                  サービス管理
                </h1>
                <p className="text-gray-600">メニューと料金を管理できます</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAddingService(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新しいサービス
                </button>
                <Link
                  href="/stylist/dashboard"
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  ダッシュボード
                </Link>
              </div>
            </div>
          </div>

          {/* サービス統計 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">総サービス数</p>
                  <p className="text-3xl font-bold text-gray-900">{services.length}</p>
                </div>
                <div className="bg-blue-100 rounded-lg p-3">
                  <Scissors className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">平均料金</p>
                  <p className="text-3xl font-bold text-gray-900">
                    ¥{Math.round(services.reduce((sum, s) => sum + s.price, 0) / services.length || 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-100 rounded-lg p-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">アクティブ</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {services.filter(s => s.isActive).length}
                  </p>
                </div>
                <div className="bg-orange-100 rounded-lg p-3">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* サービス一覧 */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">サービス一覧</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`border rounded-xl p-4 transition-all ${
                    service.isActive 
                      ? 'border-gray-200 bg-white' 
                      : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{service.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          service.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {service.isActive ? '有効' : '無効'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {service.duration}分
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ¥{service.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditService(service)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="編集"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleServiceStatus(service.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          service.isActive 
                            ? 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50' 
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                        }`}
                        title={service.isActive ? '無効にする' : '有効にする'}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded inline-block">
                    {service.category}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 新規サービス追加モーダル */}
          {isAddingService && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">新しいサービス</h3>
                  <button
                    onClick={() => setIsAddingService(false)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      サービス名
                    </label>
                    <input
                      type="text"
                      value={newService.name || ''}
                      onChange={(e) => setNewService({...newService, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="カット"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      説明
                    </label>
                    <textarea
                      value={newService.description || ''}
                      onChange={(e) => setNewService({...newService, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      rows={3}
                      placeholder="サービスの詳細な説明"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        所要時間（分）
                      </label>
                      <input
                        type="number"
                        value={newService.duration || 60}
                        onChange={(e) => setNewService({...newService, duration: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        min="15"
                        step="15"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        料金（円）
                      </label>
                      <input
                        type="number"
                        value={newService.price || 5000}
                        onChange={(e) => setNewService({...newService, price: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        step="500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カテゴリ
                    </label>
                    <select
                      value={newService.category || 'カット'}
                      onChange={(e) => setNewService({...newService, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setIsAddingService(false)}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleAddService}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 編集モーダル */}
          {editingService && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">サービス編集</h3>
                  <button
                    onClick={() => setEditingService(null)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      サービス名
                    </label>
                    <input
                      type="text"
                      value={editingService.name}
                      onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      説明
                    </label>
                    <textarea
                      value={editingService.description}
                      onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        所要時間（分）
                      </label>
                      <input
                        type="number"
                        value={editingService.duration}
                        onChange={(e) => setEditingService({...editingService, duration: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        min="15"
                        step="15"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        料金（円）
                      </label>
                      <input
                        type="number"
                        value={editingService.price}
                        onChange={(e) => setEditingService({...editingService, price: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        min="0"
                        step="500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カテゴリ
                    </label>
                    <select
                      value={editingService.category}
                      onChange={(e) => setEditingService({...editingService, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setEditingService(null)}
                    className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleUpdateService}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    更新
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