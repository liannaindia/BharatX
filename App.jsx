import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"; // 添加的 import
import HomePage from "./components/Home.jsx";
import MarketsPage from "./components/Markets.jsx";
import TradePage from "./components/Trade.jsx";
import PositionsPage from "./components/Positions.jsx";
import MePage from "./components/Me.jsx";
import RechargePage from "./components/Recharge.jsx";
import WithdrawPage from "./components/Withdraw.jsx";
import InvitePage from "./components/Invite.jsx";
import LoginPage from "./components/Login.jsx";
import RegisterPage from "./components/Register.jsx";
import FollowOrderPage from "./components/FollowOrder.jsx";
import BottomNav from "./BottomNav";
import TransactionsPage from "./components/Transactions.jsx";
import { supabase } from "./supabaseClient";

export default function App() {
  const [tab, setTab] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [userId, setUserId] = useState(null);

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

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage setTab={setTab} setIsLoggedIn={setIsLoggedIn} setUserId={setUserId} />} />
        <Route path="/register" element={<RegisterPage setTab={setTab} setIsLoggedIn={setIsLoggedIn} setUserId={setUserId} />} />
        <Route path="/home" element={<HomePage setTab={setTab} isLoggedIn={isLoggedIn} balance={balance} />} />
        <Route path="/markets" element={<MarketsPage setTab={setTab} />} />
        <Route path="/trade" element={<TradePage setTab={setTab} isLoggedIn={isLoggedIn} balance={balance} availableBalance={availableBalance} userId={userId} />} />
        <Route path="/positions" element={<PositionsPage setTab={setTab} isLoggedIn={isLoggedIn} balance={balance} availableBalance={availableBalance} userId={userId} />} />
        <Route path="/me" element={<MePage setTab={setTab} balance={balance} availableBalance={availableBalance} isLoggedIn={isLoggedIn} userId={userId} setIsLoggedIn={setIsLoggedIn} setUserId={setUserId} />} />
        <Route path="/transactions" element={<TransactionsPage setTab={setTab} userId={userId} isLoggedIn={isLoggedIn} />} />
        <Route path="/followorder" element={<FollowOrderPage setTab={setTab} userId={userId} isLoggedIn={isLoggedIn} />} />
        <Route path="/recharge" element={<RechargePage setTab={setTab} balance={balance} isLoggedIn={isLoggedIn} userId={userId} />} />
        <Route path="/withdraw" element={<WithdrawPage setTab={setTab} balance={balance} availableBalance={availableBalance} isLoggedIn={isLoggedIn} userId={userId} />} />
        <Route path="/invite" element={<InvitePage setTab={setTab} userId={userId} isLoggedIn={isLoggedIn} />} />
        {/* Default route */}
        <Route path="/" element={<HomePage setTab={setTab} isLoggedIn={isLoggedIn} balance={balance} />} />
      </Routes>
    </Router>
  );
}
