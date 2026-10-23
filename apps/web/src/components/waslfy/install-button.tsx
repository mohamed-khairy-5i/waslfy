'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * "ثبّت التطبيق" pill — appears only when the browser fires
 * beforeinstallprompt (Android/desktop Chrome-family). Hidden otherwise.
 */
export function InstallButton() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!deferred || installed) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferred(null);
  }

  return (
    <button
      onClick={install}
      className="flex items-center gap-1.5 rounded-full border border-[#e9aa3c]/40 bg-[#c97b10]/20 px-3.5 py-1.5 text-[11px] font-semibold text-[#ffd9a3] backdrop-blur-sm transition hover:bg-[#c97b10]/35 hover:text-white"
      title="ثبّت وصلّي كتطبيق على جهازك — يشتغل من غير نت"
    >
      <Download className="h-3.5 w-3.5" />
      ثبّت التطبيق
    </button>
  );
}
