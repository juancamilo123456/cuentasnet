import React, { useMemo, useState } from "react";
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
  ExternalLink,
  Clipboard,
  ClipboardCheck,
} from "lucide-react";

/**
 * ===============================================
 * CuentasNet – Pantalla principal (UI)
 * ===============================================
 */

/* ---------- Tipos que devuelve tu API ---------- */
type BaseItem = { at: string; subject?: string; preview?: string };

type HomeItem = BaseItem & {
  kind: "home_link";
  url: string;
  action?: { status: "ok" | "expired" | "failed" | "pending"; message: string };
};

type TravelLinkItem = BaseItem & { kind: "travel_link"; url: string };

type CodeItem = BaseItem & {
  kind: "travel_code" | "access_code";
  code: string;
};

type ResultItem = HomeItem | TravelLinkItem | CodeItem;

/* ---------- Proveedores soportados y su UI ---------- */
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

/* ---------- Componente helper con estilo glass ---------- */
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

/* ---------- Header ---------- */
function Header() {
  return (
    <header className="w-full pt-10 pb-8">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white/70 to-white/20 grid place-items-center font-bold text-black/80">
            CN
          </div>
          <h1 className="text-white text-2xl font-semibold tracking-tight">
            CuentasNet
          </h1>
        </div>
        <div className="text-white/60 text-sm">Panel personal • ultra-seguro</div>
      </div>
    </header>
  );
}

/* ---------- Hero ---------- */
function Hero() {
  return (
    <section className="max-w-4xl mx-auto px-6 text-center">
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl md:text-6xl leading-tight font-extrabold tracking-tight text-white"
      >
        Gestión segura y rápida de <br />
        <span className="text-white/90">códigos de acceso</span>
      </motion.h2>
      <p className="mt-4 text-white/70 max-w-2xl mx-auto">
        Centraliza y recupera tus códigos de verificación de tus plataformas
        favoritas. Diseñado para tu correo personal y control total.
      </p>
    </section>
  );
}

/* ---------- Tarjeta de proveedor ---------- */
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
      className={`p-6 md:p-7 ${p.border} ${p.glow} ${
        active ? "ring-2 ring-white/30" : "ring-0"
      } cursor-pointer hover:scale-[1.01] transition`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/10 grid place-items-center">
          <ChevronRight className="w-6 h-6 text-white/80" />
        </div>
        <div className="flex-1">
          <h3 className="text-white text-lg font-semibold">{p.title}</h3>
          <div className="mt-4 grid gap-2">
            {p.perks.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 text-white/80 text-sm"
              >
                <Icon className="w-4 h-4" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

/* ---------- Buscador por email ---------- */
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
    <GlassCard className="max-w-6xl mx-auto mt-10 p-6 sm:p-7">
      <form onSubmit={submit} className="px-2 sm:px-3">
        <h4 className="text-white text-xl font-semibold text-center">
          Consulta tu código de acceso
        </h4>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          {/* Email */}
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60"
              aria-hidden="true"
            />
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

          {/* Proveedor */}
          <select
            aria-label="Proveedor"
            value={provider}
            onChange={(e) => setProvider(e.target.value as ProviderKey)}
            className="rounded-2xl bg-white/10 text-white px-4 py-3 outline-none focus:ring-2 focus:ring-white/40"
          >
            <option value="netflix">Netflix</option>
            <option value="disney">Disney+</option>
            <option value="multi">Otro</option>
          </select>

          {/* Botón */}
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-white to-white/80 text-black font-semibold px-5 py-3 disabled:opacity-60"
            disabled={loading || !emailOk}
            aria-busy={loading}
          >
            <Search className="w-5 h-5" />
            {loading ? "Buscando…" : "Buscar Código"}
          </button>
        </div>

        {!emailOk && email.length > 0 && (
          <p className="mt-2 text-xs text-red-300">
            Ingresa un correo válido para continuar.
          </p>
        )}
      </form>
    </GlassCard>
  );
}

/* ---------- Helpers UI ---------- */
function timeStr(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function Badge({
  color = "slate",
  children,
}: {
  color?: "green" | "red" | "yellow" | "slate" | "blue";
  children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    green: "bg-green-500/15 text-green-300 ring-1 ring-inset ring-green-500/30",
    red: "bg-red-500/15 text-red-300 ring-1 ring-inset ring-red-500/30",
    yellow:
      "bg-yellow-500/15 text-yellow-200 ring-1 ring-inset ring-yellow-500/30",
    blue: "bg-blue-500/15 text-blue-200 ring-1 ring-inset ring-blue-500/30",
    slate: "bg-white/10 text-white/80 ring-1 ring-inset ring-white/15",
  };
  return (
    <span className={`px-2 py-1 rounded-xl text-xs ${map[color]}`}>
      {children}
    </span>
  );
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="inline-flex items-center gap-2 rounded-xl bg-white text-black font-semibold px-3 py-2"
      title="Copiar código"
    >
      {copied ? (
        <ClipboardCheck className="w-4 h-4" />
      ) : (
        <Clipboard className="w-4 h-4" />
      )}
      {copied ? "¡Copiado!" : "Copiar"}
    </button>
  );
}

/* ---------- Render de cada resultado ---------- */
function ResultCard({ it }: { it: ResultItem }) {
  if (it.kind === "home_link") {
    const st = it.action?.status || "pending";
    const badge =
      st === "ok"
        ? { color: "green" as const, text: "Hogar actualizado" }
        : st === "expired"
        ? { color: "red" as const, text: "Enlace expirado" }
        : st === "failed"
        ? { color: "red" as const, text: "No se pudo actualizar" }
        : { color: "blue" as const, text: "Listo para actualizar" };

    return (
      <li className="p-4 flex flex-col gap-2 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="text-left">
            <div className="font-semibold">Enlace de actualización de hogar</div>
            <div className="text-white/60 text-sm">
              {it.subject ?? "Netflix hogar"}
            </div>
          </div>
          <Badge color={badge.color}>{badge.text}</Badge>
        </div>

        <div className="text-white/60 text-sm">{timeStr(it.at)}</div>

        <div className="mt-2">
          <a
            href={it.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white text-black font-semibold px-3 py-2"
          >
            Abrir en Netflix <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </li>
    );
  }

  if (it.kind === "travel_link") {
    return (
      <li className="p-4 flex flex-col gap-2 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="text-left">
            <div className="font-semibold">Enlace de verificación por viaje</div>
            <div className="text-white/60 text-sm">
              {it.subject ?? "Netflix viaje"}
            </div>
          </div>
          <Badge color="slate">Enlace</Badge>
        </div>

        <div className="text-white/60 text-sm">{timeStr(it.at)}</div>

        <div className="mt-2">
          <a
            href={it.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white text-black font-semibold px-3 py-2"
          >
            Abrir verificación <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </li>
    );
  }

  // Códigos
  const label =
    it.kind === "travel_code" ? "Código de viaje" : "Código de acceso";
  return (
    <li className="p-4 flex flex-col gap-3 text-white">
      <div className="flex items-center justify-between gap-3">
        <div className="text-left">
          <div className="font-semibold">{label}</div>
          <div className="text-white/60 text-sm">{it.subject ?? "Netflix"}</div>
        </div>
        <Badge color="slate">Código</Badge>
      </div>

      <div className="text-white/60 text-sm">{timeStr(it.at)}</div>

      <div className="mt-1 flex items-center gap-3">
        <div className="text-3xl md:text-4xl font-extrabold tracking-[0.35em]">
          {it.code}
        </div>
        <CopyCode code={it.code} />
      </div>
    </li>
  );
}

/* ---------- Lista de resultados + estados ---------- */
function Results({
  items,
  searched,
  loading,
  needsAuth,
  errorMsg,
  onAuth,
}: {
  items: ResultItem[];
  searched: boolean;
  loading: boolean;
  needsAuth?: boolean;
  errorMsg?: string | null;
  onAuth?: () => void;
}) {
  if (needsAuth) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center text-white/80">
        <div className="text-6xl mb-3">🔐</div>
        <p className="mb-4">Para continuar, autoriza el acceso de lectura a tu Gmail.</p>
        <a
          href="/api/auth"
          onClick={(e) => {
            if (onAuth) {
              e.preventDefault();
              onAuth();
            }
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-white text-black font-semibold px-4 py-2"
        >
          Autorizar Gmail
        </a>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-10 text-center text-red-300">
        {errorMsg}
      </div>
    );
  }

  if (!searched && !items.length) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center text-white/70">
        <div className="text-7xl mb-4">🔍</div>
        <p>
          Selecciona un servicio e ingresa tu correo electrónico para buscar tus
          códigos de acceso
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center text-white/70">
        <div className="text-2xl">Buscando…</div>
      </div>
    );
  }

  if (searched && !items.length) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 text-center text-white/80">
        <div className="text-6xl mb-3">📭</div>
        <h4 className="text-xl font-semibold mb-1">Correo no encontrado</h4>
        <p className="text-white/70 max-w-xl mx-auto">
          No se hallaron mensajes recientes con códigos o enlaces. Verifica el
          correo escrito o inténtalo de nuevo en un momento.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6">
      <GlassCard className="p-2 sm:p-4">
        <ul className="divide-y divide-white/10">
          {items.map((it, idx) => (
            <ResultCard key={idx} it={it} />
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}

/* ---------- Página principal ---------- */
export default function CuentasNet() {
  const [selected, setSelected] = useState<ProviderKey>("netflix");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ResultItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mantener por si más adelante se usa info del proveedor
  useMemo(() => PROVIDERS.find((p) => p.key === selected), [selected]);

  const search = async () => {
    setLoading(true);
    setErrorMsg(null);
    setNeedsAuth(false);

    try {
      const url = `/api/codes?provider=${encodeURIComponent(
        selected
      )}&email=${encodeURIComponent(email)}`;
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || (data && data.needsAuth)) {
        setItems([]);
        setNeedsAuth(true);
      } else if (data && data.ok) {
        setItems((data.items || []) as ResultItem[]);
      } else {
        setItems([]);
        setErrorMsg(data?.error || "No fue posible realizar la búsqueda");
      }
    } catch {
      setItems([]);
      setErrorMsg("No se pudo conectar con el servidor");
    } finally {
      setSearched(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-aurora text-white">
      <Header />
      <Hero />

      {/* Tarjetas de proveedores */}
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

      {/* Buscador por email */}
      <EmailSearch
        email={email}
        setEmail={setEmail}
        provider={selected}
        setProvider={setSelected}
        onSearch={search}
        loading={loading}
      />

      {/* Resultados / estados */}
      <Results
        items={items}
        searched={searched}
        loading={loading}
        needsAuth={needsAuth}
        errorMsg={errorMsg}
        onAuth={() => {
          window.location.href = "/api/auth";
        }}
      />

      <footer className="mt-16 py-10 text-center text-white/50 text-xs">
        Creado por Juan Camilo Castellanos
      </footer>
    </div>
  );
}
