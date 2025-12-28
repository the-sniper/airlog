"use client";

import { usePWA } from "./pwa-provider";
import { X, Download, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";

export function InstallBanner() {
  const {
    showInstallBanner,
    isIOS,
    isInstalled,
    isStandalone,
    triggerInstall,
    dismissInstallBanner,
  } = usePWA();

  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Don't show if already installed or in standalone mode
  if (isInstalled || isStandalone || !showInstallBanner) {
    return null;
  }

  // iOS instructions modal
  if (isIOS && showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-md mx-3 mb-3 rounded-xl bg-card border border-border shadow-xl p-4 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Install AirLog
            </h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => setShowIOSInstructions(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Tap the{" "}
                  <Share className="inline h-4 w-4 text-blue-500 mx-1" /> Share
                  button in Safari&apos;s toolbar
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Scroll down and tap{" "}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs font-medium">
                    <Plus className="h-3 w-3" /> Add to Home Screen
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Tap <span className="font-medium">Add</span> to install the
                  app
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <Button
              className="w-full"
              onClick={() => {
                setShowIOSInstructions(false);
                dismissInstallBanner();
              }}
            >
              Got it
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 animate-in slide-in-from-bottom duration-300">
      <div className="mx-auto max-w-md">
        <div className="relative flex items-center gap-3 rounded-xl bg-card border border-border shadow-lg p-3 backdrop-blur-sm">
          {/* App Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-card flex items-center justify-center overflow-hidden">
            <Image
              src="/icons/icon-96x96.png"
              alt="AirLog"
              width={40}
              height={40}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              Install AirLog
            </p>
            <p className="text-xs text-muted-foreground">
              {isIOS
                ? 'Tap Share then "Add to Home Screen"'
                : "Add to your home screen for quick access"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isIOS ? (
              <Button
                size="sm"
                className="h-8 px-3"
                onClick={() => setShowIOSInstructions(true)}
              >
                <Share className="h-4 w-4 mr-1" />
                Install
              </Button>
            ) : (
              <Button size="sm" className="h-8 px-3" onClick={triggerInstall}>
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
