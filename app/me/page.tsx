import { Download, Mail, ArrowUpRight, Network, TrendingUp, KeyRound, ChevronRight } from "lucide-react";

const STATS = [
  { value: "4", suffix: "+", label: "years" },
  { value: "250", suffix: "+", label: "integrations" },
  { value: "27", suffix: "+", label: "AI agents" },
];

const TOOLKIT = [
  "TypeScript",
  "Python",
  "LangGraph",
  "React 19",
  "Node · FastAPI",
  "GCP",
  "Kubernetes",
  "Postgres",
];

export default function PortfolioPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-32 pt-10 sm:px-6">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-[66px] w-[66px] items-center justify-center rounded-[20px] border border-border font-extrabold text-accent"
            style={{ background: "linear-gradient(150deg,#15181D,#0b0d10)", boxShadow: "0 0 26px -8px rgba(43,229,255,.5)", fontSize: 24 }}
          >
            PP
          </div>
          <div className="flex-1">
            <span className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-good/30 bg-good/[0.12] px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-good shadow-[0_0_8px_var(--good)] animate-pf-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-good">Open to roles</span>
            </span>
            <h1 className="text-[23px] font-extrabold leading-tight tracking-tight">Pronoy Pant</h1>
            <p className="mt-0.5 text-[13px] font-semibold text-accent">
              Senior Software Engineer · AI Agents &amp; iPaaS
            </p>
          </div>
        </div>
        <p className="text-[13.5px] leading-relaxed text-[#c4ccd4]">
          Acting engineering lead, 4+ years across enterprise iPaaS, multi-agent AI, and cloud-native
          microservices. Ex–Walmart Global Tech. MS, Rensselaer.
        </p>
      </header>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-[14px] border border-border bg-surface p-3">
            <div className="font-mono text-[20px] font-medium leading-none">
              {s.value}
              <span className="text-accent">{s.suffix}</span>
            </div>
            <div className="mt-1 text-[10px] text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Selected work */}
      <section className="mt-6 flex flex-col gap-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Selected work</span>

        <div
          className="flex flex-col gap-2.5 rounded-[18px] border border-accent/[0.28] p-3.5"
          style={{ background: "linear-gradient(180deg,rgba(43,229,255,.05),var(--surface) 52%)", boxShadow: "0 0 40px -22px rgba(43,229,255,.5)" }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-accent text-accent-foreground shadow-glow">
              <Network size={20} />
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-bold">Langslide iPaaS &amp; AI platform</p>
              <p className="mt-px text-[11px] text-muted">13 services · LangGraph · GCP</p>
            </div>
            <span className="rounded-full bg-accent/[0.12] px-2 py-1 text-[10px] font-medium text-accent">Lead</span>
          </div>
          <p className="text-xs leading-relaxed text-[#9aa3ad]">
            Scaled the core engine 30→250+ integrations, architected 27+ LangGraph agents with PGVector
            RAG, and shipped a React Flow workflow builder.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 rounded-[18px] border border-border bg-surface p-3.5">
          <div className="flex items-center gap-3">
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-surface-2 text-foreground">
              <TrendingUp size={19} />
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-bold">Walmart OrderCentral</p>
              <p className="mt-px text-[11px] text-muted">Sam&apos;s Club · SDE III · 200+ stakeholders</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-[#9aa3ad]">
            Owned a real-time supply-chain dashboard serving 200+ daily stakeholders, eliminating 15+
            hrs/week of manual reporting at 99.9% uptime.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-[18px] border border-border bg-surface p-4">
          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-surface-2 text-foreground">
            <KeyRound size={19} />
          </span>
          <div className="flex-1">
            <p className="text-[15px] font-bold">Rayni · FloodIndex.tech</p>
            <p className="mt-px text-[11px] text-muted">Advisor ($1M+ seed) · NASA-collab analytics</p>
          </div>
          <ChevronRight size={17} className="text-[#4a525c]" />
        </div>
      </section>

      {/* Toolkit */}
      <section className="mt-6 flex flex-col gap-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Toolkit</span>
        <div className="flex flex-wrap gap-2">
          {TOOLKIT.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-[#c4ccd4]"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Sticky footer actions */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[#181b20] bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-xl items-center gap-2.5 px-5 pb-6 pt-3 sm:px-6">
          <a
            href="/Pronoy_Pant_Resume.pdf"
            download
            className="flex flex-1 items-center justify-center gap-2 rounded-[13px] bg-accent py-3.5 text-sm font-bold text-accent-foreground shadow-glow"
          >
            <Download size={17} strokeWidth={2.3} /> Download CV
          </a>
          <a
            href="mailto:pantpronoy@gmail.com"
            className="flex h-[50px] w-[50px] items-center justify-center rounded-[13px] border border-border bg-surface-2 text-foreground"
            aria-label="Email Pronoy"
          >
            <Mail size={20} />
          </a>
          <a
            href="https://linkedin.com/in/pronoy-pant"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[50px] w-[50px] items-center justify-center rounded-[13px] border border-border bg-surface-2 text-foreground"
            aria-label="LinkedIn profile"
          >
            <ArrowUpRight size={20} />
          </a>
        </div>
      </div>
    </main>
  );
}
