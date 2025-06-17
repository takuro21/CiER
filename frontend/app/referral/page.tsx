'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { referralsAPI, appointmentsAPI } from '../../lib/api';
import { QrCode, Copy, Share } from 'lucide-react';
import Image from 'next/image';
import Layout from '../../components/Layout';
import type { Stylist } from '../../lib/types';

export default function ReferralPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [selectedStylist, setSelectedStylist] = useState<number | null>(null);
  const [usedStylists, setUsedStylists] = useState<Stylist[]>([]);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 認証チェックをuseEffectで行う
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setShouldRedirect(true);
      } else {
        setShouldRedirect(false);
      }
    }
  }, [user, authLoading]);

  // リダイレクト処理を別のuseEffectで実行
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/login');
    }
  }, [shouldRedirect, router]);

  const { data: referralLink, isLoading } = useQuery({
    queryKey: ['referralLink', selectedStylist],
    queryFn: async () => {
      const response = await referralsAPI.getMyReferralLink();
      return response.data;
    },
    enabled: mounted && !authLoading && !!user && !shouldRedirect,
    retry: 3,
    retryDelay: 1000
  });

  const { data: appointmentsResponse } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsAPI.getAll(),
    enabled: mounted && !authLoading && !!user && !shouldRedirect
  });

  // ユーザーが利用したことのある美容師を取得
  useEffect(() => {
    if (appointmentsResponse?.data) {
      const appointments = Array.isArray(appointmentsResponse.data) 
        ? appointmentsResponse.data 
        : (appointmentsResponse.data as { results?: { stylist: Stylist }[] })?.results || [];
      const stylistsUsed = (appointments as { stylist: Stylist }[]).map((appointment) => appointment.stylist);
      // 重複除去
      const uniqueStylists = stylistsUsed.filter((stylist: Stylist, index: number, self: Stylist[]) => 
        index === self.findIndex((s: Stylist) => s.id === stylist.id)
      );
      setUsedStylists(uniqueStylists);
      
      // 1人の美容師しか利用していない場合は自動選択
      if (uniqueStylists.length === 1) {
        setSelectedStylist(uniqueStylists[0].id);
      }
    }
  }, [appointmentsResponse]);

  const { data: qrCodeData } = useQuery({
    queryKey: ['qrCode', selectedStylist],
    queryFn: () => referralsAPI.getQRCode().then((res) => res.data),
    enabled: mounted && !authLoading && !!user && !shouldRedirect && !!referralLink && showQRCode,
    retry: 2
  });

  const { data: myReferrals = [] } = useQuery({
    queryKey: ['myReferrals'],
    queryFn: () => referralsAPI.getMyReferrals().then((res) => res.data),
    enabled: mounted && !authLoading && !!user && !shouldRedirect,
    retry: 2
  });

  const { data: stats } = useQuery({
    queryKey: ['referralStats'],
    queryFn: () => referralsAPI.getReferralStats().then((res) => res.data),
    enabled: mounted && !authLoading && !!user && !shouldRedirect,
    retry: 2
  });

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ユーザーがログインしていない場合（念のため）
  if (!user) {
    return null;
  }

  const referralUrl = referralLink 
    ? `${window.location.origin}/invite/${referralLink.referral_code}${selectedStylist ? `?stylist=${selectedStylist}` : ''}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('コピーに失敗しました:', err);
    }
  };

  const handleCopyQRCode = async () => {
    try {
      if (qrCodeData?.qr_code) {
        // QRコードの画像データをブロブとして取得
        const response = await fetch(qrCodeData.qr_code);
        const blob = await response.blob();
        
        // クリップボードアイテムを作成
        const clipboardItem = new ClipboardItem({
          'image/png': blob
        });
        
        await navigator.clipboard.write([clipboardItem]);
        setQrCopied(true);
        setTimeout(() => setQrCopied(false), 2000);
      }
    } catch (err) {
      console.error('QRコードのコピーに失敗しました:', err);
      // フォールバックとしてリンクをコピー
      handleCopy();
    }
  };

  const handleShare = async () => {
    // 既に共有中の場合は何もしない
    if (isSharing) {
      return;
    }

    try {
      setIsSharing(true);
      
      if (navigator.share) {
        await navigator.share({
          title: 'CiER - 美容室予約',
          text: '友達から紹介された美容室で素敵なヘアスタイルに！',
          url: referralUrl,
        });
      } else {
        // Web Share APIが利用できない場合はクリップボードにコピー
        await navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // ユーザーが共有をキャンセルした場合やエラーが発生した場合
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('シェアに失敗しました:', err);
        // フォールバックとしてクリップボードにコピー
        try {
          await navigator.clipboard.writeText(referralUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (clipboardErr) {
          console.error('クリップボードへのコピーにも失敗しました:', clipboardErr);
        }
      }
    } finally {
      // 共有操作が完了したら状態をリセット
      setTimeout(() => {
        setIsSharing(false);
      }, 500); // 少し遅延を入れて確実に状態をリセット
    }
  };

  return (
    <Layout maxWidth="xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-green-500">{stats?.total_referrals || 0}</p>
              <p className="text-gray-600 text-sm">総紹介数</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <p className="text-3xl font-bold text-orange-400">{stats?.successful_referrals || 0}</p>
              <p className="text-gray-600 text-sm">成功数</p>
            </div>
          </div>

          {/* Stylist Selection */}
          {usedStylists.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {usedStylists.length === 1 ? 'おすすめの美容師' : '紹介する美容師を選択'}
              </h2>
              {usedStylists.length === 1 ? (
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-400 text-xl">👤</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {usedStylists[0].user.first_name} {usedStylists[0].user.last_name}さん
                    </p>
                    <p className="text-sm text-gray-600">CiER美容室</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {usedStylists.map((stylist) => (
                    <button
                      key={stylist.id}
                      onClick={() => setSelectedStylist(stylist.id)}
                      className={`flex items-center space-x-4 p-4 rounded-xl transition-colors ${
                        selectedStylist === stylist.id
                          ? 'bg-orange-100 border border-orange-300'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-400 text-xl">👤</span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">
                          {stylist.user.first_name} {stylist.user.last_name}さん
                        </p>
                        <p className="text-sm text-gray-600">CiER美容室</p>
                      </div>
                      {selectedStylist === stylist.id && (
                        <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Referral Link Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">あなたの紹介リンク</h2>
          
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400 mx-auto mb-2"></div>
              <p className="text-gray-600 text-sm">読み込み中...</p>
            </div>
          ) : referralLink ? (
            <div className="space-y-4">
              {/* Referral Code */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">紹介コード</p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-lg font-bold text-gray-900">{referralLink.referral_code}</p>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(referralLink.referral_code);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch (err) {
                        console.error('コピーに失敗しました:', err);
                      }
                    }}
                    className="px-3 py-1 bg-orange-400 text-white rounded-lg hover:bg-orange-500 text-xs"
                  >
                    {copied ? '✓' : 'コピー'}
                  </button>
                </div>
              </div>

              {/* QR Code Generation Button */}
              <button
                onClick={() => setShowQRCode(!showQRCode)}
                className="w-full bg-blue-100 text-blue-900 py-3 rounded-xl font-semibold hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
              >
                <QrCode className="w-5 h-5" />
                <span>{showQRCode ? 'QRコードを非表示' : '友達に紹介する'}</span>
              </button>

              {/* QR Code Display */}
              {showQRCode && qrCodeData && (
                <div className="p-6 bg-gray-50 rounded-xl text-center">
                  <div className="flex justify-center mb-4">
                    <Image
                      src={qrCodeData.qr_code}
                      alt="QR Code"
                      width={192}
                      height={192}
                      className="rounded-xl border border-gray-200"
                    />
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    このQRコードをスキャンして紹介リンクにアクセス
                  </p>
                  <button
                    onClick={handleCopyQRCode}
                    className="w-full bg-orange-400 text-white py-2 rounded-lg font-medium hover:bg-orange-500 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{qrCopied ? 'QRコードをコピー済み!' : 'QRコードをコピー'}</span>
                  </button>
                </div>
              )}

              {showQRCode && !qrCodeData && (
                <div className="p-6 bg-gray-50 rounded-xl text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-sm">QRコードを生成中...</p>
                </div>
              )}

              {/* Share Button - appears when QR code is not shown */}
              {!showQRCode && (
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-2 ${
                    isSharing 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : 'bg-green-100 text-green-900 hover:bg-green-200'
                  }`}
                >
                  {isSharing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                      <span>共有中...</span>
                    </>
                  ) : (
                    <>
                      <Share className="w-5 h-5" />
                      <span>{copied ? 'リンクをコピー済み!' : 'リンクで共有'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-red-600 text-sm">紹介リンクの読み込みに失敗しました</p>
            </div>
          )}
        </div>

        {/* Referred Friends */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">あなたの紹介</h3>
          {myReferrals.length > 0 ? (
            <div className="space-y-3">
              {myReferrals.slice(0, 5).map((referral: { id: number; referred_user: { first_name: string; last_name: string }; created_at: string; is_successful: boolean }) => (
                <div key={referral.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">
                      {referral.referred_user.first_name} {referral.referred_user.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(referral.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  {referral.is_successful && (
                    <div className="text-green-500 text-xs bg-green-50 px-2 py-1 rounded">
                      ✓ 予約済み
                    </div>
                  )}
                </div>
              ))}
              {myReferrals.length > 5 && (
                <p className="text-center text-gray-500 text-sm">
                  他に{myReferrals.length - 5}件の紹介があります
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Copy className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">まだ紹介がありません</p>
              <p className="text-gray-400 text-xs mt-1">
                リンクを共有して始めましょう！
              </p>
            </div>
          )}
        </div>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* QR Code Card */}
          {referralLink && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">QRコード</h3>
              {!showQRCode ? (
                <button
                  onClick={() => setShowQRCode(true)}
                  className="w-full flex items-center justify-center space-x-2 p-4 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors"
                >
                  <QrCode className="w-5 h-5 text-orange-400" />
                  <span className="text-orange-400 font-medium">QRコードを表示</span>
                </button>
              ) : qrCodeData ? (
                <div className="text-center">
                  <div className="bg-white p-4 rounded-xl border inline-block">
                    <Image
                      src={qrCodeData.qr_code_url}
                      alt="紹介QRコード"
                      width={200}
                      height={200}
                      className="mx-auto"
                    />
                  </div>
                  <button
                    onClick={handleCopyQRCode}
                    className="w-full mt-4 flex items-center justify-center space-x-2 p-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700 text-sm">
                      {qrCopied ? 'コピーしました！' : 'QRコードをコピー'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">QRコード生成中...</p>
                </div>
              )}
            </div>
          )}

          {/* Tips Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 紹介のコツ</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• あなた専用のリンクを友達と共有</li>
              <li>• 直接会った時にQRコードを見せる</li>
              <li>• おすすめの美容師さんの魅力を伝える</li>
              <li>• あなたの素晴らしい体験を話す</li>
              <li>• お互いに特典をゲットできます！</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}
