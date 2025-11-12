// components/Invite.jsx
import React, { useState, useEffect } from "react";
import { ArrowLeft, Copy, X } from "lucide-react";
import { supabase } from "../supabaseClient";

export default function Invite({ setTab, userId, isLoggedIn }) {
  const [referralCode, setReferralCode] = useState("");
  const [downlineCount, setDownlineCount] = useState(0);
  const [downlineUsers, setDownlineUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

  // 复制邀请码
  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    alert("Invitation code copied!");
  };

  // 脱敏手机号：138****5678
  const maskPhone = (phone) => {
    if (!phone || phone.length < 8) return phone;
    return phone.slice(0, 3) + "****" + phone.slice(-4);
  };

  // 初次加载：邀请码 + 人数 + 下级列表
  useEffect(() => {
    if (!isLoggedIn || !userId) {
      setLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // 1. 获取我的邀请码
        const { data: userData, error: userErr } = await supabase
          .from("users")
          .select("referral_code")
          .eq("id", userId)
          .single();

        if (userErr) throw userErr;
        setReferralCode(userData.referral_code || "N/A");

        // 2. 获取下级人数 + 列表
        await fetchDownline();
      } catch (err) {
        console.error("Initial load error:", err);
        setReferralCode("Error");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [userId, isLoggedIn]);

  // 提取下级数据加载逻辑（供初次 + 实时更新使用）
  const fetchDownline = async () => {
    try {
      // 获取人数
      const { count } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("invited_by", userId);

      setDownlineCount(count || 0);

      // 获取详细列表
      const { data, error } = await supabase
        .from("users")
        .select("phone_number, created_at")
        .eq("invited_by", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDownlineUsers(data || []);
    } catch (err) {
      console.error("Fetch downline error:", err);
    }
  };

  // 实时订阅：有人通过你的邀请码注册
  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    const channel = supabase
      .channel(`invite-updates-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "users",
          filter: `invited_by=eq.${userId}`,
        },
        (payload) => {
          const newUser = payload.new;
          setDownlineCount((prev) => prev + 1);
          setDownlineUsers((prev) => [
            {
              phone_number: newUser.phone_number,
              created_at: newUser.created_at,
            },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isLoggedIn]);

  // 点击人数 → 显示 Modal + 加载最新列表
  const handleShowDownline = async () => {
    if (!userId || downlineCount === 0) return;

    setModalLoading(true);
    setShowModal(true);
    await fetchDownline(); // 确保最新数据
    setModalLoading(false);
  };

  return (
    <div className="px-4 pb-24 max-w-md mx-auto bg-[#f5f7fb] min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 py-3">
        <ArrowLeft
          className="h-5 w-5 text-slate-700 cursor-pointer"
          onClick={() => setTab("home")}
        />
        <h2 className="font-semibold text-slate-800 text-lg">Invite</h2>
      </div>

      {/* 下级人数统计 */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div
          className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm cursor-pointer hover:bg-slate-50 transition"
          onClick={handleShowDownline}
        >
          <div className="text-sm text-slate-600">Downline Users</div>
          <div className="text-2xl font-bold text-yellow-500">
            {loading ? "..." : downlineCount}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <div className="text-sm text-slate-600">Effective Users</div>
          <div className="text-2xl font-bold text-yellow-500">
            {loading ? "..." : downlineCount}
          </div>
        </div>
      </div>

      {/* 我的邀请码 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="text-sm text-slate-600 mb-1">My Invitation Code</div>
        <div className="flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2">
          <span className="text-lg font-mono text-slate-700 tracking-wider">
            {loading ? "Loading..." : referralCode}
          </span>
          <button
            onClick={copyCode}
            disabled={loading || !referralCode || referralCode === "N/A"}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 提示文字 */}
      <div className="mt-6 text-center text-xs text-slate-500">
        Share your code to invite friends and earn rewards!
      </div>

      {/* === 下级用户 Modal === */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800">
                Downline Users ({downlineCount})
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {modalLoading ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : downlineUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No downline users</div>
              ) : (
                <div className="space-y-3">
                  {downlineUsers.map((user, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                    >
                      <span className="font-mono text-slate-700">
                        {maskPhone(user.phone_number)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(user.created_at).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
