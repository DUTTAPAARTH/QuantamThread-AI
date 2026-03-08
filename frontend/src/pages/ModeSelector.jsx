import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/* ── helpers ────────────────────────────────────────────────────────── */
const Icon = ({ name, className = "", style = {} }) => (
  <span className={`material-symbols-outlined ${className}`} style={style}>
    {name}
  </span>
);

const FILL = { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48" };
const OUTLINE = { fontVariationSettings: "'FILL' 0, 'wght' 300" };

const darkBg = "#0B0F1A";
const cardBg = "rgba(26,31,46,0.6)";
const glass = {
  background: cardBg,
  backdropFilter: "blur(20px) saturate(130%)",
  WebkitBackdropFilter: "blur(20px) saturate(130%)",
};

/* ── animation primitives ───────────────────────────────────────────── */
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
const fadeUp  = { hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } } };
const fadeIn  = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } };

function Section({ children, className = "", id }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={stagger}
      className={`relative w-full max-w-6xl mx-auto px-6 ${className}`}
    >
      {children}
    </motion.section>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <motion.div variants={fadeUp} className="text-center mb-14">
      <h2
        className="text-2xl sm:text-3xl font-bold tracking-tight mb-3"
        style={{
          background: "linear-gradient(135deg, #e2e8f0 0%, #ffffff 50%, #c4b5fd 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {children}
      </h2>
      {sub && <p className="text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">{sub}</p>}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PARTICLE CANVAS
   ═══════════════════════════════════════════════════════════════════════ */
function ParticleField() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    let raf;
    const resize = () => { c.width = c.offsetWidth * devicePixelRatio; c.height = c.offsetHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
    resize();
    window.addEventListener("resize", resize);
    const N = 55;
    const ps = Array.from({ length: N }, () => ({
      x: Math.random() * c.offsetWidth, y: Math.random() * c.offsetHeight,
      r: Math.random() * 1.2 + 0.4, dx: (Math.random() - 0.5) * 0.2, dy: (Math.random() - 0.5) * 0.2,
      o: Math.random() * 0.3 + 0.08,
    }));
    const draw = () => {
      const W = c.offsetWidth, H = c.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.o})`; ctx.fill();
      }
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 110) { ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.strokeStyle = `rgba(99,102,241,${0.05 * (1 - d / 110)})`; ctx.lineWidth = 0.5; ctx.stroke(); }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />;
}

/* ═══════════════════════════════════════════════════════════════════════
   GRID OVERLAY
   ═══════════════════════════════════════════════════════════════════════ */
function GridOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        backgroundImage:
          "linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   GLASS CARD (reusable)
   ═══════════════════════════════════════════════════════════════════════ */
function GlassCard({ children, className = "", hover = true }) {
  return (
    <motion.div
      variants={fadeUp}
      className={`relative rounded-2xl border border-white/[0.06] p-6 sm:p-8 ${className}`}
      style={{ ...glass, boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 8px 32px rgba(0,0,0,0.25)" }}
      {...(hover && {
        whileHover: { y: -3, boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 12px 48px rgba(139,92,246,0.12)" },
        transition: { type: "spring", stiffness: 300, damping: 24 },
      })}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ICON BOX — small icon square
   ═══════════════════════════════════════════════════════════════════════ */
function IconBox({ name, color = "text-violet-400" }) {
  return (
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/[0.08] shrink-0"
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      <Icon name={name} className={`text-[22px] ${color}`} style={FILL} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION 1 — HERO
   ════════════════════════════════════════════════════════════════════════ */
function Hero({ navigate }) {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      {/* Radial hero glow */}
      <div className="absolute pointer-events-none" style={{ width: 800, height: 800, top: "40%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)" }} />
      <ParticleField />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl mx-auto px-6 items-center">
        {/* Left — text */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 mb-8 text-xs text-violet-300"
            style={{ background: "rgba(139,92,246,0.08)" }}
          >
            <Icon name="auto_awesome" className="text-[14px] text-violet-400" style={FILL} />
            Powered by AI Agent Swarm
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-5"
            style={{
              background: "linear-gradient(135deg, #e2e8f0 0%, #ffffff 40%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            QuantumThread AI
          </h1>

          <p className="text-lg text-slate-400 mb-3 font-medium">
            Engineering intelligence console for modern software systems.
          </p>
          <p className="text-sm text-slate-500 leading-relaxed max-w-lg mb-10">
            QuantumThread AI uses a swarm of specialized AI agents to analyze architecture,
            detect bugs, find vulnerabilities, optimize performance, and explain complex codebases.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/assistant")}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white border-0 cursor-pointer flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 0 24px rgba(99,102,241,0.3)" }}
            >
              <Icon name="smart_toy" className="text-[18px]" style={FILL} /> Open AI Console
            </button>
            <button
              onClick={() => navigate("/project")}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-slate-300 border border-white/10 cursor-pointer flex items-center gap-2 hover:border-white/20"
              style={{ background: "rgba(255,255,255,0.04)", boxShadow: "none" }}
            >
              <Icon name="folder_open" className="text-[18px]" style={FILL} /> Analyze Repository
            </button>
          </div>
        </motion.div>

        {/* Right — illustration graphic */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="hidden lg:flex justify-center">
          <div className="relative w-80 h-80">
            {/* Orbiting rings */}
            <div className="absolute inset-0 rounded-full border border-violet-500/10 animate-[spin_30s_linear_infinite]" />
            <div className="absolute inset-4 rounded-full border border-cyan-500/10 animate-[spin_25s_linear_infinite_reverse]" />
            <div className="absolute inset-10 rounded-full border border-indigo-500/10 animate-[spin_20s_linear_infinite]" />

            {/* Center hub */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))", border: "1px solid rgba(139,92,246,0.3)", boxShadow: "0 0 60px rgba(139,92,246,0.15)" }}
              >
                <Icon name="hub" className="text-white text-5xl" style={FILL} />
              </div>
            </div>

            {/* Orbiting agent dots */}
            {[
              { top: "8%", left: "50%", icon: "account_tree", color: "text-cyan-400" },
              { top: "50%", right: "4%", icon: "bug_report", color: "text-rose-400" },
              { bottom: "8%", left: "50%", icon: "shield", color: "text-emerald-400" },
              { top: "50%", left: "4%", icon: "speed", color: "text-amber-400" },
              { top: "18%", right: "12%", icon: "school", color: "text-violet-400" },
            ].map((a, i) => (
              <div
                key={i}
                className="absolute w-10 h-10 rounded-xl flex items-center justify-center border border-white/10"
                style={{ ...a, transform: "translate(-50%,-50%)", background: "rgba(26,31,46,0.8)", boxShadow: "0 0 20px rgba(0,0,0,0.3)" }}
              >
                <Icon name={a.icon} className={`text-[18px] ${a.color}`} style={FILL} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION 2 — PLATFORM CAPABILITIES
   ════════════════════════════════════════════════════════════════════════ */
const capabilities = [
  { icon: "account_tree", color: "text-cyan-400",    title: "Architecture Intelligence", desc: "Understand system design, module relationships, and dependency graphs." },
  { icon: "bug_report",   color: "text-rose-400",    title: "Bug Detection",             desc: "Detect bugs, risky patterns, and code smells across your entire codebase." },
  { icon: "shield",       color: "text-emerald-400", title: "Security Analysis",         desc: "Identify vulnerabilities, insecure configurations, and security issues." },
  { icon: "speed",        color: "text-amber-400",   title: "Performance Optimization",  desc: "Detect bottlenecks, memory leaks, and optimize hot paths." },
  { icon: "school",       color: "text-violet-400",  title: "AI Tutor",                  desc: "Explain complex code, teach best practices, and guide developers." },
  { icon: "analytics",    color: "text-indigo-400",  title: "Impact Analysis",           desc: "Predict cascading effects before you merge or deploy changes." },
];

function Capabilities() {
  return (
    <Section className="py-28" id="capabilities">
      <SectionTitle sub="A swarm of AI agents working together to give you deep, actionable insights across every dimension of your codebase.">
        Platform Capabilities
      </SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {capabilities.map((c) => (
          <GlassCard key={c.title} className="cursor-default">
            <IconBox name={c.icon} color={c.color} />
            <h3 className="text-white font-semibold text-base mt-5 mb-2">{c.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{c.desc}</p>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION 3 — AI AGENTS
   ════════════════════════════════════════════════════════════════════════ */
const agents = [
  { icon: "account_tree", color: "text-cyan-400",    glow: "rgba(34,211,238,0.12)",  title: "Architecture Agent",   desc: "Maps module boundaries, dependency graphs, and system topology." },
  { icon: "bug_report",   color: "text-rose-400",    glow: "rgba(244,63,94,0.12)",   title: "Bug Detection Agent",  desc: "Scans for bugs, anti-patterns, and code-level risk factors." },
  { icon: "shield",       color: "text-emerald-400", glow: "rgba(52,211,153,0.12)",  title: "Security Agent",       desc: "Finds vulnerabilities, unsafe inputs, and insecure configurations." },
  { icon: "speed",        color: "text-amber-400",   glow: "rgba(251,191,36,0.12)",  title: "Performance Agent",    desc: "Identifies slow queries, N+1 problems, and memory bottlenecks." },
  { icon: "school",       color: "text-violet-400",  glow: "rgba(139,92,246,0.12)",  title: "Tutor Agent",          desc: "Explains code, suggests improvements, and teaches best practices." },
];

function Agents() {
  return (
    <Section className="py-28" id="agents">
      <SectionTitle sub="Five specialized AI agents collaborate to provide comprehensive engineering intelligence.">
        Meet the AI Agents
      </SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {agents.map((a) => (
          <GlassCard key={a.title} className="text-center cursor-default">
            <div className="mx-auto w-14 h-14 rounded-xl flex items-center justify-center border border-white/[0.08] mb-5" style={{ background: "rgba(255,255,255,0.04)", boxShadow: `0 0 30px ${a.glow}` }}>
              <Icon name={a.icon} className={`text-[26px] ${a.color}`} style={FILL} />
            </div>
            <h3 className="text-white font-semibold text-sm mb-2">{a.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{a.desc}</p>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION 4 — PROJECT ANALYSIS
   ════════════════════════════════════════════════════════════════════════ */
const analysisFeatures = [
  { icon: "integration_instructions", label: "GitHub repository integration", desc: "Connect any public or private repo for instant analysis." },
  { icon: "map",       label: "Architecture visualization",  desc: "Interactive module maps and dependency graphs." },
  { icon: "bug_report", label: "Bug & risk analysis",        desc: "AI-detected bugs ranked by severity and blast radius." },
  { icon: "shield",    label: "Security scanning",           desc: "Vulnerability detection with remediation guidance." },
  { icon: "share",     label: "Dependency intelligence",     desc: "Track outdated, vulnerable, and unused dependencies." },
  { icon: "history",   label: "Repository evolution",        desc: "Visualize how your codebase changes over time." },
];

function ProjectAnalysis() {
  return (
    <Section className="py-28" id="analysis">
      <SectionTitle sub="Connect your repository and get a full engineering health report in minutes.">
        Project Analysis
      </SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {analysisFeatures.map((f) => (
          <GlassCard key={f.label} className="flex items-start gap-5 cursor-default">
            <IconBox name={f.icon} color="text-cyan-400" />
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">{f.label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION 5 — IMPACT ANALYSIS
   ════════════════════════════════════════════════════════════════════════ */
function ImpactAnalysis() {
  return (
    <Section className="py-28" id="impact">
      <SectionTitle sub="Predict cascading effects of code changes before you merge.">
        Impact Analysis
      </SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Explanation */}
        <motion.div variants={fadeUp}>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            QuantumThread's impact engine traces how a single change ripples through your
            architecture — identifying affected services, teams, and downstream consumers
            with a confidence score so you can deploy with certainty.
          </p>
          <div className="space-y-3">
            {["Traces cross-service dependency chains", "Identifies affected teams automatically", "Confidence-scored risk predictions", "Pre-merge safety checks"].map((t) => (
              <div key={t} className="flex items-center gap-2.5 text-sm text-slate-400">
                <Icon name="check_circle" className="text-[18px] text-emerald-400" style={FILL} />
                {t}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Example card */}
        <GlassCard hover={false} className="cursor-default">
          <div className="flex items-center gap-2 mb-5">
            <Icon name="warning" className="text-[20px] text-amber-400" style={FILL} />
            <span className="text-sm font-semibold text-amber-300">Risk: Breaking API Change</span>
          </div>
          <div className="space-y-4">
            {[
              { label: "Affected Services", value: "auth-service, payment-gateway", icon: "dns" },
              { label: "Affected Teams", value: "backend, mobile", icon: "groups" },
            ].map((r) => (
              <div key={r.label} className="flex items-start gap-3">
                <Icon name={r.icon} className="text-[18px] text-slate-500 mt-0.5" style={OUTLINE} />
                <div>
                  <p className="text-xs text-slate-500">{r.label}</p>
                  <p className="text-sm text-slate-300 font-mono">{r.value}</p>
                </div>
              </div>
            ))}
            <div className="mt-3 pt-4 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Confidence</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">85%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #6366F1, #22D3EE)", width: "85%" }}
                  initial={{ width: 0 }}
                  whileInView={{ width: "85%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION 6 — AI CHAT PREVIEW
   ════════════════════════════════════════════════════════════════════════ */
const chatMessages = [
  { role: "user",  text: "Explain how the auth module connects to the payment service." },
  { role: "agent", agent: "Architecture Agent", icon: "account_tree", color: "text-cyan-400",   text: "The auth module exposes a JWT middleware consumed by payment-gateway via gRPC. Token validation happens in auth/middleware.ts before any payment endpoint." },
  { role: "agent", agent: "Security Agent",     icon: "shield",       color: "text-emerald-400", text: "Note: the JWT secret is loaded from an environment variable — ensure it's rotated regularly and never committed to source control." },
  { role: "agent", agent: "Tutor Agent",        icon: "school",       color: "text-violet-400",  text: "In simple terms: the auth module is like a bouncer — it checks your ID (JWT token) before letting you into the payment room." },
];

function ChatPreview() {
  return (
    <Section className="py-28" id="chat">
      <SectionTitle sub="Ask a question and receive insights from multiple specialized agents simultaneously.">
        AI Chat Preview
      </SectionTitle>
      <GlassCard hover={false} className="max-w-3xl mx-auto cursor-default">
        {/* Chat header bar */}
        <div className="flex items-center gap-2 pb-4 mb-5 border-b border-white/[0.06]">
          <Icon name="forum" className="text-[18px] text-violet-400" style={FILL} />
          <span className="text-xs text-slate-500 font-medium">Multi-Agent Chat</span>
        </div>

        {/* Messages */}
        <div className="space-y-5">
          {chatMessages.map((m, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "agent" && (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/[0.08] shrink-0 mt-0.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <Icon name={m.icon} className={`text-[16px] ${m.color}`} style={FILL} />
                </div>
              )}
              <div
                className={`rounded-xl px-4 py-3 max-w-[80%] ${
                  m.role === "user"
                    ? "text-right"
                    : ""
                }`}
                style={{
                  background: m.role === "user" ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${m.role === "user" ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.05)"}`,
                }}
              >
                {m.agent && <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{m.agent}</p>}
                <p className="text-sm text-slate-300 leading-relaxed">{m.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input bar */}
        <div className="mt-6 flex items-center gap-3 p-3 rounded-xl border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
          <span className="text-sm text-slate-600 flex-1">Ask your codebase anything…</span>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
            <Icon name="send" className="text-[16px] text-white" style={FILL} />
          </div>
        </div>
      </GlassCard>
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION 7 — TECH STACK
   ════════════════════════════════════════════════════════════════════════ */
const stack = [
  { category: "Frontend",         items: "React + Tailwind CSS",                icon: "web",             color: "text-cyan-400" },
  { category: "Backend",          items: "Node.js + Express",                   icon: "dns",             color: "text-emerald-400" },
  { category: "Database",         items: "SQLite",                              icon: "storage",         color: "text-amber-400" },
  { category: "AI Engine",        items: "Amazon Bedrock (Llama 3)",             icon: "psychology",      color: "text-violet-400" },
  { category: "Code Analysis",    items: "Tree-sitter, Semgrep, Bandit",        icon: "code",            color: "text-rose-400" },
  { category: "Graph Intelligence", items: "NetworkX",                          icon: "hub",             color: "text-indigo-400" },
];

function TechStack() {
  return (
    <Section className="py-28" id="stack">
      <SectionTitle sub="Built on a modern, open-source stack designed for speed, privacy, and extensibility.">
        Tech Stack
      </SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stack.map((s) => (
          <GlassCard key={s.category} className="flex items-start gap-4 cursor-default">
            <IconBox name={s.icon} color={s.color} />
            <div>
              <h3 className="text-white font-semibold text-sm mb-1">{s.category}</h3>
              <p className="text-xs text-slate-500 font-mono">{s.items}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SECTION 8 — CTA
   ════════════════════════════════════════════════════════════════════════ */
function CTA({ navigate }) {
  return (
    <Section className="py-32" id="cta">
      <motion.div variants={fadeUp} className="text-center">
        {/* Glow blob */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)" }} />

        <h2
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 relative"
          style={{
            background: "linear-gradient(135deg, #e2e8f0 0%, #ffffff 40%, #c4b5fd 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Turn Your Codebase Into an<br />Intelligent System
        </h2>
        <p className="text-sm text-slate-500 mb-10 max-w-md mx-auto relative">
          Start analyzing, optimizing, and understanding your software with AI agents that work as hard as you do.
        </p>

        <div className="flex flex-wrap justify-center gap-4 relative">
          <button
            onClick={() => navigate("/assistant")}
            className="px-8 py-3.5 rounded-xl text-sm font-semibold text-white border-0 cursor-pointer flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 0 32px rgba(99,102,241,0.35)" }}
          >
            <Icon name="smart_toy" className="text-[18px]" style={FILL} /> Launch AI Console
          </button>
          <button
            onClick={() => navigate("/project")}
            className="px-8 py-3.5 rounded-xl text-sm font-semibold text-slate-300 border border-white/10 cursor-pointer flex items-center gap-2 hover:border-white/20"
            style={{ background: "rgba(255,255,255,0.04)", boxShadow: "none" }}
          >
            <Icon name="folder_open" className="text-[18px]" style={FILL} /> Start Project Analysis
          </button>
        </div>
      </motion.div>
    </Section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MODE SELECTOR — Full Scrollable Landing Page
   ════════════════════════════════════════════════════════════════════════ */
function ModeSelector() {
  const navigate = useNavigate();

  return (
    <div
      className="qt-landing"
      style={{ background: darkBg, minHeight: "100vh" }}
    >
      {/* Fixed background layers */}
      <GridOverlay />

      {/* Gradient mesh background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          background:
            "radial-gradient(ellipse 80% 50% at 50% 20%, rgba(99,102,241,0.1) 0%, transparent 60%), " +
            "radial-gradient(ellipse 60% 40% at 20% 80%, rgba(139,92,246,0.07) 0%, transparent 50%), " +
            "radial-gradient(ellipse 50% 40% at 80% 50%, rgba(34,211,238,0.05) 0%, transparent 50%)",
        }}
      />

      {/* Scrollable content */}
      <div className="relative" style={{ zIndex: 2 }}>
        <Hero navigate={navigate} />
        <Capabilities />
        <Agents />
        <ProjectAnalysis />
        <ImpactAnalysis />
        <ChatPreview />
        <TechStack />
        <CTA navigate={navigate} />

        {/* Footer */}
        <footer className="text-center py-10 border-t border-white/[0.04]">
          <p className="text-xs text-slate-600">
            © 2026 QuantumThread AI — You can switch modes anytime from the sidebar.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default ModeSelector;
