import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function relativeTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function greeting(name) {
  const h = new Date().getHours();
  const time = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return `Good ${time}, ${name}`;
}

const QUICK_ACTIONS = {
  nurse: [
    { icon: "💊", label: "Medication Query", prompt: "What is the recommended dose and administration for " },
    { icon: "🩺", label: "Nursing Procedure", prompt: "Walk me through the procedure for " },
    { icon: "⚠️", label: "Drug Interaction Check", prompt: "Check for drug interactions between " },
  ],
  crc: [
    { icon: "📋", label: "Protocol Question", prompt: "Help me interpret this protocol section: " },
    { icon: "📝", label: "AE Reporting", prompt: "What are the reporting requirements for an adverse event involving " },
    { icon: "✅", label: "Eligibility Check", prompt: "Review eligibility criteria for a patient with " },
  ],
};

function NewsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse flex gap-3">
          <div className="w-20 h-20 rounded-lg bg-slate-700 flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 bg-slate-700 rounded w-full" />
            <div className="h-3 bg-slate-700 rounded w-5/6" />
            <div className="h-3 bg-slate-700 rounded w-2/3" />
            <div className="h-2.5 bg-slate-700 rounded w-1/3 mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NewsCard({ item }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-sky-700 rounded-xl p-3.5 transition group"
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
        {item.image ? (
          <img
            src={item.image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.classList.add("flex", "items-center", "justify-center");
              e.target.parentElement.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="#475569" strokeWidth="1.5"/><path d="M3 15l5-5 4 4 3-3 4 4" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/></svg>`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" stroke="#475569" strokeWidth="1.5" />
              <path d="M3 15l5-5 4 4 3-3 4 4" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200 group-hover:text-white leading-snug line-clamp-2 mb-1">
          {item.title}
        </p>
        {item.summary && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-2">
            {item.summary}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {item.isLive ? (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-900/60 text-emerald-400 border border-emerald-800 uppercase tracking-wide">
              Live
            </span>
          ) : (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400 border border-slate-600 uppercase tracking-wide">
              Ref
            </span>
          )}
          <span className="text-[11px] text-slate-500 truncate">{item.source}</span>
          {item.publishedAt && (
            <>
              <span className="text-slate-700 text-[10px]">·</span>
              <span className="text-[11px] text-slate-500">{relativeTime(item.publishedAt)}</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/chat", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    setMounted(true);
    api.get("/chat/conversations").then((res) => setConversations(res.data.slice(0, 5))).catch(() => {});
    api.get("/news").then((res) => setNews(res.data)).catch(() => {}).finally(() => setNewsLoading(false));
  }, []);

  if (user?.role === "admin") return null;

  return (
    <div
      className="flex h-screen bg-[#0f172a] text-white overflow-hidden"
      style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.4s ease" }}
    >
      {/* ── Sidebar ── */}
      <div className="w-64 bg-[#082f49] flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="p-4 border-b border-sky-900">
          <h1 className="text-white font-bold text-lg">Rondoc</h1>
          <p className="text-slate-400 text-xs mt-1">
            {user?.role?.toUpperCase()} · {user?.name}
          </p>
        </div>

        {/* New Conversation */}
        <div className="p-3">
          <button
            onClick={() => navigate("/chat")}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2 text-sm font-medium transition"
          >
            + New Conversation
          </button>
        </div>

        {/* Recent conversations */}
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1 mb-2">
            Recent
          </p>
          <div className="space-y-0.5">
            {conversations.length === 0 ? (
              <p className="text-slate-600 text-xs px-2 py-1">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => navigate("/chat", { state: { convId: conv.id } })}
                  className="w-full text-left group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-sky-900 transition"
                >
                  <span className="flex-1 text-sm text-slate-400 group-hover:text-white truncate">
                    {conv.title}
                  </span>
                </button>
              ))
            )}
          </div>
          {conversations.length > 0 && (
            <button
              onClick={() => navigate("/chat")}
              className="w-full text-left text-xs text-slate-500 hover:text-sky-400 px-2 py-2 mt-1 transition"
            >
              View all →
            </button>
          )}
        </div>

        {/* Sign out */}
        <div className="p-3 border-t border-sky-900">
          <button
            onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
            className="w-full text-slate-400 text-sm hover:text-white transition text-left px-2"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Welcome header */}
        <div className="px-8 pt-7 pb-5 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-2xl font-bold text-white">{greeting(user?.name || "")}</h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-900 text-sky-300 border border-sky-700">
              {user?.role?.toUpperCase()}
            </span>
          </div>
          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            {(QUICK_ACTIONS[user?.role] || []).map(({ icon, label, prompt }) => (
              <button
                key={label}
                onClick={() => navigate("/chat", { state: { prompt } })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-sky-600 rounded-xl text-sm text-slate-300 hover:text-white transition"
              >
                <span>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* News feed */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Latest Clinical Updates
          </h2>

          {newsLoading ? (
            <NewsSkeleton />
          ) : news.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
              <p className="text-slate-500 text-sm">Unable to load latest updates.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {news.map((item, i) => (
                <NewsCard key={i} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
