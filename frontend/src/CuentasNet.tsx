import React, { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  CheckCircle2,
  Shield,
  Flashlight,
  Mail,
  House,
  Sparkle,
  Link2,
  Timer,
  ChevronRight,
  AlertTriangle, 
  MailSearch, 
  RotateCcw,
  Zap,
  Check,
  ChevronDown,
} from "lucide-react";

/* ===================== Tipos ===================== */
type LatestMail = {
  ok: boolean;
  id: string;
  threadId: string;
  internalDate?: string;
  headers?: { subject?: string };
  html?: string | null;
  text?: string | null;
};

/* ====== API base (Render o local) ====== */
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const api = (p: string) => (API_BASE ? `${API_BASE}${p}` : p);

const PROVIDERS = [
  {
    key: "netflix",
    title: "Netflix",
    border: "border-red-500/40",
    glow: "shadow-[0_0_120px_-20px_rgba(239,68,68,0.35)]",
    perks: [
      { icon: Timer, text: "Códigos de acceso temporal" },
      { icon: Link2, text: "Enlaces de verificación" },
      { icon: House, text: "Actualización de hogar" },
    ],
  },
  {
    key: "disney",
    title: "Disney+",
    border: "border-blue-500/40",
    glow: "shadow-[0_0_120px_-20px_rgba(59,130,246,0.35)]",
    perks: [
      { icon: CheckCircle2, text: "Códigos de ingreso" },
      { icon: Shield, text: "Verificación en dos pasos" },
      { icon: Flashlight, text: "Acceso inmediato" },
    ],
  },
  {
    key: "multi",
    title: "Y muchas más",
    border: "border-cyan-500/40",
    glow: "shadow-[0_0_120px_-20px_rgba(34,211,238,0.35)]",
    perks: [
      { icon: Sparkle, text: "Códigos de múltiples servicios" },
      { icon: Shield, text: "Verificación rápida y segura" },
      { icon: Link2, text: "Todo en un solo panel" },
    ],
  },
] as const;
type ProviderKey = (typeof PROVIDERS)[number]["key"];

/* ===================== UI helpers ===================== */
function GlassCard({
  children,
  className = "",
  ...rest
}: React.PropsWithChildren<
  React.HTMLAttributes<HTMLDivElement> & { className?: string }
>) {
  return (
    <div
      {...rest}
      className={[
        "relative rounded-3xl border border-white/10",
        "bg-white/5 backdrop-blur-xl ring-1 ring-white/10",
        "shadow-xl shadow-black/20",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 bg-ink-900/70 backdrop-blur-md border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">
            Cuentas<span className="text-accent-400">plus</span><span className="text-brand-500">+</span>
          </span>
        </a>
        <nav className="hidden sm:flex items-center gap-6 text-white/80">
          <a className="hover:text-white" href="https://cuentasplus.onrender.com/#catalogo" target="_blank" rel="noreferrer">Plataforma Cuentasplus+</a>
        </nav>
        <a
          href="https://wa.me/573207389394?text=Hola%20%C2%A1quiero%20comprar!"
          target="_blank"
          rel="noreferrer"
          className="btn-primary hidden sm:inline-flex"
        >
          WhatsApp
        </a>
      </div>
    </header>
  );
}
function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-10 text-center">
      {/* Badges superiores */}
      <div className="flex justify-center gap-3 mb-4">
        <span className="badge">
          <Zap className="w-4 h-4 text-blue-300" aria-hidden="true" />
          Entrega rápida
        </span>
        <span className="badge">
          <Shield className="w-4 h-4 text-purple-300" aria-hidden="true" />
          Soporte 7/7
        </span>
        <span className="badge">
          <Check className="w-4 h-4 text-green-300" aria-hidden="true" />
          Pagos seguros
        </span>
      </div>

      {/* Título principal */}
      <h2 className="grad-title text-4xl md:text-6xl font-extrabold leading-tight">
        Gestión de códigos de acceso,
        <br className="hidden md:block" />
        <span className="block">todo en un solo lugar</span>
      </h2>

      {/* Subtítulo */}
      <p className="mt-4 text-white/70 max-w-2xl mx-auto">
        Centraliza y recupera tus códigos de verificación (Netflix, Disney+, etc.).
        Entrega inmediata y soporte garantizado.
      </p>
    </section>
  );
}
function ProviderCard({
  p,
  active,
  onSelect,
}: {
  p: (typeof PROVIDERS)[number];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <GlassCard
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
      className={`glass p-6 md:p-7 transition hover:scale-[1.01] ${
        active ? "ring-2 ring-white/20" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/10 grid place-items-center">
          <ChevronRight className="w-6 h-6 text-white/80" />
        </div>

        <div className="flex-1">
          <h3 className="text-white text-lg font-semibold">{p.title}</h3>

          <div className="mt-4 grid gap-2">
            {p.perks.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-white/80 text-sm">
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
function ProviderSelect({
  value,
  onChange,
}: {
  value: ProviderKey;
  onChange: (v: ProviderKey) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const current = PROVIDERS.find((p) => p.key === value)!;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="w-[140px] rounded-2xl bg-white/10 text-white px-4 py-3 outline-none focus:ring-2 focus:ring-white/40 inline-flex items-center justify-between"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate">{current.title}</span>
        <ChevronDown className="w-4 h-4 opacity-80" aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-2 w-[200px] rounded-xl bg-[#10131a] border border-white/10 shadow-xl overflow-hidden"
        >
          {PROVIDERS.map((p) => (
            <li
              key={p.key}
              role="option"
              aria-selected={p.key === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(p.key);
                setOpen(false);
              }}
              className={`px-4 py-2 cursor-pointer hover:bg-white/10 ${
                p.key === value ? "bg-white/5 text-white" : "text-white/90"
              }`}
            >
              {p.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
function EmailSearch({
  email,
  setEmail,
  provider,
  setProvider,
  onSearch,
  loading,
}: {
  email: string;
  setEmail: (v: string) => void;
  provider: ProviderKey;
  setProvider: (v: ProviderKey) => void;
  onSearch: () => void;
  loading: boolean;
}) {
  const emailOk = /\S+@\S+\.\S+/.test(email);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && emailOk) onSearch();
  };

  return (
    <GlassCard className="glass max-w-6xl mx-auto mt-10 p-6 sm:p-7" id="buscar">
      <form onSubmit={submit} className="px-2 sm:px-3">
        <h4 className="text-white text-xl font-semibold text-center">
          Consulta tu código de acceso
        </h4>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          {/* email */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" aria-hidden="true" />
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-label="Correo electrónico"
              placeholder="Ingresa tu correo electrónico registrado"
              className="w-full rounded-2xl bg-white/10 text-white placeholder-white/50 pl-11 pr-4 py-3 outline-none focus:ring-2 focus:ring-white/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* proveedor (dropdown custom) */}
          <ProviderSelect value={provider} onChange={setProvider} />

          {/* submit */}
          <button
            type="submit"
            className="btn-primary disabled:opacity-60"
            disabled={loading || !emailOk}
            aria-busy={loading}
          >
            <Search className="w-5 h-5" aria-hidden="true" />
            {loading ? "Buscando…" : "Buscar Código"}
          </button>
        </div>

        {!emailOk && email.length > 0 && (
          <p className="mt-2 text-xs text-red-300">Ingresa un correo válido para continuar.</p>
        )}
      </form>
    </GlassCard>
  );
}



/* -------- Auto-height para iframe (srcDoc = same-origin) -------- */
function useAutoHeight() {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const onLoad = () => {
    const el = ref.current;
    if (!el) return;
    try {
      const doc = el.contentDocument;
      if (!doc) return;
      const h = Math.min(Math.max(doc.body.scrollHeight, 560), 1400);
      el.style.height = `${h}px`;
    } catch {}
  };
  return { ref, onLoad };
}

/* ===========================================================
   wrapEmailHtml – tarjetita negra, angosta y sin grises
   (sin scripts; todo se hace antes de entrar al iframe)
   =========================================================== */
function wrapEmailHtml(raw: string) {
  if (!raw) return raw;

  // 1) Parse: intenta extraer el bloque "blanco" principal
  let primaryInner = "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "text/html");

    const candidates = Array.from(doc.querySelectorAll<HTMLElement>("*")).filter(
      (el) => {
        const bg = (el.getAttribute("bgcolor") || "").toLowerCase();
        const st = (el.getAttribute("style") || "").toLowerCase();
        const hasWhite =
          bg.includes("#fff") ||
          bg === "white" ||
          st.includes("background:#fff") ||
          st.includes("background:#ffffff") ||
          st.includes("background-color:#fff") ||
          st.includes("background-color:#ffffff");
        return hasWhite && el.innerHTML.trim().length > 200;
      }
    );

    if (candidates.length) {
      candidates.sort((a, b) => b.innerHTML.length - a.innerHTML.length);
      primaryInner = candidates[0].innerHTML;
    } else {
      primaryInner = doc.body ? doc.body.innerHTML : raw;
    }
  } catch {
    primaryInner = raw;
  }

  // 2) Estilos del visor (tarjeta negra angosta, sin grises)
  const css = `
    :root { color-scheme: dark; }
    html, body { margin: 0; padding: 0; background: transparent !important; }
    a { color: inherit !important; text-decoration: underline; }

    /* Contenedor centrado sin marco externo */
    .cn-wrap {
      padding: 0;
      background: transparent !important;
      display: flex;
      justify-content: center;
    }

    /* Tarjeta más angosta y formal */
    .cn-card {
      background: #0b0c10;       /* negro elegante */
      color: #f2f4f7;
      width: 100%;
      max-width: 560px;          /* << más angosto */
      border-radius: 24px;       /* bordes bien redondeados */
      overflow: hidden;
      box-shadow: 0 18px 48px rgba(0,0,0,.40); /* sombra más discreta */
      border: 1px solid rgba(255,255,255,.08);
    }
    .cn-inner { padding: 8px 14px 14px; }

    /* Quitar backgrounds heredados (grises externos) */
    table, td, tr, body, html { background: transparent !important; }
    [bgcolor], [style*="background:"], [style*="background-color:"] {
      background: transparent !important;
    }

    /* Mantener CTA rojo de Netflix */
    [style*="#e50914"], [bgcolor="#e50914"] {
      background: #e50914 !important; color: #fff !important;
    }

    /* Tipografía consistente y clara */
    .cn-card, .cn-card * {
      color: #f2f4f7 !important;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    }

    /* Imágenes fluidas y tablas responsivas */
    img { max-width: 100% !important; height: auto !important; display: block; }
    table { width: 100% !important; border-collapse: collapse !important; }
  `;

  const base = `<base target="_blank">`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  ${base}
  <style>${css}</style>
</head>
<body>
  <div class="cn-wrap">
    <div class="cn-card">
      <div class="cn-inner">
        ${primaryInner}
      </div>
    </div>
  </div>
</body>
</html>`;
}

/* ===================== Visor ===================== */
/* ===================== Visor ===================== */
function LatestMailViewer({
  mail,
  searched,
  loading,
  needsAuth,
  errorMsg,
  onAuth,
  onRetry,
}: {
  mail: LatestMail | null;
  searched: boolean;
  loading: boolean;
  needsAuth?: boolean;
  errorMsg?: string | null;
  onAuth?: () => void;
  onRetry?: () => void;
}) {
  if (needsAuth) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center text-white/80">
        <div className="text-6xl mb-3">🔐</div>
        <p className="mb-4">Para continuar, autoriza el acceso de lectura a tu Gmail.</p>
        <a
          href={api("/api/auth")}
          onClick={(e) => {
            if (onAuth) {
              e.preventDefault();
              onAuth();
            }
          }}
          className="btn-primary"
        >
          Autorizar Gmail
        </a>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Borde degradado + vidrio */}
        <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-r from-rose-500/60 via-fuchsia-500/60 to-sky-400/60">
          <div className="rounded-2xl bg-black/70 backdrop-blur-xl border border-white/10 p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="w-12 h-12 rounded-xl bg-rose-500/15 grid place-items-center text-rose-300">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-white text-lg font-semibold">
                  No se encontraron códigos para este alias
                </h4>
                <p className="mt-1 text-white/70 leading-relaxed">
                  {errorMsg}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/70">
                  <div className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5">
                    <MailSearch className="w-4 h-4" />
                    <span>Prueba con otro alias o busca de nuevo</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRetry && onRetry()}
                    className="btn-primary"
                    title="Reintentar"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reintentar
                  </button>
                </div>

                <p className="mt-3 text-xs text-white/50">
                  Consejo: escribe el alias exacto (ej. <span className="font-mono">usuario+netflix@gmail.com</span>).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!searched && !mail && !loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center text-white/70">
        <div className="text-7xl mb-4">🔍</div>
        <p>Ingresa el correo y buscaremos el codigo de acceso o actualizacion hogar.</p>
      </div>
    );
  }

if (loading) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="spinner-ring" aria-label="Cargando" />
        <p className="text-white/70">Buscando…</p>
      </div>
    </div>
  );
}


  if (!mail) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center text-white/80">
        <div className="text-6xl mb-3">📭</div>
        <h4 className="text-xl font-semibold mb-1">Correo no encontrado</h4>
        <p className="text-white/70 max-w-xl mx-auto">
          No se hallaron mensajes para ese alias. Verifica el correo escrito.
        </p>
      </div>
    );
  }

  // === visor ===
  const { ref, onLoad } = useAutoHeight();

  return (
    <div className="max-w-6xl mx-auto px-6">
      <div className="mt-2">
        {mail.html ? (
          <iframe
            ref={ref}
            onLoad={onLoad}
            title="email"
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            style={{
              width: "100%",
              height: "80vh",
              border: "none",
              display: "block",
              background: "transparent",
            }}
            srcDoc={wrapEmailHtml(mail.html || mail.text || "")}
          />
        ) : mail.text ? (
          <pre className="text-white/90 whitespace-pre-wrap bg-black/80 p-6 rounded-[26px]">
            {mail.text}
          </pre>
        ) : (
          <div className="text-white/70 p-6">Sin contenido.</div>
        )}
      </div>
    </div>
  );
}


/* ===================== Página principal ===================== */
export default function CuentasNet() {
  const [selected, setSelected] = useState<ProviderKey>("netflix");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mail, setMail] = useState<LatestMail | null>(null);

  useMemo(() => PROVIDERS.find((p) => p.key === selected), [selected]);

  const search = async () => {
    setLoading(true);
    setErrorMsg(null);
    setNeedsAuth(false);
    setMail(null);

    try {
      const res = await fetch(api("/api/mail/latest"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias: email.trim().toLowerCase(),
          restrict: "netflix_access_or_home",
        }),
      });

      const data: LatestMail | any = await res.json().catch(() => ({}));

      if (res.status === 401 || data?.needsAuth) {
        setNeedsAuth(true);
      } else if (res.ok && data?.ok) {
        setMail(data as LatestMail);
      } else {
        setErrorMsg(data?.error || "No fue posible obtener el correo");
      }
    } catch {
      setErrorMsg("No se pudo conectar con el servidor");
    } finally {
      setSearched(true);
      setLoading(false);
    }
  };

  return (
   <div className="min-h-screen w-full bg-site text-white">
      <Header />
      <Hero />

      <section className="max-w-6xl mx-auto px-6 mt-10 grid gap-5 md:grid-cols-3 pb-2">
        {PROVIDERS.map((p) => (
          <ProviderCard
            key={p.key}
            p={p}
            active={selected === p.key}
            onSelect={() => setSelected(p.key)}
          />
        ))}
      </section>

      <EmailSearch
        email={email}
        setEmail={setEmail}
        provider={selected}
        setProvider={setSelected}
        onSearch={search}
        loading={loading}
      />

      <LatestMailViewer
        mail={mail}
        searched={searched}
        loading={loading}
        needsAuth={needsAuth}
        errorMsg={errorMsg}
        onAuth={() => {
          window.location.href = api("/api/auth");
        }}
        onRetry={search}
      />

      <footer className="mt-16 py-10 text-center text-white/50 text-xs">
        <a
          href="https://wa.me/573207389394?text=Hola%20%C2%A1vi%20tu%20panel%20de%20c%C3%B3digos!"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition underline underline-offset-4"
          title="Escríbeme por WhatsApp"
        >
          Creado por Juan Camilo Castellanos
        </a>
      </footer>
    </div>
  );
}
