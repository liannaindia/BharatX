import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import { supabase } from "./supabaseClient";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [userId, setUserId] = useState(null);
  const location = useLocation();

  // 修复 1：实时监听 localStorage 变化（关键！）
  useEffect(() => {
    const checkLoginStatus = () => {
      const savedPhone = localStorage.getItem('phone_number');
      const savedUserId = localStorage.getItem('user_id');

      if (savedPhone && savedUserId) {
        setIsLoggedIn(true);
        setUserId(savedUserId);
      } else {
        setIsLoggedIn(false);
        setUserId(null);
      }
    };

    // 立即检查一次
    checkLoginStatus();

    // 每 500ms 检查一次（开发/生产都安全）
    const interval = setInterval(checkLoginStatus, 500);

    // 监听跨标签页 storage 事件
    const handleStorageChange = (e) => {
      if (e.key === 'phone_number' || e.key === 'user_id') {
        checkLoginStatus();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 修复 2：全局实时余额订阅（依赖 isLoggedIn 和 userId）
  useEffect(() => {
    let realtimeSubscriptionBalance = null;
    let realtimeSubscriptionAvailableBalance = null;

    const setupBalance = async () => {
      if (!isLoggedIn || !userId) {
        // 未登录：清理订阅
        if (realtimeSubscriptionBalance) {
          supabase.removeChannel(realtimeSubscriptionBalance);
          realtimeSubscriptionBalance = null;
        }
        if (realtimeSubscriptionAvailableBalance) {
          supabase.removeChannel(realtimeSubscriptionAvailableBalance);
          realtimeSubscriptionAvailableBalance = null;
        }
        return;
      }

      // 初始加载余额
      const { data, error } = await supabase
        .from('users')
        .select('balance, available_balance')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching initial balance:', error);
      } else if (data) {
        setBalance(data.balance || 0);
        setAvailableBalance(data.available_balance || 0);
      }

      // 订阅 balance
      realtimeSubscriptionBalance = supabase
        .channel('global-balance-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            setBalance(payload.new.balance || 0);
          }
        )
        .subscribe();

      // 订阅 available_balance
      realtimeSubscriptionAvailableBalance = supabase
        .channel('global-available-balance-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            setAvailableBalance(payload.new.available_balance || 0);
          }
        )
        .subscribe();
    };

    setupBalance();

    return () => {
      if (realtimeSubscriptionBalance) {
        supabase.removeChannel(realtimeSubscriptionBalance);
      }
      if (realtimeSubscriptionAvailableBalance) {
        supabase.removeChannel(realtimeSubscriptionAvailableBalance);
      }
    };
  }, [isLoggedIn, userId]); // 依赖 isLoggedIn 和 userId

  // Hide BottomNav on specific routes if needed, or keep it always visible
  // For now, we keep it visible as per original design, but maybe hide on login/register if desired?
  // The original design had BottomNav always visible but switching tabs. 
  // Let's keep it simple.

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="max-w-md mx-auto bg-[#f5f7fb] pb-24 min-h-screen text-slate-900">
        <Outlet context={{ isLoggedIn, balance, availableBalance, userId, setIsLoggedIn, setUserId }} />
      </div>

      <div className="max-w-md mx-auto w-full fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-none">
        <BottomNav />
      </div>
    </div>
  );
}
