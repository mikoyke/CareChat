import { useState } from "react";
import api from "../api/axios";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const canRate = !isUser && !!message.id;

  const [rating, setRating] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = async (value) => {
    if (submitting || rating === value) return;
    setSubmitting(true);
    try {
      await api.post(`/chat/messages/${message.id}/feedback`, { rating: value });
      setRating(value);
    } catch (err) {
      console.error("Feedback error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-white text-slate-800 shadow-sm rounded-bl-none"
        }`}
      >
        {!isUser && (
          <p className="text-xs font-semibold text-blue-600 mb-1">Rondoc AI</p>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {!isUser && message.sources?.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
            {message.sources.map((src) => (
              <span
                key={src.source}
                className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5"
                title={src.source}
              >
                📄 {src.source.replace(/\.[^.]+$/, "")} · {Math.round(src.similarity * 100)}% match
              </span>
            ))}
          </div>
        )}

        {canRate && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => submitFeedback(1)}
              disabled={submitting}
              title="Helpful"
              className={`text-base transition disabled:opacity-40 ${
                rating === 1
                  ? "opacity-100 scale-110"
                  : "opacity-30 hover:opacity-80"
              }`}
            >
              👍
            </button>
            <button
              onClick={() => submitFeedback(-1)}
              disabled={submitting}
              title="Not helpful"
              className={`text-base transition disabled:opacity-40 ${
                rating === -1
                  ? "opacity-100 scale-110"
                  : "opacity-30 hover:opacity-80"
              }`}
            >
              👎
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
