import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function PromptEditor() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // prompts: { nurse: { content, updatedAt }, crc: { ... } }
  const [prompts, setPrompts] = useState({ nurse: null, crc: null });
  const [edits, setEdits] = useState({ nurse: "", crc: "" });
  const [activeTab, setActiveTab] = useState("nurse");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    api.get("/prompts").then((res) => {
      const byRole = {};
      res.data.forEach((p) => { byRole[p.role] = p; });
      setPrompts(byRole);
      setEdits({
        nurse: byRole.nurse?.content || "",
        crc: byRole.crc?.content || "",
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const isDirty = edits[activeTab] !== (prompts[activeTab]?.content || "");

  const handleSave = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await api.put(`/prompts/${activeTab}`, { content: edits[activeTab] });
      setPrompts((prev) => ({ ...prev, [activeTab]: res.data }));
      setSaveMsg("Saved.");
    } catch (err) {
      setSaveMsg(err.response?.data?.error || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEdits((prev) => ({ ...prev, [activeTab]: prompts[activeTab]?.content || "" }));
    setSaveMsg("");
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setSaveMsg("");
  };

  const updatedAt = prompts[activeTab]?.updated_at;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-[#082f49] flex flex-col">
        <div className="p-4 border-b border-sky-900">
          <h1 className="text-white font-bold text-lg">Rondoc</h1>
          <p className="text-slate-400 text-xs mt-1">
            {user?.role?.toUpperCase()} · {user?.name}
          </p>
        </div>
        <div className="p-3 space-y-1">
          <button
            onClick={() => navigate("/chat")}
            className="w-full text-left text-slate-400 hover:text-white hover:bg-sky-900 rounded-lg px-3 py-2 text-sm transition"
          >
            ← Chat
          </button>
        </div>
        <div className="flex-1" />
        <div className="p-3 border-t border-sky-900">
          <button
            onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}
            className="w-full text-slate-400 text-sm hover:text-white transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-800">System Prompts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {updatedAt
              ? `Last updated ${new Date(updatedAt).toLocaleString()}`
              : "Manage role-specific AI instructions"}
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-slate-200 px-6 flex gap-4">
          {["nurse", "crc"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabSwitch(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab
                  ? "border-sky-600 text-sky-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab === "nurse" ? "Nurse" : "CRC"}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col px-6 py-6 overflow-hidden">
          {loading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : (
            <>
              <textarea
                value={edits[activeTab]}
                onChange={(e) => {
                  setEdits((prev) => ({ ...prev, [activeTab]: e.target.value }));
                  setSaveMsg("");
                }}
                className="flex-1 w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                spellCheck={false}
              />
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleSave}
                  disabled={!isDirty || saving}
                  className="px-5 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={handleReset}
                  disabled={!isDirty}
                  className="px-5 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reset
                </button>
                {saveMsg && (
                  <span className={`text-sm ${saveMsg === "Saved." ? "text-sky-600" : "text-red-500"}`}>
                    {saveMsg}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
