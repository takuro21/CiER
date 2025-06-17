'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { appointmentsAPI } from '../../../lib/api';

export default function MockCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const appointmentId = searchParams.get('appointment_id');
  const amount = searchParams.get('amount');

  const handlePayment = async (success: boolean) => {
    setIsProcessing(true);
    
    if (success) {
      // 開発環境では決済成功をシミュレート
      // 実際の実装では、バックエンドに決済完了を通知する
      alert('決済が完了しました！（開発環境モック）');
      router.push('/appointments');
    } else {
      // キャンセル
      alert('決済をキャンセルしました。');
      router.push('/book');
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          決済確認（開発環境）
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          これは開発環境のモック決済ページです
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-2">支払い詳細</h3>
              <p className="text-sm text-gray-600">予約ID: {appointmentId}</p>
              <p className="text-sm text-gray-600">金額: ¥{amount?.toLocaleString()}</p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => handlePayment(true)}
                disabled={isProcessing}
                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isProcessing ? '処理中...' : '決済完了'}
              </button>
              
              <button
                onClick={() => handlePayment(false)}
                disabled={isProcessing}
                className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
