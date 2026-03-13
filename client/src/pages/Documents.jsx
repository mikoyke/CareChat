import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Documents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [deletingSource, setDeletingSource] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get("/documents");
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploadSuccess("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadSuccess(
        `"${file.name}" uploaded — ${res.data.chunks} chunks processed.`,
      );
      await fetchDocuments();
    } catch (err) {
      setUploadError(err.response?.data?.error || "Upload failed.");
    } finally {
      setUploading(false);
      // reset input so the same file can be re-uploaded after deletion
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (source) => {
    if (!window.confirm(`Delete "${source}" and all its chunks?`)) return;
    setDeletingSource(source);
    try {
      await api.delete(`/documents?source=${encodeURIComponent(source)}`);
      setDocuments((prev) => prev.filter((d) => d.source !== source));
      setUploadSuccess("");
      setUploadError("");
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingSource(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-white font-bold text-lg">CareChat</h1>
          <p className="text-slate-400 text-xs mt-1">
            {user?.role?.toUpperCase()} · {user?.name}
          </p>
        </div>

        <div className="p-3 space-y-1">
          <button
            onClick={() => navigate("/chat")}
            className="w-full text-left text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg px-3 py-2 text-sm transition"
          >
            ← Chat
          </button>
        </div>

        <div className="flex-1" />

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

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <h2 className="font-semibold text-slate-800">Knowledge Base</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Documents available to all{" "}
            <span className="font-medium uppercase">{user?.role}</span> users
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Upload area */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Upload Document
            </h3>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    uploading
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  }`}
                >
                  {uploading ? "Uploading…" : "Choose file"}
                </span>
              </label>
              <span className="text-xs text-slate-400">PDF or TXT, max 10 MB</span>
            </div>

            {uploadSuccess && (
              <p className="mt-3 text-sm text-green-600">{uploadSuccess}</p>
            )}
            {uploadError && (
              <p className="mt-3 text-sm text-red-500">{uploadError}</p>
            )}
          </div>

          {/* Document list */}
          {loading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : documents.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 text-sm">No documents uploaded yet.</p>
              <p className="text-slate-400 text-xs mt-1">
                Upload a PDF or TXT file to build the knowledge base.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      File
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Size
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Chunks
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Uploaded
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr
                      key={doc.source}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">
                        <span
                          title={doc.source}
                          className={`inline-flex items-center gap-1.5 ${
                            doc.mimetype === "application/pdf"
                              ? "text-red-600"
                              : "text-blue-600"
                          }`}
                        >
                          {doc.mimetype === "application/pdf" ? "📄" : "📝"}
                          <span className="text-slate-800">{doc.source}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatBytes(doc.size)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {doc.chunk_count}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {formatDate(doc.uploaded_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(doc.source)}
                          disabled={deletingSource === doc.source}
                          className="text-xs text-slate-400 hover:text-red-500 transition disabled:opacity-40"
                        >
                          {deletingSource === doc.source ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
