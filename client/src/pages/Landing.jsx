import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Shared background for login / register pages
export const medicalBg = {
  backgroundColor: "#f0f4f8",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='52' viewBox='0 0 52 52' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='23' y='14' width='6' height='24' rx='1' fill='%230f1e3c' fill-opacity='0.05'/%3E%3Crect x='14' y='23' width='24' height='6' rx='1' fill='%230f1e3c' fill-opacity='0.05'/%3E%3C/svg%3E")`,
};

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function FadeUp({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function CrossIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="6.5" y="1" width="3" height="14" rx="1" fill={color} />
      <rect x="1" y="6.5" width="14" height="3" rx="1" fill={color} />
    </svg>
  );
}

export default function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/chat", { replace: true });
  }, [user, loading, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-white text-slate-800 overflow-x-hidden">
      <style>{`
        @keyframes hero-in { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-[#0c1a35] border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-8 py-4">
          <div className="flex items-center gap-2.5">
            <CrossIcon size={18} color="#3b82f6" />
            <span className="font-bold text-white text-base tracking-tight">Rondoc</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition font-medium"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition"
            >
              Request Access
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative bg-[#0c1a35] overflow-hidden">
        {/* Subtle grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow accent */}
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-8 py-28">
          <div style={{ animation: "hero-in 0.6s ease both" }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-blue-600/15 border border-blue-500/25 text-blue-300 text-[11px] font-semibold tracking-widest uppercase mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Clinical Decision Support · RAG-Powered
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-[1.15] tracking-tight max-w-3xl mb-6">
              Institutional AI for<br />
              <span className="text-blue-400">Clinical Professionals</span>
            </h1>
          </div>

          <p
            className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed mb-10"
            style={{ animation: "hero-in 0.6s 0.25s ease both", opacity: 0 }}
          >
            Rondoc delivers precise, document-grounded answers to nurses and
            clinical research coordinators — drawn from your institution's own
            protocols, not the open internet.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3"
            style={{ animation: "hero-in 0.6s 0.45s ease both", opacity: 0 }}
          >
            <Link
              to="/register"
              className="px-7 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition"
            >
              Request Access →
            </Link>
            <Link
              to="/login"
              className="px-7 py-3 text-sm font-semibold text-slate-300 border border-slate-600 hover:border-slate-400 hover:text-white rounded transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="bg-blue-700">
        <div className="max-w-6xl mx-auto px-8 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: "< 3s", label: "Response time" },
            { value: "Role-scoped", label: "Knowledge access" },
            { value: "PDF · TXT", label: "Document formats" },
            { value: "GPT-4o", label: "AI model" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-white font-bold text-lg">{value}</div>
              <div className="text-blue-200 text-xs uppercase tracking-widest mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Roles ── */}
      <section className="py-20 px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="mb-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-px h-6 bg-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">Role-based access control</h2>
            </div>
            <p className="text-slate-500 text-sm pl-6">
              Each role is restricted to the documents assigned by your institution's administrator.
            </p>
          </FadeUp>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Nurse */}
            <FadeUp delay={0}>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-md transition-all">
                <div className="h-1 bg-blue-600" />
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <CrossIcon size={14} color="white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Nursing Staff</h3>
                      <p className="text-xs text-slate-400">RN · LPN · Clinical Staff</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Medication dosing & drug interaction checks",
                      "Nursing procedures & care protocols",
                      "Clinical assessment & early warning recognition",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeUp>

            {/* CRC */}
            <FadeUp delay={120}>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-teal-300 hover:shadow-md transition-all">
                <div className="h-1 bg-teal-600" />
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded bg-teal-600 flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.5" />
                        <path d="M7 4.5V7l1.5 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Clinical Research Coordinators</h3>
                      <p className="text-xs text-slate-400">CRC · Research Operations</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Protocol interpretation & eligibility screening",
                      "IRB submissions & GCP regulatory compliance",
                      "Adverse event reporting & timeline guidance",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-teal-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-8 bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="mb-14">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-px h-6 bg-blue-600" />
              <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
            </div>
            <p className="text-slate-500 text-sm pl-6">
              From institutional documents to cited clinical answers in three steps.
            </p>
          </FadeUp>

          <div className="grid sm:grid-cols-3 gap-10 relative">
            <div className="hidden sm:block absolute top-5 left-[calc(16.67%+12px)] right-[calc(16.67%+12px)] h-px bg-slate-200" />
            {[
              {
                step: "01",
                title: "Upload knowledge base",
                desc: "Administrators upload clinical PDFs and institutional protocols, segmented by role.",
              },
              {
                step: "02",
                title: "Ask in plain language",
                desc: "Staff submit clinical questions through a secure, conversational interface.",
              },
              {
                step: "03",
                title: "Cited, grounded answers",
                desc: "Responses are generated in real time with source citations from your documents.",
              },
            ].map(({ step, title, desc }, i) => (
              <FadeUp key={step} delay={i * 100}>
                <div className="flex items-center justify-center w-10 h-10 rounded bg-[#0c1a35] text-white text-sm font-bold mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-8 bg-[#0c1a35]">
        <FadeUp className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to deploy at your institution?
          </h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Request access to get your clinical team set up with role-specific,
            document-grounded AI support.
          </p>
          <Link
            to="/register"
            className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-sm transition"
          >
            Request Access →
          </Link>
        </FadeUp>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-200 py-6 px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CrossIcon size={13} color="#2563eb" />
            <span className="text-sm font-semibold text-slate-700">Rondoc</span>
            <span className="text-slate-300 mx-1">·</span>
            <span className="text-xs text-slate-400">AI Clinical Decision Support</span>
          </div>
          <Link to="/login" className="text-xs text-blue-500 hover:text-blue-700 transition">
            Sign In
          </Link>
        </div>
      </footer>
    </div>
  );
}
