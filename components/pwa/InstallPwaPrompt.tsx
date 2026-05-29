"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "basegol-pwa-install-dismissed";
const DISMISS_DAYS = 14;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches;
}

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function wasDismissedRecently() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (Number.isNaN(dismissedAt)) return false;
    const days = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    return days < DISMISS_DAYS;
  } catch {
    return false;
  }
}

function dismissPrompt() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function InstallPwaPrompt() {
  const [visible, setVisible] = useState(false);
  const [iosMode, setIosMode] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandaloneMode() || wasDismissedRecently() || !isMobileDevice()) return;

    const ios = isIosDevice();
    setIosMode(ios);
    setVisible(true);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIosMode(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  async function handleInstall() {
    if (iosMode) {
      setShowIosHelp(true);
      return;
    }
    if (!deferredPrompt) return;

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
        dismissPrompt();
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }

  function handleClose() {
    dismissPrompt();
    setVisible(false);
    setShowIosHelp(false);
  }

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed left-0 right-0 z-[45] px-3 md:hidden"
        style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom, 0px))" }}
        role="region"
        aria-label="Instalar aplicativo"
      >
        <div className="rounded-2xl border border-line bg-graphite-light shadow-lg p-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-selected/20 text-selected">
            <Download className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">Salvar no celular</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {iosMode
                ? "Adicione o BaseGol à tela inicial do iPhone."
                : deferredPrompt
                  ? "Instale o BaseGol para acesso rápido aos jogos ao vivo."
                  : "No Chrome, use o menu ⋮ e toque em «Instalar app» se o botão não ativar."}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="sm"
              className="h-9 px-3 text-xs"
              disabled={installing || (!iosMode && !deferredPrompt)}
              onClick={() => void handleInstall()}
            >
              {iosMode ? "Como instalar" : deferredPrompt ? "Instalar" : "…"}
            </Button>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-graphite transition-colors"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {showIosHelp && (
        <div
          className="fixed inset-0 z-[60] bg-pitch/80 backdrop-blur-sm flex items-end md:hidden"
          onClick={() => setShowIosHelp(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-install-title"
        >
          <div
            className="w-full rounded-t-2xl border-t border-line bg-graphite-light p-5 pb-8 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="ios-install-title" className="text-lg font-semibold text-foreground">
                Adicionar à Tela de Início
              </h2>
              <button
                type="button"
                onClick={() => setShowIosHelp(false)}
                className="text-muted-foreground p-1"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-selected text-white text-xs font-bold">
                  1
                </span>
                <span>
                  Toque em <Share className="inline h-4 w-4 mx-0.5 align-text-bottom" />{" "}
                  <strong className="text-foreground">Compartilhar</strong> na barra do Safari.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-selected text-white text-xs font-bold">
                  2
                </span>
                <span>
                  Role e escolha <strong className="text-foreground">Adicionar à Tela de Início</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-selected text-white text-xs font-bold">
                  3
                </span>
                <span>
                  Confirme em <strong className="text-foreground">Adicionar</strong>. O ícone do BaseGol
                  aparecerá na sua tela inicial.
                </span>
              </li>
            </ol>
            <Button className="w-full" onClick={() => setShowIosHelp(false)}>
              Entendi
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
