"use client";

import {useEffect, useMemo, useState} from "react";
import {useTranslations} from "next-intl";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";
import {CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import markersData from "@/data/markers.json";
import {
  fetchMapReports,
  type MapEventType,
  type MapReport,
} from "@/lib/api";
import {TimeFilter, type TimeWindow} from "@/components/map/time-filter";
import {TypeFilter} from "@/components/map/type-filter";
import {useTheme} from "@/lib/hooks/use-theme";
import {cn} from "@/lib/utils";

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

interface MapClientProps {
  heightClassName?: string;
  showDisclaimer?: boolean;
}

function createMarkerIcon(type: MapEventType) {
  const cfg = markerConfig[type];
  return L.divIcon({
    html: `<div style="
      background:${cfg.bg};
      width:36px;height:36px;
      border-radius:50%;
      border:2.5px solid ${cfg.border};
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 2px 10px rgba(0,0,0,0.25);
      font-size:16px;
      cursor:pointer;
    ">${cfg.emoji}</div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

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

  const filteredReports = useMemo(() => {
    return reports.filter((report) => selectedTypes.includes(report.eventType));
  }, [reports, selectedTypes]);

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
          <button
            type="button"
            onClick={handleLocateUser}
            disabled={locating}
            className="rounded-md border border-[var(--rp-border)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--rp-ink-soft)] transition-colors hover:bg-[var(--rp-surface)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locating ? t("geolocation.locating") : t("geolocation.cta")}
          </button>
        </div>
        <div className="text-xs text-[var(--rp-ink-soft)]">
          {lastUpdatedAt ? t("lastUpdated", {value: formatRelativeValue(lastUpdatedAt)}) : t("waitingFirstRefresh")}
        </div>
      </div>
      {geoError ? <p className="text-xs text-amber-700">{geoError}</p> : null}

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
            <MarkerClusterGroup chunkedLoading maxClusterRadius={50} showCoverageOnHover={false}>
              {sortedReports.map((report) => (
                <Marker
                  key={report.id}
                  position={[report.lat, report.lng]}
                  icon={createMarkerIcon(report.eventType)}
                  eventHandlers={{click: () => setActiveReport(report)}}
                >
                  <Popup>
                    <div className="min-w-[180px] text-sm">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <span>{markerConfig[report.eventType].emoji}</span>
                        <span>{t(markerLabelKey[report.eventType])}</span>
                      </div>
                      <p className="mt-1 text-slate-600">{report.locationText}</p>
                      <p className="mt-1 text-xs text-slate-400">{t("ago", {value: formatRelativeValue(report.createdAt)})}</p>
                      {report.description ? (
                        <p className="mt-1 text-xs text-slate-500">{report.description}</p>
                      ) : null}
                      <span className={cn("mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold", confidenceClass(report.confidence))}>
                        {report.confidence === null ? t("confidence.none") : t("confidence.value", {value: Math.round(report.confidence)})}
                      </span>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
            {userLocation ? (
              <CircleMarker
                center={userLocation}
                radius={8}
                pathOptions={{color: "#2563EB", fillColor: "#60A5FA", fillOpacity: 0.75, weight: 2}}
              >
                <Popup>{t("geolocation.you")}</Popup>
              </CircleMarker>
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
                    {markerConfig[report.eventType].emoji} {t(markerLabelKey[report.eventType])}
                  </span>
                  <span className="text-[10px] text-[var(--rp-ink-soft)]">{t("ago", {value: formatRelativeValue(report.createdAt)})}</span>
                </div>
                <p className="mt-0.5 text-[11px] leading-4 text-[var(--rp-ink-soft)]">{report.locationText}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-[10px] text-[var(--rp-ink-soft)]">{report.description ?? t("feed.noDescription")}</p>
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", confidenceClass(report.confidence))}>
                    {report.confidence === null ? "--" : t("confidence.short", {value: Math.round(report.confidence)})}
                  </span>
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
