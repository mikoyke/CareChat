import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Animated gradient orb
function GradientOrb({ className, style }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl opacity-20 ${className}`}
      style={style}
    />
  );
}

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
      }, 35);
      return () => clearInterval(interval);
    }, 400);
    return () => clearTimeout(delay);
  }, [text]);

  return (
    <span>
      {displayed}
      {!done && (
        <span
          className="inline-block w-0.5 h-10 bg-blue-400 ml-1 align-middle"
          style={{ animation: "blink 1s step-end infinite" }}
        />
      )}
    </span>
  );
}

// Intersection observer hook for scroll animations
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

// Staggered card
function SlideUpCard({ children, delay = 0, className = "" }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(32px)",
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
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Global keyframes via style tag */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.08)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,40px) scale(1.05)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(25px,25px) scale(1.06)} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 24px 4px rgba(59,130,246,0.5)} 50%{box-shadow:0 0 48px 12px rgba(59,130,246,0.8)} }
        @keyframes hero-in { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <span className="font-bold text-lg tracking-tight text-white">CareChat</span>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-4 py-1.5 text-sm text-slate-300 hover:text-white transition"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Ambient orbs */}
        <GradientOrb
          className="w-[600px] h-[600px] bg-blue-600 top-[-100px] left-[-150px]"
          style={{ animation: "float1 12s ease-in-out infinite" }}
        />
        <GradientOrb
          className="w-[500px] h-[500px] bg-purple-700 bottom-[-80px] right-[-120px]"
          style={{ animation: "float2 15s ease-in-out infinite" }}
        />
        <GradientOrb
          className="w-[350px] h-[350px] bg-teal-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ animation: "float3 18s ease-in-out infinite" }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div
          className="relative z-10 text-center max-w-3xl"
          style={{ animation: "hero-in 0.8s ease both" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-xs font-medium mb-8 tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Clinical AI · Role-Based · RAG-Powered
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6 text-white min-h-[80px]">
            <TypingHeadline text="Clinical Intelligence, Built for the Bedside" />
          </h1>

          <p
            className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed"
            style={{ animation: "hero-in 0.8s 0.6s ease both", opacity: 0 }}
          >
            AI-powered assistant for nurses and clinical research coordinators —
            grounded in your institution's own documents.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            style={{ animation: "hero-in 0.8s 0.9s ease both", opacity: 0 }}
          >
            <Link
              to="/register"
              className="px-8 py-3 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 transition text-base"
              style={{ animation: "pulse-glow 2.5s ease-in-out infinite" }}
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 rounded-xl font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition text-base"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
      </section>

      {/* ── Role Cards ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <SlideUpCard className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Built for your role</h2>
            <p className="text-slate-400">Tailored knowledge and workflows for every clinical professional.</p>
          </SlideUpCard>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Nurse card */}
            <SlideUpCard delay={0} className="h-full">
              <div className="h-full bg-gradient-to-br from-slate-900 to-slate-800/60 border border-blue-500/20 rounded-2xl p-8 hover:border-blue-500/50 transition-colors">
                <div className="text-4xl mb-4">🏥</div>
                <h3 className="text-xl font-bold text-white mb-2">For Nurses</h3>
                <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                  Clinical decision support at the bedside, grounded in nursing practice.
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Medication dosing & drug interactions",
                    "Nursing procedures & care protocols",
                    "Clinical assessment guidance",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
                  Nurse · RN · LPN
                </div>
              </div>
            </SlideUpCard>

            {/* CRC card */}
            <SlideUpCard delay={150} className="h-full">
              <div className="h-full bg-gradient-to-br from-slate-900 to-slate-800/60 border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/50 transition-colors">
                <div className="text-4xl mb-4">🔬</div>
                <h3 className="text-xl font-bold text-white mb-2">For Clinical Research Coordinators</h3>
                <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                  Regulatory intelligence and protocol expertise for research operations.
                </p>
                <ul className="space-y-2.5">
                  {[
                    "Protocol interpretation & eligibility",
                    "IRB & GCP regulatory compliance",
                    "Adverse event reporting timelines",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-medium">
                  CRC · Research Coordinator
                </div>
              </div>
            </SlideUpCard>
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-24 px-6 bg-slate-900/40">
        <div className="max-w-5xl mx-auto">
          <SlideUpCard className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">How it works</h2>
            <p className="text-slate-400">Three steps from your documents to clinical answers.</p>
          </SlideUpCard>

          <div className="grid sm:grid-cols-3 gap-6 relative">
            {/* Connector line (desktop) */}
            <div className="hidden sm:block absolute top-10 left-[calc(16.67%+16px)] right-[calc(16.67%+16px)] h-px bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0" />

            {[
              {
                step: "01",
                title: "Upload documents",
                desc: "Admins upload clinical PDFs and protocols to the role-specific knowledge base.",
                delay: 0,
              },
              {
                step: "02",
                title: "Ask naturally",
                desc: "Ask questions in plain language — no special syntax or query language required.",
                delay: 150,
              },
              {
                step: "03",
                title: "Grounded answers",
                desc: "Get AI answers backed by your institution's own documents, streamed in real time.",
                delay: 300,
              },
            ].map(({ step, title, desc, delay }) => (
              <SlideUpCard key={step} delay={delay}>
                <div className="relative text-center px-4">
                  <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <span className="text-2xl font-extrabold text-blue-400">{step}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </SlideUpCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech Strip ── */}
      <section className="py-10 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-8 gap-y-3">
          {[
            "RAG Pipeline",
            "pgvector",
            "OpenAI GPT-4o",
            "Role-Based Access",
            "Real-time Streaming",
          ].map((tech) => (
            <span key={tech} className="text-xs text-slate-500 font-medium tracking-widest uppercase">
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 text-center">
        <p className="text-slate-600 text-sm">
          CareChat — AI Clinical Assistant ·{" "}
          <Link to="/login" className="text-slate-500 hover:text-slate-300 transition">
            Sign In
          </Link>
        </p>
      </footer>
    </div>
  );
}
