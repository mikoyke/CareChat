import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Shared background exported for Login & Register
export const medicalBg = {
  backgroundColor: "#f0f9ff",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='52' height='52' viewBox='0 0 52 52' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='22' y='13' width='8' height='26' rx='2' fill='%230284c7' fill-opacity='0.06'/%3E%3Crect x='13' y='22' width='26' height='8' rx='2' fill='%230284c7' fill-opacity='0.06'/%3E%3C/svg%3E")`,
};

/* ─── helpers ─── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function FadeUp({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
      }}
    >
      {children}
    </div>
  );
}

/* Red medical cross used as logo */
function MedCross({ size = 18, color = "#dc2626" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="7" y="1" width="4" height="16" rx="1.5" fill={color} />
      <rect x="1" y="7" width="16" height="4" rx="1.5" fill={color} />
    </svg>
  );
}

/* ─── Hero illustration: a live-looking chat card ─── */
function ChatCard() {
  return (
    <div className="relative" style={{ animation: "float 5s ease-in-out infinite" }}>
      {/* Soft green glow blobs */}
      <div className="absolute -inset-8 bg-sky-100 rounded-full blur-3xl opacity-60 pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sky-200 rounded-full blur-3xl opacity-40 pointer-events-none" />

      {/* Chat window */}
      <div className="relative w-80 bg-white rounded-2xl shadow-2xl border border-sky-100 overflow-hidden">
        {/* Header bar */}
        <div className="bg-sky-600 px-4 py-3 flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <MedCross size={13} color="white" />
          </div>
          <div>
            <p className="text-white text-sm font-semibold leading-none">Rondoc AI</p>
            <p className="text-sky-200 text-[10px] mt-0.5">Clinical Assistant</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-300 animate-pulse" />
            <span className="text-sky-200 text-[10px]">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-slate-50 p-3.5 space-y-3">
          {/* User */}
          <div className="flex justify-end">
            <div className="bg-sky-600 text-white text-xs rounded-2xl rounded-br-none px-3.5 py-2 max-w-[78%] leading-relaxed shadow-sm">
              What's the vancomycin dose for a 70 kg adult?
            </div>
          </div>
          {/* AI */}
          <div className="flex justify-start">
            <div className="bg-white border border-sky-100 text-slate-700 text-xs rounded-2xl rounded-bl-none px-3.5 py-2.5 max-w-[85%] shadow-sm">
              <p className="text-sky-700 text-[10px] font-bold mb-1 uppercase tracking-wide">Rondoc AI</p>
              <p className="leading-relaxed">
                For a 70 kg adult:{" "}
                <span className="font-semibold text-slate-800">25–30 mg/kg/day</span>, divided
                every 8–12 h. AUC-guided monitoring recommended.
              </p>
              <div className="mt-2 pt-1.5 border-t border-sky-50 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                <span className="text-[9px] text-slate-400">
                  Vancomycin Protocol 2024 · 94% match
                </span>
              </div>
            </div>
          </div>
          {/* Typing dots */}
          <div className="flex justify-start">
            <div className="bg-white border border-sky-100 rounded-full px-3 py-2 shadow-sm flex gap-1 items-center">
              {[0, 150, 300].map((d) => (
                <span
                  key={d}
                  className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-bounce"
                  style={{ animationDelay: `${d}ms` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="px-3 py-2.5 bg-white border-t border-sky-100 flex items-center gap-2">
          <div className="flex-1 bg-sky-50 rounded-full px-3 py-1.5 text-[11px] text-slate-400 select-none">
            Ask a clinical question…
          </div>
          <div className="w-7 h-7 bg-sky-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M1.5 5.5h8M5.5 1.5l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Floating badge — top right */}
      <div
        className="absolute -top-4 -right-5 bg-white border border-sky-100 shadow-lg rounded-2xl px-3 py-2 flex items-center gap-2"
        style={{ animation: "float 5s ease-in-out 0.6s infinite" }}
      >
        <div className="w-6 h-6 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <MedCross size={12} />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-800 leading-none">Clinical Grade</p>
          <p className="text-[9px] text-slate-400 mt-0.5">Verified sources</p>
        </div>
      </div>

      {/* Floating badge — bottom left */}
      <div
        className="absolute -bottom-4 -left-5 bg-white border border-sky-100 shadow-lg rounded-2xl px-3 py-2 flex items-center gap-2"
        style={{ animation: "float 5s ease-in-out 1.2s infinite" }}
      >
        <div className="w-6 h-6 bg-sky-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 6.5l3 3 6-6" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-800 leading-none">Zero hallucination</p>
          <p className="text-[9px] text-slate-400 mt-0.5">RAG-grounded</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
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
        @keyframes hero-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes cross-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        @keyframes scroll-dot {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50%       { transform: translateY(6px); opacity: 0.4; }
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-sky-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ animation: "cross-pulse 2.8s ease-in-out infinite" }}>
            <MedCross size={20} />
            <span className="font-bold text-xl text-slate-900 tracking-tight">Rondoc</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-sky-700 transition">
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-white py-16 sm:py-24 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-14 items-center">
          {/* Left: copy */}
          <div className="flex-1" style={{ animation: "hero-in 0.6s ease both" }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-50 border border-sky-200 text-sky-700 text-xs font-semibold rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              AI Clinical Assistant · Document-Grounded
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-[1.15] tracking-tight mb-5">
              Clinical answers,<br />
              <span className="text-sky-600">grounded in your</span><br />
              <span className="text-sky-600">own protocols</span>
            </h1>

            <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-md">
              Rondoc helps nurses and clinical research coordinators get fast,
              accurate answers — sourced from your institution's own documents,
              not the open internet.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                to="/register"
                className="px-7 py-3 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition shadow-md text-center"
              >
                Get Started →
              </Link>
              <Link
                to="/login"
                className="px-7 py-3 text-sm font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition text-center"
              >
                Sign In
              </Link>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-5">
              {["No hallucinations", "Role-scoped access", "Real-time answers"].map((s) => (
                <div key={s} className="flex items-center gap-1.5 text-sm text-slate-500">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                    <path d="M2 8l3.5 3.5L13 3" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Right: illustration */}
          <div
            className="flex-1 flex justify-center sm:justify-end"
            style={{ animation: "hero-in 0.6s 0.2s ease both", opacity: 0 }}
          >
            <ChatCard />
          </div>
        </div>

        {/* Scroll guide */}
        <div
          className="flex justify-center mt-16"
          style={{ animation: "hero-in 0.6s 0.9s ease both", opacity: 0 }}
        >
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <span className="text-xs tracking-wide">Scroll to explore</span>
            <div className="w-5 h-8 border-2 border-slate-200 rounded-full flex justify-center pt-1.5">
              <div className="w-1 h-2 bg-sky-500 rounded-full" style={{ animation: "scroll-dot 1.6s ease-in-out infinite" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature strip ── */}
      <div className="bg-sky-600">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap justify-center sm:justify-between gap-4">
          {[
            { icon: "📋", label: "Protocol Intelligence" },
            { icon: "🔒", label: "Role-Based Access" },
            { icon: "⚡", label: "Real-time Streaming" },
            { icon: "📎", label: "Document Upload" },
            { icon: "⭐", label: "Response Ratings" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-base">{icon}</span>
              <span className="text-white text-xs font-semibold tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Role cards ── */}
      <section className="py-20 px-6 bg-sky-50">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="mb-12 text-center">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <MedCross size={18} />
              <h2 className="text-3xl font-bold text-slate-900">Built for your role</h2>
            </div>
            <p className="text-slate-500 max-w-lg mx-auto">
              Tailored knowledge bases and guidance for every clinical professional.
            </p>
          </FadeUp>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Nurse */}
            <FadeUp delay={0}>
              <div className="bg-white rounded-2xl border border-sky-100 overflow-hidden hover:shadow-lg hover:border-sky-300 transition-all group h-full">
                <div className="h-1.5 bg-sky-500" />
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100 transition">
                      {/* Stethoscope-style icon */}
                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                        <circle cx="15" cy="8" r="4.5" stroke="#0284c7" strokeWidth="2" fill="none" />
                        <path d="M9 14v4a6 6 0 0012 0v-4" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" fill="none" />
                        <circle cx="21" cy="22" r="2.5" stroke="#0284c7" strokeWidth="1.8" fill="none" />
                        <line x1="21" y1="19.5" x2="21" y2="17" stroke="#0284c7" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">For Nurses</h3>
                      <p className="text-xs text-sky-600 font-medium mt-0.5">RN · LPN · Clinical Staff</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mb-5 leading-relaxed">
                    Bedside decision support grounded in nursing protocols — always cited, always current.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "Medication dosing & drug interaction checks",
                      "Nursing procedures & care protocols",
                      "Clinical assessment & early warning signs",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <svg className="flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 15 15" fill="none">
                          <path d="M2 8l3.5 3.5L13 3" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeUp>

            {/* CRC */}
            <FadeUp delay={130}>
              <div className="bg-white rounded-2xl border border-sky-100 overflow-hidden hover:shadow-lg hover:border-teal-300 transition-all group h-full">
                <div className="h-1.5 bg-teal-500" />
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition">
                      {/* Clipboard icon */}
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <rect x="5" y="4" width="18" height="21" rx="2.5" stroke="#0d9488" strokeWidth="1.8" fill="none" />
                        <path d="M10 4v2.5h8V4" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M9 13h10M9 17.5h6.5" stroke="#0d9488" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">For CRC Staff</h3>
                      <p className="text-xs text-teal-600 font-medium mt-0.5">CRC · Research Operations</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm mb-5 leading-relaxed">
                    Regulatory intelligence and protocol expertise for clinical trials — from screening to reporting.
                  </p>
                  <ul className="space-y-2.5">
                    {[
                      "Protocol interpretation & eligibility criteria",
                      "IRB & GCP regulatory compliance",
                      "Adverse event reporting timelines",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <svg className="flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 15 15" fill="none">
                          <path d="M2 8l3.5 3.5L13 3" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
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
      <section className="py-20 px-6 bg-white border-y border-sky-100">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How it works</h2>
            <p className="text-slate-500">Three steps from your documents to precise clinical answers.</p>
          </FadeUp>

          <div className="grid sm:grid-cols-3 gap-10 relative">
            {/* Connector line */}
            <div className="hidden sm:block absolute top-7 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] border-t-2 border-dashed border-sky-200" />

            {[
              {
                step: "01",
                title: "Upload your documents",
                desc: "Admins upload clinical PDFs and protocols to the role-specific knowledge base.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 4v10M6 9l5-5 5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 17h14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Ask in plain language",
                desc: "Staff ask clinical questions naturally — no special syntax required.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M4 7h14M4 11h10M4 15h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Get cited answers",
                desc: "Responses are backed by your documents with inline source citations.",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M3 12l5 5L19 5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
              },
            ].map(({ step, title, desc, icon }, i) => (
              <FadeUp key={step} delay={i * 120}>
                <div className="text-center px-2">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-600 flex items-center justify-center shadow-md mb-4">
                    {icon}
                  </div>
                  <p className="text-xs font-bold text-sky-600 tracking-widest uppercase mb-1">Step {step}</p>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="py-16 px-6"
        style={{ background: "linear-gradient(135deg, #0369a1 0%, #0284c7 55%, #0d9488 100%)" }}
      >
        <FadeUp className="max-w-xl mx-auto text-center">
          <div className="flex justify-center mb-5" style={{ animation: "cross-pulse 2.8s ease-in-out infinite" }}>
            <MedCross size={36} color="rgba(255,255,255,0.75)" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to support your clinical team?
          </h2>
          <p className="text-sky-100 text-sm leading-relaxed mb-8 max-w-md mx-auto">
            Get your team set up with role-specific, document-grounded AI assistance
            designed for healthcare professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-sky-700 hover:bg-sky-50 rounded-xl font-semibold text-sm transition shadow-md"
            >
              Get Started →
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 border border-white/40 text-white hover:bg-white/10 rounded-xl font-semibold text-sm transition"
            >
              Sign In
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-sky-100 py-7 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MedCross size={14} />
            <span className="text-sm font-semibold text-slate-700">Rondoc</span>
            <span className="text-slate-300 mx-1">·</span>
            <span className="text-xs text-slate-400">AI Clinical Decision Support</span>
          </div>
          <Link to="/login" className="text-sm text-sky-600 hover:text-sky-800 font-medium transition">
            Sign In →
          </Link>
        </div>
      </footer>
    </div>
  );
}
