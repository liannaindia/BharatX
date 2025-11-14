import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { ArrowLeft, CheckCircle, Copy, AlertCircle } from "lucide-react";

export default function Recharge({ setTab, isLoggedIn, userId }) {
  const [amount, setAmount] = useState("");
  const [txId, setTxId] = useState(""); // 交易哈希
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("usdt"); // 初始化 activeTab，控制显示的充值通道

  const quickAmounts = [10, 50, 100, 500];

  // 读取可用通道
  useEffect(() => {
    const fetchChannels = async () => {
      setFetching(true);
      try {
        const { data, error } = await supabase
          .from("channels")
          .select("id, currency_name, wallet_address, upi_id, bank_name, bank_ac, bank_ifsc")
          .eq("status", "active")
          .order("id");

        if (error) throw error;
        setChannels(data ?? []);
      } catch (err) {
        console.error("Load channels error:", err);
        setError("Failed to load payment channels.");
      } finally {
        setFetching(false);
      }
    };
    fetchChannels();
  }, []);

  // 复制到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  // 提交充值请求
  const handleSubmit = async () => {
    if (!isLoggedIn || !userId) {
      alert("Please log in first.");
      setTab("login");
      return;
    }

    if (!selectedChannel) {
      setError("Please select a network.");
      return;
    }

    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num < 1) {
      setError("Minimum recharge is 1 USDT.");
      return;
    }

    if (!txId || txId.trim() === "") {
      setError("Please enter the transaction hash (tx_id).");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.from("recharges").insert({
        user_id: userId,
        channel_id: selectedChannel.id,
        amount: num,
        status: "pending",
        tx_id: txId.trim(), // 写入 tx_id
      });

      if (error) throw error;

      alert("Recharge request submitted successfully! Awaiting confirmation.");
      setAmount("");
      setTxId("");
      setSelectedChannel(null);
    } catch (err) {
      console.error("Recharge submit error:", err);
      setError("Submission failed. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  // 未登录提示
  if (!isLoggedIn) {
    return (
      <div style={{ padding: "24px", textAlign: "center" }}>
        <div
          style={{
            backgroundColor: "#fed7aa",
            color: "#c2410c",
            padding: "16px",
            borderRadius: "12px",
            fontSize: "14px",
          }}
        >
          Please log in to recharge
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "16px",
        paddingBottom: "96px",
        maxWidth: "448px",
        margin: "0 auto",
        background: "linear-gradient(to bottom, #fff7ed, #ffffff)",
        minHeight: "100vh",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 0",
          position: "sticky",
          top: 0,
          background: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          zIndex: 10,
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <ArrowLeft
          style={{ width: "24px", height: "24px", color: "#ea580c", cursor: "pointer" }}
          onClick={() => setTab("home")}
        />
        <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#7c2d12" }}>
          Recharge USDT
        </h2>
      </div>

      {/* Network Switcher */}
      <div style={{ marginTop: "12px", display: "flex", justifyContent: "center" }}>
        <button
          onClick={() => setActiveTab("usdt")}
          style={{
            padding: "10px 20px",
            margin: "0 5px",
            backgroundColor: activeTab === "usdt" ? "#f97316" : "#e5e7eb",
            borderRadius: "12px",
            cursor: "pointer",
          }}
        >
          USDT
        </button>
        <button
          onClick={() => setActiveTab("upi")}
          style={{
            padding: "10px 20px",
            margin: "0 5px",
            backgroundColor: activeTab === "upi" ? "#f97316" : "#e5e7eb",
            borderRadius: "12px",
            cursor: "pointer",
          }}
        >
          UPI
        </button>
        <button
          onClick={() => setActiveTab("bank")}
          style={{
            padding: "10px 20px",
            margin: "0 5px",
            backgroundColor: activeTab === "bank" ? "#f97316" : "#e5e7eb",
            borderRadius: "12px",
            cursor: "pointer",
          }}
        >
          Bank
        </button>
      </div>

      {/* Channels */}
      <div style={{ marginTop: "12px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
          <span style={{ color: "#ea580c" }}>Select Network</span>
        </h3>

        {fetching ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#6b7280" }}>Loading...</div>
        ) : channels.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#6b7280" }}>No active channels</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
            {channels
              .filter((ch) =>
                activeTab === "usdt" ? ch.currency_name.includes("USDT") :
                activeTab === "upi" ? ch.currency_name.includes("UPI") :
                activeTab === "bank" ? ch.currency_name.includes("BANK") : false
              )
              .map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch)}
                  style={{
                    position: "relative",
                    background: "white",
                    borderRadius: "16px",
                    padding: "16px",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    border: selectedChannel?.id === ch.id ? "2px solid #f97316" : "2px solid #e5e7eb",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    transform: selectedChannel?.id === ch.id ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          background: "linear-gradient(to bottom right, #f97316, #ec4899)",
                          borderRadius: "12px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "bold",
                          fontSize: "18px",
                        }}
                      >
                        {ch.currency_name.includes("TRC20") ? "T" : "E"}
                      </div>
                      <div>
                        <div style={{ fontWeight: "bold", color: "#1f2937" }}>{ch.currency_name}</div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "160px",
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(ch.wallet_address);
                          }}
                        >
                          {ch.wallet_address}
                          <Copy style={{ width: "14px", height: "14px", marginLeft: "4px", display: "inline" }} />
                        </div>
                      </div>
                    </div>
                    {selectedChannel?.id === ch.id && (
                      <CheckCircle style={{ width: "24px", height: "24px", color: "#ea580c" }} />
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Other content and buttons... */}
    </div>
  );
}
