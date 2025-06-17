import Link from 'next/link';
import Image from 'next/image';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ブランド情報 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo2_footer_200x60.png"
                alt="CiER"
                width={100}
                height={30}
                style={{ width: 'auto', height: '32px' }}
              />
            </div>
            <p className="text-gray-600 text-sm">
              友達と一緒に素敵な美容体験を。
              紹介システム付きの美容室予約プラットフォーム。
            </p>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>in Japan</span>
            </div>
          </div>

          {/* サービス */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">サービス</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/book" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  美容室予約
                </Link>
              </li>
              <li>
                <Link href="/referral" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  友達紹介
                </Link>
              </li>
              <li>
                <Link href="/appointments" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  予約管理
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  プロフィール
                </Link>
              </li>
            </ul>
          </div>

          {/* サポート */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">サポート</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  よくある質問
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  利用規約
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  プライバシーポリシー
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  お問い合わせ
                </a>
              </li>
            </ul>
          </div>

          {/* 連絡先 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">連絡先</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href="mailto:info@cier.jp" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  info@cier.jp
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href="tel:+81-3-1234-5678" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                  03-1234-5678
                </a>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-sm text-gray-600">
                  〒150-0001<br />
                  東京都渋谷区神宮前1-1-1
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* ボーダーと著作権 */}
        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © {currentYear} CiER. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
              Facebook
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
              Twitter
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
