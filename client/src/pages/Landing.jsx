import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Shared medical background style (soft blue + subtle cross pattern)
export const medicalBg = {
  backgroundColor: "#eff6ff",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='44' height='44' viewBox='0 0 44 44' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='19' y='13' width='6' height='18' rx='2' fill='%232563eb' fill-opacity='0.07'/%3E%3Crect x='13' y='19' width='18' height='6' rx='2' fill='%232563eb' fill-opacity='0.07'/%3E%3C/svg%3E")`,
};

// Typing cursor effect
function TypingHeadline({ text }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idx = useRef(0);

  useEffect(() => {
    const delay = setTimeout(() => {
      const interval = setInterval(() => {
        if (idx.current < text.length) {
          setDisplayed(text.slice(0, idx.current + 1));
          idx.current += 1;
        } else {
          setDone(true);
          clearInterval(interval);
        }
      }, 38);
      return () => clearInterval(interval);
    }, 300);
    return () => clearTimeout(delay);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && (
        <span
          className="inline-block w-0.5 h-10 bg-blue-500 ml-1 align-middle"
          style={{ animation: "blink 1s step-end infinite" }}
        />
      )}
    </span>
  );
}

// Intersection observer for scroll-in animations
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

function SlideUpCard({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
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
    <div className="min-h-screen text-slate-800 overflow-x-hidden" style={medicalBg}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes hero-in { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
      `}</style>

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-white/80 backdrop-blur border-b border-blue-100 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="text-blue-600 text-xl font-bold">✚</span>
          <span className="font-bold text-lg text-slate-800 tracking-tight">CareChat</span>
        </div>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-4 py-1.5 text-sm text-slate-600 hover:text-blue-600 transition font-medium"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-28">
        {/* Decorative top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-blue-600 to-teal-500" />

        <div style={{ animation: "hero-in 0.7s ease both" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Clinical AI · Role-Based · Document-Grounded
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight text-slate-900 mb-6 min-h-[80px]">
            <TypingHeadline text="Clinical Intelligence, Built for the Bedside" />
          </h1>
        </div>

        <p
          className="text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed"
          style={{ animation: "hero-in 0.7s 0.5s ease both", opacity: 0 }}
        >
          AI-powered assistant for nurses and clinical research coordinators —
          grounded in your institution's own documents.
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          style={{ animation: "hero-in 0.7s 0.8s ease both", opacity: 0 }}
        >
          <Link
            to="/register"
            className="px-8 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md text-base"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 rounded-xl font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 transition text-base shadow-sm"
          >
            Sign In
          </Link>
        </div>

        {/* Decorative medical cross watermark */}
        <div
          className="absolute right-10 top-20 text-blue-100 text-[180px] font-black select-none pointer-events-none leading-none"
          style={{ animation: "fade-in 1s 0.5s ease both", opacity: 0 }}
        >
          ✚
        </div>
      </section>

      {/* ── Role Cards ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <SlideUpCard className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Built for your role</h2>
            <p className="text-slate-500">Tailored knowledge and guidance for every clinical professional.</p>
          </SlideUpCard>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Nurse card */}
            <SlideUpCard delay={0}>
              <div className="h-full bg-white border border-blue-100 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl">
                    🏥
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">For Nurses</h3>
                    <p className="text-xs text-blue-600 font-medium">RN · LPN · Clinical Staff</p>
                  </div>
                </div>
                <p className="text-slate-500 text-sm mb-5 leading-relaxed">
                  Bedside clinical decision support grounded in nursing protocols and your institution's documents.
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Medication dosing & drug interactions",
                    "Nursing procedures & care protocols",
                    "Clinical assessment & early warning signs",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <span className="mt-0.5 text-blue-500 font-bold flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </SlideUpCard>

            {/* CRC card */}
            <SlideUpCard delay={150}>
              <div className="h-full bg-white border border-teal-100 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-teal-300 transition-all">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-2xl">
                    🔬
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">For Clinical Research Coordinators</h3>
                    <p className="text-xs text-teal-600 font-medium">CRC · Research Operations</p>
                  </div>
                </div>
                <p className="text-slate-500 text-sm mb-5 leading-relaxed">
                  Regulatory intelligence and protocol expertise for clinical research operations and compliance.
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Protocol interpretation & eligibility",
                    "IRB & GCP regulatory compliance",
                    "Adverse event reporting timelines",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <span className="mt-0.5 text-teal-500 font-bold flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </SlideUpCard>
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-20 px-6 bg-white border-y border-blue-100">
        <div className="max-w-5xl mx-auto">
          <SlideUpCard className="text-center mb-14">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How it works</h2>
            <p className="text-slate-500">Three steps from your documents to clinical answers.</p>
          </SlideUpCard>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            <div className="hidden sm:block absolute top-9 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] h-px border-t-2 border-dashed border-blue-200" />

            {[
              {
                step: "01",
                icon: "📁",
                title: "Upload documents",
                desc: "Admins upload clinical PDFs and protocols to the role-specific knowledge base.",
                delay: 0,
              },
              {
                step: "02",
                icon: "💬",
                title: "Ask naturally",
                desc: "Ask questions in plain language — no special syntax or query language required.",
                delay: 120,
              },
              {
                step: "03",
                icon: "✅",
                title: "Grounded answers",
                desc: "Get answers backed by your institution's documents, with citations streamed in real time.",
                delay: 240,
              },
            ].map(({ step, icon, title, desc, delay }) => (
              <SlideUpCard key={step} delay={delay}>
                <div className="text-center px-2">
                  <div className="w-18 h-18 mx-auto mb-4 w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <span className="text-2xl">{icon}</span>
                  </div>
                  <div className="text-xs font-bold text-blue-500 tracking-widest mb-1 uppercase">Step {step}</div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </SlideUpCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Strip ── */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-3">
          {["RAG Pipeline", "pgvector", "OpenAI GPT-4o", "Role-Based Access", "Real-time Streaming"].map((tech) => (
            <span key={tech} className="text-xs text-slate-400 font-medium tracking-widest uppercase">
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-blue-100 text-center bg-white">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-blue-600 font-bold">✚</span>
          <span className="text-sm font-semibold text-slate-700">CareChat</span>
          <span className="text-slate-300">·</span>
          <span className="text-sm text-slate-400">AI Clinical Assistant</span>
        </div>
        <Link to="/login" className="text-sm text-blue-500 hover:text-blue-700 transition">
          Sign In
        </Link>
      </footer>
    </div>
  );
}
