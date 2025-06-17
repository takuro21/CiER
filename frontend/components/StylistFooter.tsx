'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, BarChart3, Scissors, Share2, Phone, Mail, MapPin, Clock } from 'lucide-react';

export default function StylistFooter() {
  const quickLinks = [
    { href: '/stylist/dashboard', label: 'ダッシュボード', icon: BarChart3 },
    { href: '/stylist/schedule', label: 'スケジュール管理', icon: Calendar },
    { href: '/stylist/services', label: 'サービス管理', icon: Scissors },
    { href: '/stylist/profile', label: '共有設定', icon: Share2 },
  ];

  const supportLinks = [
    { href: '/stylist/help', label: 'ヘルプ・使い方' },
    { href: '/stylist/faq', label: 'よくある質問' },
    { href: '/stylist/contact', label: 'お問い合わせ' },
    { href: '/stylist/terms', label: '利用規約' },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* ブランド情報 */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/logo2_footer_200x60.png"
                alt="CiER"
                width={100}
                height={30}
                className="h-8 w-auto"
              />
              <div className="border-l border-gray-700 pl-3">
                <div className="text-orange-400 text-sm font-medium">Stylist Portal</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              美容師の皆様の予約管理とビジネス成長をサポートする総合プラットフォーム
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>24時間アクセス可能</span>
            </div>
          </div>

          {/* クイックリンク */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">機能メニュー</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center space-x-2 text-gray-400 hover:text-orange-400 transition-colors duration-200"
                    >
                      <IconComponent className="w-4 h-4" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* サポート */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">サポート</h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-orange-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* お問い合わせ情報 */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">お問い合わせ</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Phone className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-400">サポートデスク</div>
                  <div className="text-white font-medium">03-1234-5678</div>
                  <div className="text-xs text-gray-500">平日 9:00-18:00</div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <Mail className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-400">メール</div>
                  <div className="text-white font-medium">stylist@cier.jp</div>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-400">所在地</div>
                  <div className="text-white font-medium">東京都渋谷区</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ボトムセクション */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-500">
              © 2025 CiER. All rights reserved. | スタイリスト専用ポータル
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/stylist/privacy" className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
                プライバシーポリシー
              </Link>
              <Link href="/stylist/terms" className="text-sm text-gray-500 hover:text-orange-400 transition-colors">
                利用規約
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-500">システム正常稼働中</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
