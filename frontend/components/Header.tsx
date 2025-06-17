'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, User, Calendar, UserPlus, LogOut, Home } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const isActive = (path: string) => pathname === path;

  const navigationItems = user ? [
    { href: '/', label: 'ホーム', icon: Home },
    { href: '/appointments', label: '予約履歴', icon: Calendar },
    { href: '/book', label: '予約する', icon: Calendar },
    { href: '/referral', label: '紹介', icon: UserPlus },
    { href: '/profile', label: 'プロフィール', icon: User },
  ] : [
    { href: '/login', label: 'ログイン', icon: User },
    { href: '/register', label: '新規登録', icon: UserPlus },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo2_header_300x90.png"
              alt="CiER"
              width={300}
              height={90}
              className="h-9 w-auto"
              priority
            />
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden lg:flex space-x-4">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive(item.href)
                      ? 'text-orange-600 bg-orange-50 font-semibold'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden xl:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* ユーザーメニュー（デスクトップ） */}
          {user && (
            <div className="hidden lg:flex items-center space-x-3">
              <span className="text-sm text-gray-700 font-medium">
                こんにちは、{user.first_name || user.username}さん
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xl:inline">ログアウト</span>
              </button>
            </div>
          )}

          {/* モバイルメニューボタン */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* モバイルメニュー */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'text-orange-600 bg-orange-50'
                        : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              {user && (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 px-3 py-3 text-sm text-gray-600 hover:text-red-600 hover:bg-gray-50 transition-colors w-full text-left rounded-md"
                >
                  <LogOut className="w-5 h-5" />
                  <span>ログアウト</span>
                </button>
              )}
            </nav>
            {user && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="px-3 text-sm text-gray-700 font-medium">
                  こんにちは、{user.first_name || user.username}さん
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
