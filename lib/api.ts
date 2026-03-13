export type MapEventType =
  | "police"
  | "radar"
  | "checkpoint"
  | "accident"
  | "traffic_jam"
  | "unknown";

export interface MapReport {
  id: string;
  eventType: MapEventType;
  locationText: string;
  senderName: string | null;
  eventTime: string;
  lat: number;
  lng: number;
  geoSource: string | null;
  rawMessage: string | null;
  confidence: number | null;
  createdAt: string;
  description: string | null;
}

export interface FetchMapReportsParams {
  since?: string;
  eventType?: MapEventType;
  geoOnly?: boolean;
  signal?: AbortSignal;
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://10.0.0.4:3000";

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
    geoSource: typeof report.geoSource === "string" ? report.geoSource : null,
    rawMessage: typeof report.rawMessage === "string" ? report.rawMessage : null,
    confidence: typeof report.confidence === "number" ? report.confidence : null,
    createdAt,
    description: typeof report.description === "string" ? report.description : null,
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
  const url = `${API_BASE}/api/map/reports${queryString ? `?${queryString}` : ""}`;

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
