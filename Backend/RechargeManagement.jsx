import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function RechargeManagement() {
  const [recharges, setRecharges] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchRecharges();
  }, [currentPage]);

  const fetchRecharges = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("recharges")
        .select(
          `
          id, user_id, amount, channel_id, status, created_at,
          users (phone_number),
          channels (currency_name)
        `,
          { count: "exact" }
        )
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = data.map((r) => ({
        ...r,
        phone_number: r.users?.phone_number || "未知",
        currency_name: r.channels?.currency_name || "未知通道",
        created_at: formatChinaTime(r.created_at),
      }));

      setRecharges({ data: formatted, total: count || 0 });
    } catch (error) {
      console.error("获取充值记录失败:", error);
      alert("加载失败，请刷新重试。");
    } finally {
      setLoading(false);
    }
  };

  const formatChinaTime = (utcTime) => {
    const date = new Date(utcTime);
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Shanghai",
    }).format(date);
  };

  const handleApprove = async (id, user_id, amount) => {
    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error("金额无效");

      const { error: statusError } = await supabase
        .from("recharges")
        .update({ status: "approved" })
        .eq("id", id);
      if (statusError) throw statusError;

      const { error: balanceError } = await supabase
        .rpc("increment_balance", { user_id, amount: parsedAmount });
      if (balanceError) throw balanceError;

      alert("充值已批准！");
      fetchRecharges();
    } catch (error) {
      alert("操作失败: " + error.message);
    }
  };

  const handleReject = async (id) => {
    try {
      const { error } = await supabase
        .from("recharges")
        .update({ status: "rejected" })
        .eq("id", id);
      if (error) throw error;
      alert("充值已拒绝！");
      fetchRecharges();
    } catch (error) {
      alert("操作失败: " + error.message);
    }
  };

  const totalPages = Math.ceil(recharges.total / pageSize);

  if (loading) return <div className="p-6 text-center text-gray-500">加载中...</div>;

  return (
    <div className="admin-card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">充值管理</h2>
        <button onClick={fetchRecharges} className="btn-primary text-sm">
          刷新
        </button>
      </div>

      <div className="overflow-auto max-h-[80vh]">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-table th">手机号</th>
              <th className="admin-table th">金额</th>
              <th className="admin-table th">通道</th>
              <th className="admin-table th">时间</th>
              <th className="admin-table th">状态</th>
              <th className="admin-table th">操作</th>
            </tr>
          </thead>
          <tbody>
            {recharges.data.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  暂无充值记录
                </td>
              </tr>
            ) : (
              recharges.data.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="admin-table td font-medium text-blue-600">
                    {r.phone_number}
                  </td>
                  <td className="admin-table td text-green-600 font-semibold">
                    ${r.amount}
                  </td>
                  <td className="admin-table td">{r.currency_name}</td>
                  <td className="admin-table td text-gray-500">{r.created_at}</td>
                  <td className="admin-table td">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : r.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {r.status === "pending"
                        ? "待审批"
                        : r.status === "approved"
                        ? "已批准"
                        : "已拒绝"}
                    </span>
                  </td>
                  <td className="admin-table td space-x-2">
                    {r.status === "pending" ? (
                      <>
                        <button
                          onClick={() => handleApprove(r.id, r.user_id, r.amount)}
                          className="btn-primary text-xs"
                        >
                          批准
                        </button>
                        <button
                          onClick={() => handleReject(r.id)}
                          className="btn-danger text-xs"
                        >
                          拒绝
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-500 text-xs">已完成</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {recharges.total > pageSize && (
        <div className="flex justify-center items-center gap-4 p-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn-primary text-sm disabled:opacity-50"
          >
            上一页
          </button>
          <span className="text-sm text-gray-600">
            第 {currentPage} / {totalPages} 页 (共 {recharges.total} 条)
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn-primary text-sm disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
