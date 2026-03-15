"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {useTranslations} from "next-intl";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import {MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import markersData from "@/data/markers.json";
import {
  API_BASE,
  fetchMapReports,
  type MapEventType,
  type MapReport,
  submitMapReport,
  subscribeToZoneNotifications,
  voteMapReport,
} from "@/lib/api";
import {TimeFilter, type TimeWindow} from "@/components/map/time-filter";
import {TypeFilter} from "@/components/map/type-filter";
import {useTheme} from "@/lib/hooks/use-theme";
import {cn} from "@/lib/utils";
import {haversineDistance} from "@/lib/geo-utils";
import {useAlertSound} from "@/lib/hooks/use-alert-sound";
import {Bell, Flame, LocateFixed, MapPin, Plus, Volume2, VolumeX} from "lucide-react";
import "leaflet.heat";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const ALL_TYPES: MapEventType[] = ["police", "radar", "checkpoint", "accident", "traffic_jam", "unknown"];

const markerConfig: Record<MapEventType, {bg: string; border: string; emoji: string}> = {
  police: {bg: "#DC2626", border: "#FCA5A5", emoji: "👮"},
  radar: {bg: "#D97706", border: "#FCD34D", emoji: "📡"},
  checkpoint: {bg: "#2563EB", border: "#93C5FD", emoji: "🚧"},
  accident: {bg: "#7C3AED", border: "#C4B5FD", emoji: "💥"},
  traffic_jam: {bg: "#059669", border: "#6EE7B7", emoji: "🚗"},
  unknown: {bg: "#6B7280", border: "#D1D5DB", emoji: "❓"},
};

const markerSvgMap: Record<MapEventType, string> = {
  police: "/images/markers/police.svg",
  radar: "/images/markers/radar.svg",
  checkpoint: "/images/markers/checkpoint.svg",
  accident: "/images/markers/accident.svg",
  traffic_jam: "/images/markers/traffic.svg",
  unknown: "/images/markers/unknown.svg",
};

const STORAGE_KEYS = {
  soundEnabled: "rp-map-sound-enabled",
  liveTrackingEnabled: "rp-map-live-tracking-enabled",
  proximityRadiusM: "rp-map-proximity-radius-m",
} as const;

const PROXIMITY_ALERT_COOLDOWN_MS = 5 * 60 * 1000;

const markerLabelKey: Record<MapEventType, string> = {
  police: "types.police",
  radar: "types.radar",
  checkpoint: "types.checkpoint",
  accident: "types.accident",
  traffic_jam: "types.trafficJam",
  unknown: "types.unknown",
};

interface LegacyDemoReport {
  id: number;
  lat: number;
  lng: number;
  type: "police" | "radar" | "checkpoint";
  label: string;
  location: string;
  time: string;
  votes: number;
}

interface ReportFormState {
  eventType: MapEventType;
  locationText: string;
  description: string;
  lat: string;
  lng: string;
}

interface MapClientProps {
  heightClassName?: string;
  showDisclaimer?: boolean;
}

function createMarkerIcon(type: MapEventType) {
  const cfg = markerConfig[type];
  const iconPath = markerSvgMap[type];
  return L.divIcon({
    html: `<div style="
      background:${cfg.bg};
      width:36px;height:36px;
      border-radius:50%;
      border:2.5px solid ${cfg.border};
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 10px rgba(0,0,0,0.25);
      overflow:hidden;
      cursor:pointer;
    "><img src="${iconPath}" alt="${type}" style="width:20px;height:20px;display:block;"/></div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
}

function createUserLocationIcon() {
  return L.divIcon({
    html: `<div style="
      width:34px;height:34px;
      border-radius:50%;
      border:2.5px solid #93C5FD;
      background:#1D4ED8;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 10px rgba(0,0,0,0.25);
      overflow:hidden;
      cursor:pointer;
    "><img src="/images/markers/user.svg" alt="user" style="width:19px;height:19px;display:block;"/></div>`,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });
}

function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  return null;
}

function FocusOnActive({report}: {report: MapReport | null}) {
  const map = useMap();

  useEffect(() => {
    if (!report) {
      return;
    }
    map.flyTo([report.lat, report.lng], Math.max(map.getZoom(), 13), {duration: 0.6});
  }, [map, report]);

  return null;
}

function FocusOnUserLocation({location}: {location: [number, number] | null}) {
  const map = useMap();

  useEffect(() => {
    if (!location) {
      return;
    }
    map.flyTo(location, Math.max(map.getZoom(), 14), {duration: 0.8});
  }, [location, map]);

  return null;
}

function CaptureMapClick({enabled, onPick}: {enabled: boolean; onPick: (coords: [number, number]) => void}) {
  useMapEvents({
    click(event) {
      if (!enabled) {
        return;
      }
      onPick([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

function HeatLayer({reports}: {reports: MapReport[]}) {
  const map = useMap();

  useEffect(() => {
    const points = reports.map((report) => {
      const score = Math.max(0.2, (report.confidence ?? 50) / 100);
      return [report.lat, report.lng, score] as [number, number, number];
    });

    if (points.length === 0) {
      return;
    }

    const layer = (L as unknown as {
      heatLayer: (latlngs: Array<[number, number, number]>, options?: Record<string, unknown>) => L.Layer;
    }).heatLayer(points, {
      radius: 24,
      blur: 22,
      maxZoom: 17,
      minOpacity: 0.32,
      gradient: {
        0.2: "#60A5FA",
        0.4: "#22D3EE",
        0.6: "#FACC15",
        0.85: "#FB923C",
        1.0: "#EF4444",
      },
    });

    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, reports]);

  return null;
}

function toSince(windowValue: TimeWindow): string {
  const now = Date.now();
  const hours = windowValue === "1h" ? 1 : windowValue === "6h" ? 6 : windowValue === "12h" ? 12 : 24;
  return new Date(now - hours * 60 * 60 * 1000).toISOString();
}

function formatRelativeValue(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(deltaMs / 1000));

  if (sec < 60) {
    return `${sec}s`;
  }

  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min} min`;
  }

  const hr = Math.floor(min / 60);
  return `${hr}h`;
}

function resolveExpiry(report: MapReport): string {
  if (report.expiresAt) {
    return report.expiresAt;
  }
  return new Date(new Date(report.createdAt).getTime() + 1 * 60 * 60 * 1000).toISOString();
}

function isExpired(report: MapReport): boolean {
  return new Date(resolveExpiry(report)).getTime() <= Date.now();
}

function shouldHideFromVotes(report: MapReport): boolean {
  if (report.upvotes <= 0) {
    return report.downvotes >= 2;
  }
  return report.downvotes > report.upvotes * 2;
}

function formatCountdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) {
    return "0m";
  }
  const min = Math.floor(diff / (60 * 1000));
  if (min < 60) {
    return `${min}m`;
  }
  const hours = Math.floor(min / 60);
  const rem = min % 60;
  return `${hours}h ${rem}m`;
}

function confidenceClass(confidence: number | null): string {
  if (confidence === null) {
    return "bg-slate-100 text-slate-600";
  }
  if (confidence >= 80) {
    return "bg-emerald-100 text-emerald-700";
  }
  if (confidence >= 50) {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-rose-100 text-rose-700";
}

function normalizeDemoReports(): MapReport[] {
  const demo = markersData as LegacyDemoReport[];
  return demo.map((item, index) => ({
    id: `demo-${item.id}`,
    eventType: item.type,
    locationText: item.location,
    senderName: null,
    eventTime: new Date(Date.now() - (index + 2) * 60 * 1000).toISOString(),
    lat: item.lat,
    lng: item.lng,
    geoSource: "demo",
    rawMessage: null,
    confidence: null,
    createdAt: new Date(Date.now() - (index + 2) * 60 * 1000).toISOString(),
    description: item.label,
    upvotes: item.votes,
    downvotes: 0,
    expiresAt: new Date(Date.now() + (90 - index * 5) * 60 * 1000).toISOString(),
  }));
}

export default function MapClient({heightClassName = "h-[480px]", showDisclaimer = false}: MapClientProps) {
  const t = useTranslations("map");
  const {theme} = useTheme();
  const [reports, setReports] = useState<MapReport[]>([]);
  const [activeReport, setActiveReport] = useState<MapReport | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<MapEventType[]>(ALL_TYPES);
  const [selectedWindow, setSelectedWindow] = useState<TimeWindow>("6h");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [liveTrackingEnabled, setLiveTrackingEnabled] = useState(false);
  const [proximityRadiusM, setProximityRadiusM] = useState(300);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastProximityInfo, setLastProximityInfo] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<"markers" | "heatmap">("markers");
  const [voteBusyId, setVoteBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [pickCoords, setPickCoords] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushInfo, setPushInfo] = useState<string | null>(null);
  const [form, setForm] = useState<ReportFormState>({
    eventType: "police",
    locationText: "",
    description: "",
    lat: "",
    lng: "",
  });
  const alertedRef = useRef<Map<string, number>>(new Map());
  const watchIdRef = useRef<number | null>(null);
  const {playByType} = useAlertSound(soundEnabled);

  const typeLabels = useMemo(() => {
    return {
      police: t("types.police"),
      radar: t("types.radar"),
      checkpoint: t("types.checkpoint"),
      accident: t("types.accident"),
      traffic_jam: t("types.trafficJam"),
      unknown: t("types.unknown"),
    } as const;
  }, [t]);

  const timeLabels = useMemo(() => {
    return {
      "1h": t("filters.time.1h"),
      "6h": t("filters.time.6h"),
      "12h": t("filters.time.12h"),
      "24h": t("filters.time.24h"),
    } as const;
  }, [t]);

  const tileUrl = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  const handleLocateUser = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError(t("geolocation.unsupported"));
      return;
    }

    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocating(false);
      },
      () => {
        setGeoError(t("geolocation.failed"));
        setLocating(false);
      },
      {enableHighAccuracy: true, timeout: 10_000}
    );
  };

  const handleVote = async (report: MapReport, vote: "up" | "down") => {
    if (voteBusyId) {
      return;
    }

    const previous = reports;
    setVoteBusyId(report.id);
    setReports((current) => current.map((item) => {
      if (item.id !== report.id) {
        return item;
      }
      return {
        ...item,
        upvotes: vote === "up" ? item.upvotes + 1 : item.upvotes,
        downvotes: vote === "down" ? item.downvotes + 1 : item.downvotes,
      };
    }));

    try {
      await voteMapReport(report.id, vote);
      setError(null);
    } catch {
      setReports(previous);
      setError(t("errors.voteFailed"));
    } finally {
      setVoteBusyId(null);
    }
  };

  const handleSubmitReport = async () => {
    if (!form.locationText.trim()) {
      setFormError(t("errors.locationRequired"));
      return;
    }

    const parsedLat = form.lat.trim() ? Number(form.lat) : undefined;
    const parsedLng = form.lng.trim() ? Number(form.lng) : undefined;
    if ((parsedLat !== undefined && !Number.isFinite(parsedLat)) || (parsedLng !== undefined && !Number.isFinite(parsedLng))) {
      setFormError(t("errors.invalidCoordinates"));
      return;
    }

    setFormBusy(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await submitMapReport({
        eventType: form.eventType,
        locationText: form.locationText.trim(),
        description: form.description.trim() || undefined,
        lat: parsedLat,
        lng: parsedLng,
      });
      setFormSuccess(t("submission.success"));
      setForm({eventType: "police", locationText: "", description: "", lat: "", lng: ""});
      setFormOpen(false);
    } catch {
      setFormError(t("errors.submitFailed"));
    } finally {
      setFormBusy(false);
    }
  };

  const handleSubscribePush = async () => {
    if (typeof window === "undefined") {
      return;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushInfo(t("push.unsupported"));
      return;
    }

    setPushBusy(true);
    setPushInfo(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushInfo(t("push.denied"));
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      if (!("PushManager" in window)) {
        setPushInfo(t("push.unsupported"));
        return;
      }

      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          throw new Error("VAPID public key not configured");
        }
        const keyBuffer = Uint8Array.from(atob(vapidKey.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBuffer,
        });
      }

      const p256dh = sub.getKey("p256dh");
      const auth = sub.getKey("auth");
      const keys: Record<string, string> | undefined =
        p256dh && auth
          ? {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
              auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
            }
          : undefined;

      await subscribeToZoneNotifications({
        endpoint: sub.endpoint,
        keys,
      });
      setPushInfo(t("push.success"));
    } catch {
      setPushInfo(t("push.failed"));
    } finally {
      setPushBusy(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const pollMs = 30_000;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let activeController: AbortController | null = null;

    const loadReports = async () => {
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;

      try {
        const data = await fetchMapReports({
          since: toSince(selectedWindow),
          geoOnly: true,
          signal: controller.signal,
        });

        if (cancelled) {
          return;
        }

        setReports(data);
        setUsingFallback(false);
        setError(null);
        setLastUpdatedAt(new Date().toISOString());
      } catch {
        if (cancelled) {
          return;
        }

        const fallback = normalizeDemoReports();
        setReports(fallback);
        setUsingFallback(true);
        setError(t("errors.fallbackData"));
        setLastUpdatedAt(new Date().toISOString());
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }

    };

    void loadReports();
    intervalId = setInterval(() => {
      void loadReports();
    }, pollMs);

    return () => {
      cancelled = true;
      activeController?.abort();
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedWindow, t]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedSound = window.localStorage.getItem(STORAGE_KEYS.soundEnabled);
    if (savedSound !== null) {
      setSoundEnabled(savedSound === "1");
    }

    const savedTracking = window.localStorage.getItem(STORAGE_KEYS.liveTrackingEnabled);
    if (savedTracking !== null) {
      setLiveTrackingEnabled(savedTracking === "1");
    }

    const savedRadius = Number(window.localStorage.getItem(STORAGE_KEYS.proximityRadiusM));
    if (Number.isFinite(savedRadius) && savedRadius >= 100 && savedRadius <= 1000) {
      setProximityRadiusM(savedRadius);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.soundEnabled, soundEnabled ? "1" : "0");
  }, [soundEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.liveTrackingEnabled, liveTrackingEnabled ? "1" : "0");
  }, [liveTrackingEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEYS.proximityRadiusM, String(proximityRadiusM));
  }, [proximityRadiusM]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    if (!liveTrackingEnabled) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setGeoError(null);
      },
      () => {
        setGeoError(t("geolocation.failed"));
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 5_000,
      }
    );

    watchIdRef.current = watchId;
    return () => {
      navigator.geolocation.clearWatch(watchId);
      watchIdRef.current = null;
    };
  }, [liveTrackingEnabled, t]);

  useEffect(() => {
    if (!liveTrackingEnabled || !userLocation) {
      return;
    }

    const [userLat, userLng] = userLocation;

    for (const report of reports) {
      if (!selectedTypes.includes(report.eventType) || isExpired(report) || shouldHideFromVotes(report)) {
        continue;
      }

      const distance = haversineDistance(userLat, userLng, report.lat, report.lng);
      if (distance > proximityRadiusM) {
        continue;
      }

      const lastAlerted = alertedRef.current.get(report.id) ?? 0;
      if (Date.now() - lastAlerted < PROXIMITY_ALERT_COOLDOWN_MS) {
        continue;
      }

      alertedRef.current.set(report.id, Date.now());
      setLastProximityInfo(
        t("proximity.lastAlert", {
          type: t(markerLabelKey[report.eventType]),
          distance: Math.round(distance),
        })
      );

      if (soundEnabled) {
        playByType("proximity");
      }

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(t("proximity.notificationTitle", {distance: Math.round(distance)}), {
          body: report.rawMessage || report.locationText,
          icon: "/images/icon-192.png",
          tag: `proximity-${report.id}`,
          requireInteraction: true,
        });
      }

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 300]);
      }
    }
  }, [liveTrackingEnabled, playByType, proximityRadiusM, reports, selectedTypes, soundEnabled, t, userLocation]);

  useEffect(() => {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL
      ?? API_BASE.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
    const wsUrl = `${wsBase.replace(/\/$/, "")}/ws/map`;

    // Prevent insecure ws:// connection attempts when the app is served over HTTPS.
    if (
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      wsUrl.startsWith("ws://")
    ) {
      console.warn("[MapClient] Blocked insecure WebSocket URL from HTTPS context:", wsUrl);
      return;
    }

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as {
          event?: string;
          type?: string;
          payload?: MapReport;
          data?: MapReport;
          id?: string;
        };
        const kind = message.event ?? message.type;
        const payload = message.payload ?? message.data;

        if (kind === "new_report" && payload) {
          setReports((current) => [payload, ...current.filter((item) => item.id !== payload.id)]);

          if (soundEnabled) {
            playByType(payload.eventType);
          }

          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification(`Radar Puls - ${t(markerLabelKey[payload.eventType])}`, {
              body: payload.rawMessage || payload.locationText || "Nova prijava",
              icon: "/images/icon-192.png",
              tag: `report-${payload.id}`,
            });
          }
        }

        if (kind === "report_updated" && payload) {
          setReports((current) => current.map((item) => item.id === payload.id ? payload : item));
        }

        if (kind === "report_removed") {
          const removeId = payload?.id ?? message.id;
          if (removeId) {
            setReports((current) => current.filter((item) => item.id !== removeId));
          }
        }
      } catch {
        // Ignore malformed WS payloads and keep polling as primary source of truth.
      }
    };

    ws.onerror = () => {
      // Polling is always active, so WS errors are non-fatal.
    };

    return () => {
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => ws.close();
      } else {
        ws.close();
      }
    };
  }, [playByType, soundEnabled, t]);

  const filteredReports = useMemo(() => {
    void nowTick;
    return reports.filter((report) => {
      if (!selectedTypes.includes(report.eventType)) {
        return false;
      }
      if (isExpired(report)) {
        return false;
      }
      if (shouldHideFromVotes(report)) {
        return false;
      }
      return true;
    });
  }, [reports, selectedTypes, nowTick]);

  useEffect(() => {
    if (!activeReport) {
      return;
    }

    const stillVisible = filteredReports.some((report) => report.id === activeReport.id);
    if (!stillVisible) {
      setActiveReport(null);
    }
  }, [activeReport, filteredReports]);

  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filteredReports]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] px-3 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <TypeFilter selected={selectedTypes} labels={typeLabels} onChange={setSelectedTypes} />
          <TimeFilter selected={selectedWindow} labels={timeLabels} onChange={setSelectedWindow} />
          <div className="inline-flex overflow-hidden rounded-md border border-[var(--rp-border)]">
            <button
              type="button"
              onClick={() => setMapMode("markers")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold transition-colors",
                mapMode === "markers" ? "bg-[var(--rp-primary)] text-white" : "bg-[var(--rp-card)] text-[var(--rp-ink-soft)] hover:bg-[var(--rp-surface)]"
              )}
            >
              <MapPin size={13} className="mr-1 inline" />
              {t("view.markers")}
            </button>
            <button
              type="button"
              onClick={() => setMapMode("heatmap")}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold transition-colors",
                mapMode === "heatmap" ? "bg-[var(--rp-primary)] text-white" : "bg-[var(--rp-card)] text-[var(--rp-ink-soft)] hover:bg-[var(--rp-surface)]"
              )}
            >
              <Flame size={13} className="mr-1 inline" />
              {t("view.heatmap")}
            </button>
          </div>
          <button
            type="button"
            onClick={handleLocateUser}
            disabled={locating}
            className="rounded-md border border-[var(--rp-border)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--rp-ink-soft)] transition-colors hover:bg-[var(--rp-surface)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LocateFixed size={13} className="mr-1 inline" />
            {locating ? t("geolocation.locating") : t("geolocation.cta")}
          </button>
          <button
            type="button"
            onClick={() => setLiveTrackingEnabled((value) => !value)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
              liveTrackingEnabled
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-[var(--rp-border)] text-[var(--rp-ink-soft)] hover:bg-[var(--rp-surface)]"
            )}
          >
            <LocateFixed size={13} className="mr-1 inline" />
            {liveTrackingEnabled ? t("proximity.trackingOn") : t("proximity.trackingOff")}
          </button>
          <button
            type="button"
            onClick={() => setSoundEnabled((value) => !value)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
              soundEnabled
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-[var(--rp-border)] text-[var(--rp-ink-soft)] hover:bg-[var(--rp-surface)]"
            )}
          >
            {soundEnabled ? <Volume2 size={13} className="mr-1 inline" /> : <VolumeX size={13} className="mr-1 inline" />}
            {soundEnabled ? t("sound.on") : t("sound.off")}
          </button>
          <button
            type="button"
            onClick={() => setFormOpen((value) => !value)}
            className="rounded-md border border-[var(--rp-border)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--rp-ink-soft)] transition-colors hover:bg-[var(--rp-surface)]"
          >
            <Plus size={13} className="mr-1 inline" />
            {t("submission.cta")}
          </button>
          <button
            type="button"
            disabled={pushBusy}
            onClick={handleSubscribePush}
            className="rounded-md border border-[var(--rp-border)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--rp-ink-soft)] transition-colors hover:bg-[var(--rp-surface)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Bell size={13} className="mr-1 inline" />
            {pushBusy ? t("push.busy") : t("push.cta")}
          </button>
        </div>
        <div className="text-xs text-[var(--rp-ink-soft)]">
          {lastUpdatedAt ? t("lastUpdated", {value: formatRelativeValue(lastUpdatedAt)}) : t("waitingFirstRefresh")}
        </div>
      </div>
      {geoError ? <p className="text-xs text-amber-700">{geoError}</p> : null}
      <p className="text-xs text-[var(--rp-ink-soft)]">
        {t("proximity.radius", {value: proximityRadiusM})}
      </p>
      <input
        type="range"
        min={150}
        max={500}
        step={25}
        value={proximityRadiusM}
        onChange={(event) => setProximityRadiusM(Number(event.target.value))}
        className="w-full accent-[var(--rp-primary)]"
      />
      {lastProximityInfo ? <p className="text-xs text-rose-700">{lastProximityInfo}</p> : null}
      {pushInfo ? <p className="text-xs text-[var(--rp-ink-soft)]">{pushInfo}</p> : null}
      {formSuccess ? <p className="text-xs text-emerald-700">{formSuccess}</p> : null}

      {formOpen ? (
        <div className="space-y-3 rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--rp-ink-soft)]">{t("submission.title")}</p>
          <div className="grid gap-2 md:grid-cols-2">
            <select
              value={form.eventType}
              onChange={(event) => setForm((current) => ({...current, eventType: event.target.value as MapEventType}))}
              className="rounded-md border border-[var(--rp-border)] bg-[var(--rp-bg)] px-2.5 py-2 text-sm"
            >
              {ALL_TYPES.map((type) => (
                <option key={type} value={type}>{t(markerLabelKey[type])}</option>
              ))}
            </select>
            <input
              value={form.locationText}
              onChange={(event) => setForm((current) => ({...current, locationText: event.target.value}))}
              className="rounded-md border border-[var(--rp-border)] bg-[var(--rp-bg)] px-2.5 py-2 text-sm"
              placeholder={t("submission.locationPlaceholder")}
            />
            <input
              value={form.lat}
              onChange={(event) => setForm((current) => ({...current, lat: event.target.value}))}
              className="rounded-md border border-[var(--rp-border)] bg-[var(--rp-bg)] px-2.5 py-2 text-sm"
              placeholder={t("submission.lat")}
            />
            <input
              value={form.lng}
              onChange={(event) => setForm((current) => ({...current, lng: event.target.value}))}
              className="rounded-md border border-[var(--rp-border)] bg-[var(--rp-bg)] px-2.5 py-2 text-sm"
              placeholder={t("submission.lng")}
            />
          </div>
          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({...current, description: event.target.value}))}
            className="min-h-20 w-full rounded-md border border-[var(--rp-border)] bg-[var(--rp-bg)] px-2.5 py-2 text-sm"
            placeholder={t("submission.descriptionPlaceholder")}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (userLocation) {
                  setForm((current) => ({...current, lat: String(userLocation[0]), lng: String(userLocation[1])}));
                }
              }}
              className="rounded-md border border-[var(--rp-border)] px-2.5 py-1 text-xs font-semibold"
            >
              {t("submission.useMyLocation")}
            </button>
            <button
              type="button"
              onClick={() => setPickCoords((value) => !value)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-semibold",
                pickCoords ? "border-[var(--rp-primary)] text-[var(--rp-primary)]" : "border-[var(--rp-border)]"
              )}
            >
              {pickCoords ? t("submission.pickOnMapActive") : t("submission.pickOnMap")}
            </button>
            <button
              type="button"
              disabled={formBusy}
              onClick={handleSubmitReport}
              className="rounded-md bg-[var(--rp-primary)] px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
            >
              {formBusy ? t("submission.submitting") : t("submission.submit")}
            </button>
          </div>
          {formError ? <p className="text-xs text-rose-700">{formError}</p> : null}
        </div>
      ) : null}

      <div className={cn("flex flex-col overflow-hidden rounded-xl border border-[var(--rp-border)] bg-[var(--rp-card)] shadow-md lg:flex-row", heightClassName)}>
        <div className="relative flex-1">
          <MapContainer
            center={[43.316, 21.895]}
            zoom={13}
            style={{height: "100%", width: "100%"}}
            zoomControl={false}
            attributionControl={false}
            className="z-0"
          >
            <InvalidateSizeOnMount />
            <FocusOnActive report={activeReport} />
            <FocusOnUserLocation location={userLocation} />
            <TileLayer
              url={tileUrl}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            <CaptureMapClick
              enabled={pickCoords}
              onPick={(coords) => {
                setForm((current) => ({...current, lat: coords[0].toFixed(6), lng: coords[1].toFixed(6)}));
                setPickCoords(false);
              }}
            />
            {mapMode === "markers" ? (
              <MarkerClusterGroup chunkedLoading maxClusterRadius={50} showCoverageOnHover={false}>
                {sortedReports.map((report) => (
                  <Marker
                    key={report.id}
                    position={[report.lat, report.lng]}
                    icon={createMarkerIcon(report.eventType)}
                    eventHandlers={{click: () => setActiveReport(report)}}
                  >
                    <Popup>
                      <div className="min-w-[200px] text-sm">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                          <img
                            src={markerSvgMap[report.eventType]}
                            alt={report.eventType}
                            className="h-4 w-4"
                          />
                          <span>{t(markerLabelKey[report.eventType])}</span>
                        </div>
                        <p className="mt-1 text-slate-600">{report.locationText}</p>
                        <p className="mt-1 text-xs text-slate-400">{t("ago", {value: formatRelativeValue(report.createdAt)})}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{t("expiry", {value: formatCountdown(resolveExpiry(report))})}</p>
                        {report.rawMessage ? (
                          <div className="mt-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t("rawMessage.label")}</p>
                            <p className="mt-0.5 text-xs italic text-slate-600">&quot;{report.rawMessage}&quot;</p>
                          </div>
                        ) : null}
                        {report.description ? (
                          <p className="mt-1 text-xs text-slate-500">{report.description}</p>
                        ) : null}
                        <span className={cn("mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold", confidenceClass(report.confidence))}>
                          {report.confidence === null ? t("confidence.none") : t("confidence.value", {value: Math.round(report.confidence)})}
                        </span>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            disabled={voteBusyId === report.id}
                            onClick={() => void handleVote(report, "up")}
                            className="rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 disabled:opacity-60"
                          >
                            +1 ({report.upvotes})
                          </button>
                          <button
                            type="button"
                            disabled={voteBusyId === report.id}
                            onClick={() => void handleVote(report, "down")}
                            className="rounded border border-rose-300 bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 disabled:opacity-60"
                          >
                            -1 ({report.downvotes})
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            ) : (
              <HeatLayer reports={sortedReports} />
            )}
            {userLocation ? (
              <Marker position={userLocation} icon={createUserLocationIcon()}>
                <Popup>{t("geolocation.you")}</Popup>
              </Marker>
            ) : null}
          </MapContainer>

          <div className="absolute bottom-3 left-3 z-10 rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)]/90 px-3 py-2 text-xs shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-full", usingFallback ? "bg-amber-500" : "bg-emerald-500")} />
              <span>{usingFallback ? t("mode.fallback") : t("mode.live")}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/65 backdrop-blur-[1px]">
              <div className="rounded-md border border-[var(--rp-border)] bg-white px-3 py-2 text-xs text-[var(--rp-ink-soft)] shadow-sm">
                {t("loading")}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex w-full flex-col border-t border-[var(--rp-border)] bg-[var(--rp-bg)] lg:w-72 lg:border-l lg:border-t-0">
          <div className="border-b border-[var(--rp-border)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--rp-ink-soft)]">{t("feed.title")}</p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              {t("feed.activeCount", {count: sortedReports.length})}
            </div>
            {error ? (
              <p className="mt-1 text-[11px] text-amber-700">{error}</p>
            ) : null}
          </div>
          <ul className="overflow-y-auto">
            {sortedReports.map((report) => (
              <li
                key={report.id}
                className={cn(
                  "cursor-pointer border-b border-[var(--rp-border)] px-4 py-3 transition-colors hover:bg-[var(--rp-surface)]",
                  activeReport?.id === report.id ? "bg-[var(--rp-surface)]" : ""
                )}
                onClick={() => setActiveReport(report)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--rp-deep)]">
                    <img
                      src={markerSvgMap[report.eventType]}
                      alt={report.eventType}
                      className="mr-1 inline h-3.5 w-3.5"
                    />
                    {t(markerLabelKey[report.eventType])}
                  </span>
                  <span className="text-[10px] text-[var(--rp-ink-soft)]">{t("ago", {value: formatRelativeValue(report.createdAt)})}</span>
                </div>
                <p className="mt-0.5 text-[11px] leading-4 text-[var(--rp-ink-soft)]">{report.locationText}</p>
                {report.rawMessage ? (
                  <p className="mt-0.5 truncate text-[11px] italic text-[var(--rp-accent)]">&quot;{report.rawMessage}&quot;</p>
                ) : null}
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-[10px] text-[var(--rp-ink-soft)]">
                    {report.rawMessage ? null : (report.description ?? t("feed.noDescription"))}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", confidenceClass(report.confidence))}>
                      {report.confidence === null ? "--" : t("confidence.short", {value: Math.round(report.confidence)})}
                    </span>
                    <span className="text-[10px] text-[var(--rp-ink-soft)]">{t("expiryShort", {value: formatCountdown(resolveExpiry(report))})}</span>
                  </div>
                </div>
              </li>
            ))}
            {sortedReports.length === 0 ? (
              <li className="px-4 py-6 text-center text-xs text-[var(--rp-ink-soft)]">{t("feed.empty")}</li>
            ) : null}
          </ul>
        </div>
      </div>

      {showDisclaimer ? (
        <p className="text-[11px] text-[var(--rp-ink-soft)]">
          {t("disclaimer")}
        </p>
      ) : null}
    </div>
  );
}
