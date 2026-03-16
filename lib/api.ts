export type MapEventType =
  | "police"
  | "radar"
  | "checkpoint"
  | "accident"
  | "traffic_jam"
  | "unknown";

export type GeoSource = "fallback" | "cache" | "google" | "google_partial" | "nominatim" | "demo" | null;

export interface MapReport {
  id: string;
  eventType: MapEventType;
  locationText: string;
  senderName: string | null;
  eventTime: string;
  lat: number;
  lng: number;
  geoSource: GeoSource;
  rawMessage: string | null;
  confidence: number | null;
  createdAt: string;
  description: string | null;
  upvotes: number;
  downvotes: number;
  expiresAt: string | null;
}

function toGeoSource(value: unknown): GeoSource {
  const normalized = String(value ?? "").toLowerCase();
  if (
    normalized === "fallback" ||
    normalized === "cache" ||
    normalized === "google" ||
    normalized === "google_partial" ||
    normalized === "nominatim" ||
    normalized === "demo"
  ) {
    return normalized;
  }
  return null;
}

export interface FetchMapReportsParams {
  since?: string;
  eventType?: MapEventType;
  geoOnly?: boolean;
  signal?: AbortSignal;
}

export interface SubmitMapReportPayload {
  eventType: MapEventType;
  locationText: string;
  lat?: number;
  lng?: number;
  description?: string;
}

export interface PublicStats {
  total_reports_today: number;
  total_reports_week: number;
  busiest_area: string;
  most_common_type: string;
  peak_hour: string;
  reports_by_type: Array<{type: string; count: number}>;
  reports_by_hour: Array<{hour: number; count: number}>;
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.radarpuls.com";

// Browser requests are proxied through Next.js to avoid CORS issues.
const CLIENT_API_BASE = typeof window !== "undefined" ? "/api/proxy" : API_BASE;

function toMapEventType(value: unknown): MapEventType {
  const normalized = String(value ?? "unknown").toLowerCase();
  if (
    normalized === "police" ||
    normalized === "radar" ||
    normalized === "checkpoint" ||
    normalized === "accident" ||
    normalized === "traffic_jam"
  ) {
    return normalized;
  }
  if (normalized === "control") {
    return "checkpoint";
  }
  return "unknown";
}

function normalizeReport(payload: unknown, index: number): MapReport | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const report = payload as Record<string, unknown>;
  const lat = Number(report.lat);
  const lng = Number(report.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const eventTime = typeof report.eventTime === "string" ? report.eventTime : new Date().toISOString();
  const createdAt = typeof report.createdAt === "string" ? report.createdAt : eventTime;
  const locationText =
    typeof report.locationText === "string" && report.locationText.trim().length > 0
      ? report.locationText
      : "Unknown location";

  return {
    id: String(report.id ?? `map-report-${index}`),
    eventType: toMapEventType(report.eventType),
    locationText,
    senderName: typeof report.senderName === "string" ? report.senderName : null,
    eventTime,
    lat,
    lng,
    geoSource: toGeoSource(report.geoSource),
    rawMessage: typeof report.rawMessage === "string" ? report.rawMessage : null,
    confidence: typeof report.confidence === "number" ? report.confidence : null,
    createdAt,
    description: typeof report.description === "string" ? report.description : null,
    upvotes: typeof report.upvotes === "number" ? report.upvotes : 0,
    downvotes: typeof report.downvotes === "number" ? report.downvotes : 0,
    expiresAt: typeof report.expiresAt === "string"
      ? report.expiresAt
      : typeof report.expires_at === "string"
        ? String(report.expires_at)
        : null,
  };
}

export async function fetchMapReports(params: FetchMapReportsParams = {}): Promise<MapReport[]> {
  const query = new URLSearchParams();

  if (params.since) {
    query.set("since", params.since);
  }
  if (params.eventType) {
    query.set("eventType", params.eventType);
  }
  if (params.geoOnly !== undefined) {
    query.set("geoOnly", String(params.geoOnly));
  }

  const queryString = query.toString();
  const url = `${CLIENT_API_BASE}/map/reports${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    signal: params.signal,
    headers: {"Content-Type": "application/json"},
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Map reports request failed: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((item, index) => normalizeReport(item, index))
    .filter((report): report is MapReport => report !== null);
}

export async function voteMapReport(id: string, vote: "up" | "down"): Promise<void> {
  const response = await fetch(`${CLIENT_API_BASE}/map/reports/${encodeURIComponent(id)}/vote`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({vote}),
  });

  if (!response.ok) {
    throw new Error(`Vote request failed: ${response.status}`);
  }
}

export async function submitMapReport(payload: SubmitMapReportPayload): Promise<void> {
  const response = await fetch(`${CLIENT_API_BASE}/map/reports`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Submit report failed: ${response.status}`);
  }
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function fetchPublicStats(signal?: AbortSignal): Promise<PublicStats> {
  const response = await fetch(`${CLIENT_API_BASE}/stats/public`, {
    method: "GET",
    headers: {"Content-Type": "application/json"},
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Public stats request failed: ${response.status}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;

  return {
    total_reports_today: asNumber(payload.total_reports_today),
    total_reports_week: asNumber(payload.total_reports_week),
    busiest_area: typeof payload.busiest_area === "string" ? payload.busiest_area : "-",
    most_common_type: typeof payload.most_common_type === "string" ? payload.most_common_type : "unknown",
    peak_hour: typeof payload.peak_hour === "string" ? payload.peak_hour : "-",
    reports_by_type: Array.isArray(payload.reports_by_type)
      ? payload.reports_by_type.map((item) => {
          const raw = (item ?? {}) as Record<string, unknown>;
          return {
            type: String(raw.type ?? "unknown"),
            count: asNumber(raw.count),
          };
        })
      : [],
    reports_by_hour: Array.isArray(payload.reports_by_hour)
      ? payload.reports_by_hour.map((item) => {
          const raw = (item ?? {}) as Record<string, unknown>;
          return {
            hour: asNumber(raw.hour),
            count: asNumber(raw.count),
          };
        })
      : [],
  };
}

export async function subscribeToZoneNotifications(payload: {
  endpoint: string;
  keys?: Record<string, string>;
}): Promise<void> {
  const response = await fetch(`${CLIENT_API_BASE}/map/subscriptions`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Subscription request failed: ${response.status}`);
  }
}
