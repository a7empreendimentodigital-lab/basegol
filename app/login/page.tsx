"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/SafeImage";
import { parseApiResponse } from "@/lib/api-client";
import { normalizeImageSrcOr, STATIC_ASSETS } from "@/lib/image-url";

type PublicBrand = {
  loginBackgroundUrl?: string | null;
};

const LOGIN_LOGO = STATIC_ASSETS.logoLogin;
const FALLBACK_LOGIN_IMAGE = STATIC_ASSETS.bannerPrincipal;

export default function LoginPage() {
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginImage, setLoginImage] = useState<string>(FALLBACK_LOGIN_IMAGE);

  useEffect(() => {
    if (window.location.hostname === "0.0.0.0") {
      const fixed = new URL(window.location.href);
      fixed.hostname = "localhost";
      window.location.replace(fixed.toString());
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("callbackUrl");
    if (raw?.startsWith("/")) {
      setCallbackUrl(raw);
    } else if (raw) {
      try {
        const u = new URL(raw);
        setCallbackUrl(`${u.pathname}${u.search}`);
      } catch {
        setCallbackUrl(raw);
      }
    }
  }, []);

  useEffect(() => {
    void fetch("/api/public/config")
      .then(async (res) => {
        if (!res.ok) return null;
        return parseApiResponse<{ brand: PublicBrand | null }>(res);
      })
      .then((cfg) => {
        if (cfg?.brand?.loginBackgroundUrl) {
          setLoginImage(
            normalizeImageSrcOr(cfg.brand.loginBackgroundUrl, FALLBACK_LOGIN_IMAGE)
          );
        }
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    if (res?.error || !res?.ok) {
      setLoading(false);
      setError("Email ou senha inválidos");
      return;
    }

    const params = new URLSearchParams();
    if (callbackUrl) params.set("callbackUrl", callbackUrl);
    const qs = params.toString();
    window.location.href = `/api/auth/redirect-after-login${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[7fr_3fr]">
      {/* Imagem — lado esquerdo, maior (~70%) */}
      <div className="relative min-h-[38vh] sm:min-h-[42vh] lg:min-h-screen">
        <SafeImage
          src={loginImage}
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="(max-width: 1024px) 100vw, 70vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-pitch/90 to-transparent lg:hidden pointer-events-none" />
      </div>

      {/* Formulário — lado direito (~30%) */}
      <div className="flex flex-col justify-center bg-pitch px-6 py-10 sm:px-10 lg:px-12 xl:px-14">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-8 flex justify-center px-2">
            <Link href="/" className="inline-flex w-full max-w-[280px] justify-center" aria-label="BaseGol — início">
              <SafeImage
                src={LOGIN_LOGO}
                alt="BaseGol"
                width={320}
                height={96}
                className="h-auto w-full max-h-24 sm:max-h-28 object-contain"
                priority
              />
            </Link>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-foreground">Acessar conta</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Entre com suas credenciais</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-pitch placeholder:text-pitch/40 focus:outline-none focus:ring-2 focus:ring-foreground/15"
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Senha
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-line bg-white px-4 py-3 pr-11 text-sm text-pitch placeholder:text-pitch/40 focus:outline-none focus:ring-2 focus:ring-foreground/15"
                  placeholder="Sua senha"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-pitch/50 hover:text-pitch transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Ver site
            </Link>
            <span aria-hidden className="text-line">
              |
            </span>
            <Link href="/reset-senha" className="hover:text-foreground transition-colors">
              Esqueci a senha
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
