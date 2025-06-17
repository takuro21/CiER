'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { referralsAPI } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [referrerInfo, setReferrerInfo] = useState<{
    name: string;
    code: string;
    valid: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const referralCode = params?.code as string;
  const stylistId = searchParams?.get('stylist');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !referralCode) return;

    const validateReferralCode = async () => {
      try {
        const response = await referralsAPI.validateReferralCode(referralCode);
        if (response.data && response.data.valid) {
          setReferrerInfo({
            name: `${response.data.referrer.first_name || ''} ${response.data.referrer.last_name || ''}`.trim() || response.data.referrer.username,
            code: referralCode,
            valid: true
          });
        } else {
          setReferrerInfo({
            name: '',
            code: referralCode,
            valid: false
          });
        }
      } catch (error) {
        console.error('紹介コードの検証に失敗:', error);
        setReferrerInfo({
          name: '',
          code: referralCode,
          valid: false
        });
      } finally {
        setIsLoading(false);
      }
    };

    validateReferralCode();
  }, [mounted, referralCode]);

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-gray-600">招待コードを確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎉</h1>
          <h2 className="text-3xl font-extrabold text-gray-900">
            CiERへようこそ
          </h2>
          
          {referrerInfo?.valid ? (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-3">👋</span>
                <div>
                  <p className="text-green-800 font-medium">
                    <strong>{referrerInfo.name}</strong>さんからの招待
                  </p>
                  <p className="text-green-600 text-sm">
                    招待コード: {referrerInfo.code}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">
                招待コードが無効です: {referralCode}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {user ? (
            // ユーザーがログイン済みの場合
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-center">
                  ようこそ、{user.username}さん！
                </p>
              </div>
              
              <Link
                href={referrerInfo?.valid ? `/book?ref=${referralCode}${stylistId ? `&stylist=${stylistId}` : ''}` : '/book'}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                今すぐ予約する
              </Link>
              
              <Link
                href="/"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                ホームに戻る
              </Link>
            </div>
          ) : (
            // ユーザーが未ログインの場合
            <div className="space-y-4">
              <Link
                href={referrerInfo?.valid ? `/book?ref=${referralCode}${stylistId ? `&stylist=${stylistId}` : ''}` : '/book'}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-400 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 transition-colors"
              >
                ゲストとして予約する
              </Link>
              
              <Link
                href={referrerInfo?.valid ? `/register?ref=${referralCode}${stylistId ? `&stylist=${stylistId}` : ''}` : '/register'}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                新規アカウント作成
              </Link>
              
              <Link
                href={referrerInfo?.valid ? `/login?ref=${referralCode}${stylistId ? `&stylist=${stylistId}` : ''}` : '/login'}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                既存アカウントでログイン
              </Link>
            </div>
          )}
        </div>

        {referrerInfo?.valid && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">🌟 特典情報</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• 初回予約で特別割引</li>
              <li>• 友達紹介でポイント獲得</li>
              <li>• 高品質なサロンサービス</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
