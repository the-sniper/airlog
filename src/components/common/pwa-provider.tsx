"use client";

import { useState, useEffect, createContext, useContext, ReactNode } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAContextType {
  isInstalled: boolean;
  isInstallable: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  triggerInstall: () => Promise<void>;
  dismissInstallBanner: () => void;
  showInstallBanner: boolean;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error("usePWA must be used within a PWAProvider");
  }
  return context;
}

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed (within 7 days)
    const dismissedAt = localStorage.getItem("pwa-banner-dismissed");
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < sevenDays) {
        setBannerDismissed(true);
      }
    }

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Check if running in standalone mode (installed PWA)
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    
    setIsStandalone(standalone);
    setIsInstalled(standalone);

    // Listen for the beforeinstallprompt event (Android/Desktop Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      
      // Show banner if not dismissed and not installed
      if (!bannerDismissed && !standalone) {
        setShowInstallBanner(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowInstallBanner(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Show iOS banner after a short delay if on iOS and not installed
    if (isIOSDevice && !standalone && !bannerDismissed) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [bannerDismissed]);

  const triggerInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstalled(true);
      setShowInstallBanner(false);
    }
    
    setInstallPrompt(null);
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    setBannerDismissed(true);
    localStorage.setItem("pwa-banner-dismissed", Date.now().toString());
  };

  return (
    <PWAContext.Provider
      value={{
        isInstalled,
        isInstallable: !!installPrompt || isIOS,
        isIOS,
        isAndroid,
        isStandalone,
        installPrompt,
        triggerInstall,
        dismissInstallBanner,
        showInstallBanner,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}
