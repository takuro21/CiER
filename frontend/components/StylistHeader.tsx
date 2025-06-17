'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HomeIcon, 
  CalendarIcon, 
  UserIcon, 
  ClockIcon, 
  CogIcon,
  BuildingStorefrontIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function StylistHeader() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // 権限チェック関数
  const canManageStaff = () => {
    return user?.is_manager || user?.is_owner;
  };

  const canAccessSalonManagement = () => {
    return user?.is_manager || user?.is_owner;
  };

  const navItems = [
    {
      href: '/stylist/dashboard',
      icon: HomeIcon,
      label: 'ダッシュボード',
      show: true
    },
    {
      href: '/stylist/appointments',
      icon: CalendarIcon,
      label: '予約管理',
      show: true
    },
    {
      href: '/stylist/schedule',
      icon: ClockIcon,
      label: 'スケジュール',
      show: true
    },
    {
      href: '/stylist/services',
      icon: CogIcon,
      label: 'サービス設定',
      show: true
    },
    {
      href: '/salon-management',
      icon: BuildingStorefrontIcon,
      label: 'サロン管理',
      show: canAccessSalonManagement()
    },
    {
      href: '/stylist/profile',
      icon: UserIcon,
      label: 'プロフィール',
      show: true
    }
  ];

  const visibleNavItems = navItems.filter(item => item.show);

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/stylist/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CiER</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <p className="text-gray-700 font-medium">{user.username}</p>
                  <p className="text-gray-500 text-xs">
                    {user.is_owner ? 'オーナー' : user.is_manager ? 'マネージャー' : 'スタイリスト'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 p-2"
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Mobile User Info */}
          {user && (
            <div className="border-t px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 font-medium">{user.username}</p>
                  <p className="text-gray-500 text-sm">
                    {user.is_owner ? 'オーナー' : user.is_manager ? 'マネージャー' : 'スタイリスト'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ログアウト
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
