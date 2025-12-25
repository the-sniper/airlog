"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Show destructive (error) toasts on all devices, hide others on mobile
        const isCritical = variant === "destructive";
        const mobileVisibilityClass = isCritical ? "" : "hidden sm:flex";

        // Mobile-native styling: centered, full-width with padding on mobile
        const mobileNativeClass = "sm:max-w-[420px] max-w-[calc(100vw-2rem)] mx-auto";

        return (
          <Toast
            key={id}
            variant={variant}
            {...props}
            className={`${mobileVisibilityClass} ${mobileNativeClass}`}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport className="top-4 sm:top-auto sm:bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0" />
    </ToastProvider>
  );
}
