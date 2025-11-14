// components/Recharge.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { ArrowLeft, Shield, Zap, CheckCircle, Copy, AlertCircle } from "lucide-react";

export default function Recharge({ setTab, isLoggedIn, userId }) {
  const [amount, setAmount] = useState("");
  const [txId, setTxId] = useState(""); // 交易哈希
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  // ✅ 新增：当前选择的充值方式（USDT / UPI / BANK）
  const [activeMethod, setActiveMethod] = useState("USDT");

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

  // ✅ 切换方式时，清空已选通道
  useEffect(() => {
    setSelectedChannel(null);
  }, [activeMethod]);

  // 复制到剪贴板
  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    });
  };

  // ✅ 按方式过滤通道
  const filteredChannels = channels.filter((ch) => {
    if (!ch.currency_name) return false;
    const name = ch.currency_name.toUpperCase();

    if (activeMethod === "USDT") {
      // 包含 USDT / TRC20 / ERC20 等
      return name.includes("USDT");
    }
    if (activeMethod === "UPI") {
      return name.includes("UPI");
    }
    if (activeMethod === "BANK") {
      return name.includes("BANK") || name.includes("ACCOUNT");
    }
    return true;
  });

  // 提交充值请求
  const handleSubmit = async () => {
    // 登录校验
    if (!isLoggedIn || !userId) {
      alert("Please log in first.");
      setTab("login");
      return;
    }

    // 通道校验
    if (!selectedChannel) {
      setError("Please select a network.");
      return;
    }

    // 金额校验
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num < 1) {
      setError("Minimum recharge is 1 USDT.");
      return;
    }

    // tx_id 非空校验（不校验格式）
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
      // 重置表单
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

      {/* Trust Badges */}
      <div style={{ display: "flex", justifyContent: "center", gap: "16px", margin: "16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#16a34a", fontSize: "12px", fontWeight: "500" }}>
          <Shield style={{ width: "16px", height: "16px" }} /> 100% Safe
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#16a34a", fontSize: "12px", fontWeight: "500" }}>
          <Zap style={{ width: "16px", height: "16px" }} /> Instant Arrival
        </div>
      </div>

      {/* Channels */}
      <div style={{ marginTop: "12px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
          <span style={{ color: "#ea580c" }}>Select Payment Method</span>
        </h3>

        {/* ✅ 新增：方式切换按钮 */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginTop: "8px",
            marginBottom: "8px",
          }}
        >
          {["USDT", "UPI", "BANK"].map((method) => {
            const isActive = activeMethod === method;
            return (
              <button
                key={method}
                onClick={() => setActiveMethod(method)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  borderRadius: "999px",
                  border: isActive ? "2px solid #f97316" : "1px solid #e5e7eb",
                  background: isActive ? "linear-gradient(to right, #f97316, #ec4899)" : "#ffffff",
                  color: isActive ? "#ffffff" : "#374151",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 8px 16px rgba(0,0,0,0.12)" : "none",
                  transition: "all 0.2s",
                }}
              >
                {method === "USDT" && "USDT"}
                {method === "UPI" && "UPI"}
                {method === "BANK" && "Bank Account"}
              </button>
            );
          })}
        </div>

        {fetching ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#6b7280" }}>Loading...</div>
        ) : filteredChannels.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#6b7280" }}>
            No active channels for {activeMethod}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
            {filteredChannels.map((ch) => (
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
                      {ch.currency_name && ch.currency_name.includes("TRC20")
                        ? "T"
                        : ch.currency_name && ch.currency_name.includes("ERC20")
                        ? "E"
                        : ch.currency_name && ch.currency_name.toUpperCase().includes("UPI")
                        ? "U"
                        : ch.currency_name && ch.currency_name.toUpperCase().includes("BANK")
                        ? "B"
                        : "P"}
                    </div>
                    <div>
                      <div style={{ fontWeight: "bold", color: "#1f2937" }}>{ch.currency_name}</div>

                      {/* 原有钱包地址（仅在有值时显示） */}
                      {ch.wallet_address && (
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
                          <Copy
                            style={{
                              width: "14px",
                              height: "14px",
                              marginLeft: "4px",
                              display: "inline",
                            }}
                          />
                        </div>
                      )}

                      {/* ✅ UPI 通道显示 */}
                      {ch.currency_name &&
                        ch.currency_name.toUpperCase().includes("UPI") && (
                          <div style={{ marginTop: "8px", fontSize: "13px", color: "#6b7280" }}>
                            <div>
                              <strong style={{ color: "#1f2937" }}>UPI ID:</strong>{" "}
                              {ch.upi_id || "N/A"}
                            </div>
                            <div
                              style={{ cursor: "pointer", color: "#f97316", marginTop: "4px" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(ch.upi_id);
                              }}
                            >
                              Copy UPI ID
                            </div>
                          </div>
                        )}

                      {/* ✅ 银行卡通道显示 */}
                      {ch.currency_name &&
                        (ch.currency_name.toUpperCase().includes("BANK") ||
                          ch.currency_name.toUpperCase().includes("ACCOUNT")) && (
                          <div style={{ marginTop: "8px", fontSize: "13px", color: "#6b7280" }}>
                            <div>
                              <strong style={{ color: "#1f2937" }}>Account Name:</strong>{" "}
                              {ch.bank_name || "N/A"}
                            </div>
                            <div>
                              <strong style={{ color: "#1f2937" }}>AC Number:</strong>{" "}
                              {ch.bank_ac || "N/A"}
                            </div>
                            <div>
                              <strong style={{ color: "#1f2937" }}>IFSC:</strong>{" "}
                              {ch.bank_ifsc || "N/A"}
                            </div>
                            <div
                              style={{ cursor: "pointer", color: "#f97316", marginTop: "4px" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(
                                  `NAME: ${ch.bank_name}\nAC: ${ch.bank_ac}\nIFSC: ${ch.bank_ifsc}`
                                );
                              }}
                            >
                              Copy Bank Info
                            </div>
                          </div>
                        )}
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

      {/* Quick Amounts */}
      <div style={{ marginTop: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
          Quick Amount
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              onClick={() => setAmount(amt)}
              style={{
                background: "linear-gradient(to right, #f97316, #ec4899)",
                color: "white",
                fontWeight: "bold",
                padding: "12px 0",
                borderRadius: "12px",
                fontSize: "14px",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
            >
              {amt} USDT
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div
        style={{
          marginTop: "20px",
          background: "white",
          borderRadius: "16px",
          padding: "16px",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div style={{ fontSize: "14px", color: "#4b5563", marginBottom: "8px" }}>Enter Amount</div>
        <div style={{ position: "relative" }}>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 60px 12px 12px",
              border: "2px solid #fdba74",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: "bold",
              color: "#ea580c",
              outline: "none",
            }}
            placeholder="1.00"
            min="1"
            step="0.01"
          />
          <div
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#ea580c",
              fontWeight: "bold",
              fontSize: "18px",
            }}
          >
            USDT
          </div>
        </div>
        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", textAlign: "right" }}>
          Min: 1 USDT
        </div>
      </div>

      {/* Transaction Hash (tx_id) */}
      <div
        style={{
          marginTop: "20px",
          background: "white",
          borderRadius: "16px",
          padding: "16px",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "14px",
            color: "#4b5563",
            marginBottom: "8px",
          }}
        >
          <AlertCircle style={{ width: "16px", height: "16px", color: "#ea580c" }} />
          Transaction Hash (tx_id)
        </div>
        <input
          type="text"
          value={txId}
          onChange={(e) => setTxId(e.target.value)}
          placeholder="Paste transaction hash here"
          style={{
            width: "100%",
            padding: "12px",
            border: "2px solid #fdba74",
            borderRadius: "12px",
            fontSize: "14px",
            color: "#1f2937",
            outline: "none",
          }}
        />
        <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
          After payment, copy the transaction hash from your wallet and paste it here.
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            marginTop: "12px",
            backgroundColor: "#fee2e2",
            border: '1px solid #fca5a5',
            color: "#dc2626",
            padding: "12px",
            borderRadius: "12px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* Reminder */}
      <div
        style={{
          marginTop: "16px",
          background: "linear-gradient(to right, #f0fdf4, #ecfdf5)",
          border: "1px solid #86efac",
          borderRadius: "16px",
          padding: "16px",
          fontSize: "12px",
        }}
      >
        <strong style={{ color: "#166534" }}>Important:</strong>
        <br />
        After payment, funds arrive in <strong>30 seconds</strong>. If delayed, refresh or contact
        support.
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !selectedChannel || !amount || !txId.trim() || fetching}
        style={{
          marginTop: "24px",
          width: "100%",
          padding: "16px 0",
          borderRadius: "16px",
          fontWeight: "bold",
          fontSize: "18px",
          boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
          transition: "all 0.3s",
          cursor:
            loading || !selectedChannel || !amount || !txId.trim() || fetching
              ? "not-allowed"
              : "pointer",
          background:
            loading || !selectedChannel || !amount || !txId.trim() || fetching
              ? "#d1d5db"
              : "linear-gradient(to right, #f97316, #ec4899)",
          color:
            loading || !selectedChannel || !amount || !txId.trim() || fetching
              ? "#6b7280"
              : "white",
          opacity: loading || !selectedChannel || !amount || !txId.trim() || fetching ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!(loading || !selectedChannel || !amount || !txId.trim() || fetching)) {
            e.target.style.transform = "scale(1.02)";
          }
        }}
        onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
      >
        {loading ? "Submitting..." : "Submit Recharge"}
      </button>
    </div>
  );
}
