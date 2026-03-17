"use client";

import {useEffect, useRef} from "react";
import {io, type Socket} from "socket.io-client";
import {getAdminToken} from "@/lib/admin-auth";

type RealtimeEvent = {
  type: "new_report" | "report_updated" | "report_removed";
  reportId: string;
  payload?: unknown;
};

type AdminRealtimeCallbacks = {
  onNewReport?: (event: RealtimeEvent) => void;
  onReportUpdated?: (event: RealtimeEvent) => void;
  onReportRemoved?: (event: RealtimeEvent) => void;
  onConnectionChange?: (connected: boolean) => void;
};

export function useAdminRealtime(callbacks: AdminRealtimeCallbacks) {
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      callbacksRef.current.onConnectionChange?.(false);
      return;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "https://api.radarpuls.com";
    const socket = io(apiBase, {
      transports: ["websocket", "polling"],
      auth: {token},
    });

    socket.on("connect", () => {
      callbacksRef.current.onConnectionChange?.(true);
    });

    socket.on("disconnect", () => {
      callbacksRef.current.onConnectionChange?.(false);
    });

    socket.on("event", (data: RealtimeEvent) => {
      switch (data.type) {
        case "new_report":
          callbacksRef.current.onNewReport?.(data);
          break;
        case "report_updated":
          callbacksRef.current.onReportUpdated?.(data);
          break;
        case "report_removed":
          callbacksRef.current.onReportRemoved?.(data);
          break;
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      callbacksRef.current.onConnectionChange?.(false);
      socketRef.current = null;
    };
  }, []);
}
