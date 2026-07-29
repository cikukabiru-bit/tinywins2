import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check display mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !(window as any).MSStream;
    
    // Check if dismissed recently
    const dismissedTime = localStorage.getItem('pwa_install_dismissed');
    const now = Date.now();
    const isRecentlyDismissed = dismissedTime && (now - parseInt(dismissedTime, 10)) < 3 * 24 * 60 * 60 * 1000; // 3 days cooldown

    if (isRecentlyDismissed) return;

    if (isIOSDevice) {
      setIsIOS(true);
      // Wait a bit after load to show the iOS instructions guide
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowBanner(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Check if prompt is already available (fired before mounting)
      // Some browsers might support caching this or triggering it differently
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Hide banner first
    setShowBanner(false);

    // Show native prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install prompt choice: ${outcome}`);

    // Clear the deferred prompt variable
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Persist dismissal timestamp to avoid annoying the user on every page load
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-sm z-50 animate-fadeIn">
      <div className="bg-surface/90 backdrop-blur-md border border-border-main/20 p-5 rounded-2xl shadow-xl flex flex-col gap-4 text-left">
        <div className="flex items-start gap-3">
          {/* App Icon Swatch */}
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/10 select-none">
            <span className="text-on-primary font-serif font-semibold italic text-base">W</span>
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-serif text-sm font-semibold text-text-main italic">
              Install TinyWins
            </h5>
            <p className="text-[11px] text-text-muted/80 font-light mt-0.5 leading-normal">
              Add TinyWins to your home screen for quick, fullscreen offline access.
            </p>
          </div>
          <button 
            onClick={handleDismiss}
            className="text-text-muted/40 hover:text-text-main transition-colors p-1 cursor-pointer shrink-0"
            title="Dismiss prompt"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isIOS ? (
          <div className="border-t border-border-main/5 pt-3 text-[10px] text-text-muted/90 flex flex-col gap-1.5 leading-relaxed bg-surface-dark/10 p-3 rounded-xl border border-border-main/10 select-none">
            <div className="flex items-center gap-1.5 font-medium text-text-main">
              <span>Install guide for Safari on iOS:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-surface border border-border-main/25 px-1.5 py-0.5 rounded shadow-2xs font-semibold shrink-0">1</span>
              <span>Tap the <strong>Share</strong> button <svg className="w-3.5 h-3.5 inline text-primary shrink-0 -mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> in Safari.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-surface border border-border-main/25 px-1.5 py-0.5 rounded shadow-2xs font-semibold shrink-0">2</span>
              <span>Scroll down and tap <strong>Add to Home Screen</strong> <svg className="w-3.5 h-3.5 inline text-primary shrink-0 -mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>.</span>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-primary hover:bg-primary-strong text-on-primary py-2 px-3 rounded-xl font-medium text-xs text-center cursor-pointer transition-colors shadow-sm shadow-primary/10"
            >
              Add to Home Screen
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 border border-border-main/20 hover:border-border-main/40 text-primary py-2 rounded-xl font-medium text-xs text-center cursor-pointer transition-colors bg-surface"
            >
              Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
