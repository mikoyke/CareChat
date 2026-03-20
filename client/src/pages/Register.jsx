import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { medicalBg } from "./Landing";

const inputClass =
  "w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition";

function MedCross({ size = 20, color = "#dc2626" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="7" y="1" width="4" height="16" rx="1.5" fill={color} />
      <rect x="1" y="7" width="16" height="4" rx="1.5" fill={color} />
    </svg>
  );
}

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "nurse" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/register", form);
      navigate("/login");
    } catch (error) {
      setError(error.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={medicalBg}>
      {/* Top accent bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-sky-600 to-teal-500" />

      <div className="bg-white rounded-2xl shadow-lg border border-sky-100 w-full max-w-md p-8">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-1">
          <MedCross size={22} />
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
        </div>
        <p className="text-slate-500 text-sm mb-7">Join Rondoc as a clinical professional</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className={inputClass}
              placeholder="Dr. Jane Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className={inputClass}
              placeholder="you@hospital.org"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">I am a…</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="nurse">Nurse</option>
              <option value="crc">Clinical Research Coordinator (CRC)</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-sky-600 text-white py-2.5 rounded-xl font-semibold hover:bg-sky-700 transition shadow-sm mt-2"
          >
            Create Account
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-sky-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-sm">
          <Link to="/" className="text-slate-400 hover:text-slate-600 transition">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
