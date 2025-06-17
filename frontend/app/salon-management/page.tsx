'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, Button, Badge } from '@/components/ui/card';
import { salonManagementAPI } from '@/lib/api';
import type { StaffMember, Salon } from '@/lib/types';

export default function SalonManagementPage() {
  const { user, isAuthenticated } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // 権限チェック
  const canManageStaff = user?.can_manage_staff || user?.is_manager || user?.is_owner;
  const isOwner = user?.is_owner;

  useEffect(() => {
    if (isAuthenticated && canManageStaff) {
      fetchData();
    }
  }, [isAuthenticated, canManageStaff]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // スタッフ一覧を取得
      const staffResponse = await fetch('/api/accounts/staff/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        setStaff(staffData);
      }

      // サロン一覧を取得（オーナーのみ）
      if (isOwner) {
        const salonsResponse = await fetch('/api/accounts/salons/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (salonsResponse.ok) {
          const salonsData = await salonsResponse.json();
          setSalons(salonsData);
        }
      }
    } catch (err) {
      setError('データの取得に失敗しました');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStaffRole = async (staffId: number, roleData: { is_manager?: boolean; is_owner?: boolean }) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/accounts/staff/${staffId}/role/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(roleData),
      });

      if (response.ok) {
        await fetchData(); // データを再取得
        setShowRoleModal(false);
        setSelectedStaff(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '権限の更新に失敗しました');
      }
    } catch (err) {
      setError('権限の更新に失敗しました');
      console.error('Error updating staff role:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>ログインが必要です</p>
      </div>
    );
  }

  if (!canManageStaff) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>この機能を利用する権限がありません</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">サロン管理</h1>
        <p className="text-gray-600">
          {isOwner ? 'オーナー' : '店長'}として、スタッフとサロンを管理できます
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* サロン情報（オーナーのみ） */}
      {isOwner && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">サロン情報</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {salons.map((salon) => (
              <Card key={salon.id} className="p-4">
                <h3 className="text-lg font-semibold mb-2">{salon.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{salon.address}</p>
                <p className="text-sm mb-2">📞 {salon.phone_number}</p>
                <p className="text-sm mb-2">
                  🕒 {salon.opening_time} - {salon.closing_time}
                </p>
                <p className="text-sm mb-2">
                  👥 スタイリスト: {salon.stylists_count}名
                </p>
                <Badge variant={salon.auto_assign_enabled ? 'default' : 'secondary'}>
                  {salon.auto_assign_enabled ? '自動割り当て有効' : '自動割り当て無効'}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* スタッフ管理 */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">スタッフ管理</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <Card key={member.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold">
                  {member.user_info.full_name}
                </h3>
                <div className="flex flex-col gap-1">
                  {member.is_owner && (
                    <Badge variant="destructive">オーナー</Badge>
                  )}
                  {member.is_manager && !member.is_owner && (
                    <Badge variant="default">店長</Badge>
                  )}
                  {!member.is_manager && !member.is_owner && (
                    <Badge variant="outline">スタイリスト</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p>📧 {member.email}</p>
                <p>📞 {member.user_info.phone_number}</p>
                {member.profile_info && (
                  <>
                    <p>💼 経験年数: {member.profile_info.experience_years}年</p>
                    <p>🕒 勤務時間: {member.profile_info.working_hours}</p>
                    <p>📊 最近の予約: {member.recent_appointments}件</p>
                    <p>
                      {member.profile_info.accepts_walk_ins ? '✅' : '❌'} 
                      指名なし予約受付
                    </p>
                  </>
                )}
              </div>

              {isOwner && !member.is_owner && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedStaff(member);
                      setShowRoleModal(true);
                    }}
                  >
                    権限変更
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* 権限変更モーダル */}
      {showRoleModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">
              {selectedStaff.user_info.full_name}の権限変更
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">現在の権限:</p>
                <div className="flex gap-2">
                  {selectedStaff.is_owner && (
                    <Badge variant="destructive">オーナー</Badge>
                  )}
                  {selectedStaff.is_manager && (
                    <Badge variant="default">店長</Badge>
                  )}
                  {!selectedStaff.is_manager && !selectedStaff.is_owner && (
                    <Badge variant="outline">スタイリスト</Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedStaff.is_manager ? "destructive" : "default"}
                  onClick={() => {
                    updateStaffRole(selectedStaff.id, {
                      is_manager: !selectedStaff.is_manager
                    });
                  }}
                >
                  {selectedStaff.is_manager ? '店長権限を削除' : '店長権限を付与'}
                </Button>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedStaff(null);
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
