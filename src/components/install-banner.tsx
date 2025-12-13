"use client";

import { usePWA } from "./pwa-provider";
import { X, Download, Share } from "lucide-react";
import { Button } from "./ui/button";
import Image from "next/image";

export function InstallBanner() {
  const { 
    showInstallBanner, 
    isIOS, 
    isInstalled, 
    isStandalone,
    triggerInstall, 
    dismissInstallBanner 
  } = usePWA();

  // Don't show if already installed or in standalone mode
  if (isInstalled || isStandalone || !showInstallBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-md">
        <div className="relative flex items-center gap-3 rounded-xl bg-card border border-border shadow-lg p-3 backdrop-blur-sm">
          {/* App Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-card flex items-center justify-center overflow-hidden">
            <Image src="/icons/icon-96x96.svg" alt="AirLog" width={40} height={40} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              Install AirLog
            </p>
            <p className="text-xs text-muted-foreground">
              {isIOS 
                ? "Tap Share then \"Add to Home Screen\"" 
                : "Add to your home screen for quick access"
              }
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isIOS ? (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={dismissInstallBanner}
              >
                <Share className="h-4 w-4 text-green-500" />
                <span className="sr-only">Share instructions</span>
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 px-3"
                onClick={triggerInstall}
              >
                <Download className="h-4 w-4 mr-1" />
                Install
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={dismissInstallBanner}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
