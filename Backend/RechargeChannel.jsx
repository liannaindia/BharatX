import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function RechargeChannel() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [newChannel, setNewChannel] = useState({
    currency_name: "",
    wallet_address: "",
    upi_id: "",         // 新增字段：UPI ID
    bank_name: "",      // 新增字段：银行名称
    bank_ac: "",        // 新增字段：银行账户
    bank_ifsc: "",      // 新增字段：银行IFSC
    status: "active",
  });
  const [editingChannel, setEditingChannel] = useState(null);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from("channels")
        .select("id, currency_name, wallet_address, upi_id, bank_name, bank_ac, bank_ifsc, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setChannels(data || []);
    } catch (error) {
      console.error("获取充值通道失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = async (e) => {
    e.preventDefault();
    if (!newChannel.currency_name || !newChannel.wallet_address) {
      alert("请输入币种名称和钱包地址！");
      return;
    }

    try {
      const { error } = await supabase.from("channels").insert([
        {
          currency_name: newChannel.currency_name,
          wallet_address: newChannel.wallet_address,
          upi_id: newChannel.upi_id,      // 插入 UPI ID
          bank_name: newChannel.bank_name, // 插入 银行名称
          bank_ac: newChannel.bank_ac,     // 插入 银行账户
          bank_ifsc: newChannel.bank_ifsc, // 插入 银行 IFSC
          status: newChannel.status,
        },
      ]);
      if (error) throw error;

      setNewChannel({ currency_name: "", wallet_address: "", upi_id: "", bank_name: "", bank_ac: "", bank_ifsc: "", status: "active" });
      setShowAddForm(false);
      fetchChannels();
    } catch (error) {
      alert("添加失败，请检查权限或网络。");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("确定要删除该通道吗？")) return;
    try {
      const { error } = await supabase.from("channels").delete().eq("id", id);
      if (error) throw error;
      fetchChannels();
    } catch (error) {
      alert("删除失败，请稍后重试。");
    }
  };

  const handleEditChannel = (channel) => {
    setEditingChannel(channel);
    setShowEditForm(true);
  };

  const handleUpdateChannel = async (e) => {
    e.preventDefault();
    if (!editingChannel.currency_name || !editingChannel.wallet_address) {
      alert("请输入币种名称和钱包地址！");
      return;
    }

    try {
      const { error } = await supabase
        .from("channels")
        .update({
          currency_name: editingChannel.currency_name,
          wallet_address: editingChannel.wallet_address,
          upi_id: editingChannel.upi_id,         // 更新 UPI ID
          bank_name: editingChannel.bank_name,    // 更新 银行名称
          bank_ac: editingChannel.bank_ac,       // 更新 银行账户
          bank_ifsc: editingChannel.bank_ifsc,   // 更新 银行 IFSC
          status: editingChannel.status,
        })
        .eq("id", editingChannel.id);
      if (error) throw error;

      setEditingChannel(null);
      setShowEditForm(false);
      fetchChannels();
    } catch (error) {
      alert("更新失败，请检查权限或网络。");
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-500">加载中...</div>;

  return (
    <div className="admin-card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">充值通道管理</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary text-sm"
          >
            {showAddForm ? "取消添加" : "添加通道"}
          </button>
          <button onClick={fetchChannels} className="btn-primary text-sm">
            刷新
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddChannel} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">币种名称</label>
            <input
              type="text"
              value={newChannel.currency_name}
              onChange={(e) =>
                setNewChannel({ ...newChannel, currency_name: e.target.value })
              }
              placeholder="如：USDT"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">钱包地址</label>
            <input
              type="text"
              value={newChannel.wallet_address}
              onChange={(e) =>
                setNewChannel({ ...newChannel, wallet_address: e.target.value })
              }
              placeholder="输入充值地址"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
            <input
              type="text"
              value={newChannel.upi_id}
              onChange={(e) =>
                setNewChannel({ ...newChannel, upi_id: e.target.value })
              }
              placeholder="输入UPI ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">银行名称</label>
            <input
              type="text"
              value={newChannel.bank_name}
              onChange={(e) =>
                setNewChannel({ ...newChannel, bank_name: e.target.value })
              }
              placeholder="输入银行名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">银行账户</label>
            <input
              type="text"
              value={newChannel.bank_ac}
              onChange={(e) =>
                setNewChannel({ ...newChannel, bank_ac: e.target.value })
              }
              placeholder="输入银行账户"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">银行IFSC</label>
            <input
              type="text"
              value={newChannel.bank_ifsc}
              onChange={(e) =>
                setNewChannel({ ...newChannel, bank_ifsc: e.target.value })
              }
              placeholder="输入银行IFSC"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={newChannel.status}
              onChange={(e) =>
                setNewChannel({ ...newChannel, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">启用</option>
              <option value="inactive">停用</option>
            </select>
          </div>
          <button type="submit" className="btn-primary">
            确认添加
          </button>
        </form>
      )}

      {showEditForm && editingChannel && (
        <form onSubmit={handleUpdateChannel} className="mb-6 p-4 bg-blue-50 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold">编辑通道</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">币种名称</label>
            <input
              type="text"
              value={editingChannel.currency_name}
              onChange={(e) =>
                setEditingChannel({ ...editingChannel, currency_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">钱包地址</label>
            <input
              type="text"
              value={editingChannel.wallet_address}
              onChange={(e) =>
                setEditingChannel({ ...editingChannel, wallet_address: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
            <input
              type="text"
              value={editingChannel.upi_id}
              onChange={(e) =>
                setEditingChannel({ ...editingChannel, upi_id: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">银行名称</label>
            <input
              type="text"
              value={editingChannel.bank_name}
              onChange={(e) =>
                setEditingChannel({ ...editingChannel, bank_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">银行账户</label>
            <input
              type="text"
              value={editingChannel.bank_ac}
              onChange={(e) =>
                setEditingChannel({ ...editingChannel, bank_ac: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">银行IFSC</label>
            <input
              type="text"
              value={editingChannel.bank_ifsc}
              onChange={(e) =>
                setEditingChannel({ ...editingChannel, bank_ifsc: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={editingChannel.status}
              onChange={(e) =>
                setEditingChannel({ ...editingChannel, status: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">启用</option>
              <option value="inactive">停用</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              更新
            </button>
            <button
              type="button"
              onClick={() => setShowEditForm(false)}
              className="btn-danger"
            >
              取消
            </button>
          </div>
        </form>
      )}

      <div className="overflow-auto max-h-[80vh]">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-table th">币种名称</th>
              <th className="admin-table th">充值地址</th>
              <th className="admin-table th">UPI ID</th>
              <th className="admin-table th">银行名称</th>
              <th className="admin-table th">银行账户</th>
              <th className="admin-table th">银行IFSC</th>
              <th className="admin-table th">状态</th>
              <th className="admin-table th">操作</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((ch) => (
              <tr key={ch.id} className="hover:bg-gray-50 transition">
                <td className="admin-table td">{ch.currency_name}</td>
                <td className="admin-table td font-mono text-xs text-gray-700 break-all">
                  {ch.wallet_address}
                </td>
                <td className="admin-table td">{ch.upi_id}</td>
                <td className="admin-table td">{ch.bank_name}</td>
                <td className="admin-table td">{ch.bank_ac}</td>
                <td className="admin-table td">{ch.bank_ifsc}</td>
                <td className="admin-table td">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      ch.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {ch.status === "active" ? "启用" : "停用"}
                  </span>
                </td>
                <td className="admin-table td space-x-2">
                  <button
                    onClick={() => handleEditChannel(ch)}
                    className="btn-primary text-xs"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(ch.id)}
                    className="btn-danger text-xs"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {channels.length === 0 && (
              <tr>
                <td colSpan="8" className="py-6 text-center text-gray-400">
                  暂无充值通道，请添加新的虚拟币。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
