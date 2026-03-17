"use client";

import {AnimatePresence, motion} from "framer-motion";
import {createContext, useCallback, useContext, useMemo, useState, type ComponentType, type ReactNode} from "react";
import {createPortal} from "react-dom";
import {CheckCircle2, Info, XCircle} from "lucide-react";
import {cn} from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const styleByType: Record<ToastType, {className: string; Icon: ComponentType<{className?: string}>}> = {
  success: {
    className: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
    Icon: CheckCircle2,
  },
  error: {
    className: "border-rose-500/30 bg-rose-500/15 text-rose-200",
    Icon: XCircle,
  },
  info: {
    className: "border-cyan-500/30 bg-cyan-500/15 text-cyan-200",
    Icon: Info,
  },
};

export function ToastProvider({children}: {children: ReactNode}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, {id, type, message}]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({showToast}), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined"
        ? createPortal(
            <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(92vw,360px)] flex-col gap-2">
              <AnimatePresence>
                {toasts.map((toast) => {
                  const variant = styleByType[toast.type];
                  const Icon = variant.Icon;
                  return (
                    <motion.div
                      key={toast.id}
                      initial={{opacity: 0, x: 20, scale: 0.98}}
                      animate={{opacity: 1, x: 0, scale: 1}}
                      exit={{opacity: 0, x: 24, scale: 0.98}}
                      transition={{duration: 0.18}}
                      className={cn(
                        "pointer-events-auto rounded-lg border px-3 py-2 shadow-lg backdrop-blur",
                        variant.className,
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="mt-0.5 h-4 w-4" />
                        <p className="text-sm leading-5">{toast.message}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>,
            document.body,
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
