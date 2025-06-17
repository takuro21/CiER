'use client';

import { useState } from 'react';

export default function StylistLoginPage() {
  const [mounted, setMounted] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">スタイリストログイン</h1>
        <p className="text-gray-600 mb-4">シンプルテストバージョン</p>
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">✅ ページが正常に読み込まれました</p>
        </div>
      </div>
    </div>
  );
}
