import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MessageBubble from "../components/MessageBubble";
import api from "../api/axios";

export default function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingConvId, setEditingConvId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const messagesEndRef = useRef(null);

  // 页面加载时获取所有对话
  useEffect(() => {
    fetchConversations();
  }, []);

  // 消息更新时自动滚到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/chat/conversations");
      setConversations(res.data);
      if (res.data.length > 0) {
        selectConversation(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectConversation = async (convId) => {
    setCurrentConvId(convId);
    try {
      const res = await api.get(`/chat/conversations/${convId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createNewConversation = async () => {
    const emptyConv = conversations.find(
      (conv) => conv.title === "New Conversation",
    );
    if (emptyConv) {
      selectConversation(emptyConv.id);
      return;
    }

    try {
      const res = await api.post("/chat/conversations", {
        title: "New Conversation",
      });
      setConversations((prev) => [res.data, ...prev]);
      setCurrentConvId(res.data.id);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || !currentConvId) return;

    if (messages.length === 0) {
      const title = input.slice(0, 40) + (input.length > 40 ? "..." : "");
      try {
        await api.patch(`/chat/conversations/${currentConvId}`, { title });
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === currentConvId ? { ...conv, title } : conv,
          ),
        );
      } catch (err) {
        console.error(err);
      }
    }

    const userMessage = {
      role: "user",
      content: input,
      tempId: `temp-user-${Date.now()}`,
    };
    setMessages((prev) => [...prev, userMessage]);
    const contentToSend = input;
    setInput("");
    setIsStreaming(true);

    // 先加一条空的 AI 消息
    const aiTempId = `temp-ai-${Date.now()}`;
    const aiMessage = {
      role: "assistant",
      content: "",
      tempId: aiTempId,
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      const token = localStorage.getItem("token");
      const baseURL =
        import.meta.env.VITE_API_URL || "http://localhost:3001/api";
      const response = await fetch(`${baseURL}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversationId: currentConvId,
          content: contentToSend,
        }),
      });

      //检查 response.body 是否存在
      if (!response.body) {
        console.error("Streaming not supported");
        setIsStreaming(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let finished = false;
      while (!finished) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk
          .split("\n")
          .filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.replace("data: ", ""));

            if (data.done) {
              finished = true;
              setIsStreaming(false);
              if (data.messageId) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.tempId === aiTempId ? { ...m, id: data.messageId } : m,
                  ),
                );
              }
              break;
            }

            if (data.text) {
              setMessages((prev) => {
                const updated = [...prev];
                //用tempId而不是lastIndex更精确定位
                const idx = updated.findIndex((m) => m.tempId === aiTempId);
                if (idx === -1) return prev;

                updated[idx] = {
                  ...updated[idx],
                  content: (updated[idx].content || "") + data.text,
                };
                return updated;
              });
            }
          } catch (parseErr) {
            console.error("Parse error:", parseErr);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setIsStreaming(false);
    }
  };

  const deleteConversation = async (convId) => {
    try {
      await api.delete(`/chat/conversations/${convId}`);

      setConversations((prev) => {
        const remaining = prev.filter((conv) => conv.id !== convId);
        if (convId === currentConvId) {
          if (remaining.length > 0) {
            selectConversation(remaining[0].id);
          } else {
            setCurrentConvId(null);
            setMessages([]);
          }
        }
        return remaining;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const startEditTitle = (conv) => {
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
  };
  const saveTitle = async (convId) => {
    if (!editingTitle.trim()) return;
    try {
      await api.patch(`/chat/conversations/${convId}`, { title: editingTitle });
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === convId ? { ...conv, title: editingTitle } : conv,
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setEditingConvId(null);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* 左边：对话列表 Sidebar */}
      <div className="w-64 bg-slate-900 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-white font-bold text-lg">CareChat</h1>
          <p className="text-slate-400 text-xs mt-1">
            {user?.role?.toUpperCase()} ·{user?.name}
          </p>
        </div>
        <div className="p-3">
          <button
            onClick={createNewConversation}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700 transition"
          >
            + New Conversation
          </button>
          <button
            onClick={() => navigate("/documents")}
            className="w-full text-left text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg px-3 py-2 text-sm transition mt-1"
          >
            Knowledge Base
          </button>
          {user?.role === "admin" && (
            <button
              onClick={() => navigate("/prompt")}
              className="w-full text-left text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg px-3 py-2 text-sm transition mt-1"
            >
              System Prompt
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 transition ${
                currentConvId === conv.id
                  ? "bg-slate-700"
                  : "hover:bg-slate-800"
              }`}
            >
              {editingConvId === conv.id ? (
                // 编辑模式：显示输入框
                <input
                  autoFocus
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => saveTitle(conv.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle(conv.id);
                    if (e.key === "Escape") setEditingConvId(null);
                  }}
                  className="flex-1 bg-slate-600 text-white text-sm rounded px-2 py-0.5 outline-none"
                />
              ) : (
                // 正常模式：显示标题
                <button
                  onClick={() => selectConversation(conv.id)}
                  className={`flex-1 text-left text-sm truncate ${
                    currentConvId === conv.id
                      ? "text-white"
                      : "text-slate-400 group-hover:text-white"
                  }`}
                >
                  {conv.title}
                </button>
              )}

              {editingConvId !== conv.id && (
                <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => startEditTitle(conv)}
                    className="text-slate-500 hover:text-blue-400 text-xs mr-1"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteConversation(conv.id)}
                    className="text-slate-500 hover:text-red-400 text-xs"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-700">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="w-full text-slate-400 text-sm hover:text-white transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* 右边：对话区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部标题栏 */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-800">
            {user?.role === "nurse"
              ? "🏥 Nursing Assistant"
              : "🔬Clinical Research Assistant"}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.role === "nurse"
              ? "Medication queries, nursing procedures, clinical questions"
              : "Protocol interpretation, IRB processes, adverse event reporting"}
          </p>
        </div>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-slate-400 text-lg mb-2">
                  {user?.role === "nurse" ? "🏥" : "🔬"}
                </p>
                <p className="text-slate-500 font-medium">
                  How can I help you today?
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {user?.role === "nurse"
                    ? "Ask about medications, procedures, or clinical guidelines"
                    : "Ask about protocols, IRB processes, or eligibility criteria"}
                </p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg.id || msg.tempId} message={msg} />
          ))}
          {isStreaming && (
            <div className="flex justify-start mb-4">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* 底部输入框 */}
        <div className="bg-white border-t border-slate-200 px-6 py-4">
          <div className="flex space-x-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                user?.role === "nurse"
                  ? "Ask about medications, procedures..."
                  : "Ask about protocols, IRB, adverse events..."
              }
              rows={2}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            ></textarea>

            <button
              onClick={sendMessage}
              disabled={isStreaming || !input.trim()}
              className="bg-blue-600 text-white px-5 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {" "}
              Send
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
