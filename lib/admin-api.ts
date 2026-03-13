import {API_BASE, type MapEventType} from "@/lib/api";

export type ModerationStatus = "auto_approved" | "pending_review" | "approved" | "rejected";

export interface AdminStats {
  total_raw_events: number;
  total_parsed: number;
  total_enriched: number;
  total_failed: number;
  pending_review: number;
  approved: number;
  rejected: number;
  events_last_24h: number;
  events_last_7d: number;
  top_event_types: Array<{type: string; count: number}>;
  enrichment_success_rate: number;
}

export interface AdminEventListItem {
  id: string;
  eventType: MapEventType;
  locationText: string;
  moderationStatus: ModerationStatus;
  parseStatus: string;
  createdAt: string;
  confidence: number | null;
}

export interface AdminEventDetail extends AdminEventListItem {
  rawMessage: string | null;
  description: string | null;
  senderName: string | null;
  eventTime: string;
  lat: number | null;
  lng: number | null;
  moderationNote: string | null;
}

export interface AdminEventsResponse {
  data: AdminEventListItem[];
  total: number;
  page: number;
  limit: number;
}

interface RequestOptions {
  method?: "GET" | "POST";
  token: string;
  body?: Record<string, unknown>;
  signal?: AbortSignal;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asModerationStatus(value: unknown): ModerationStatus {
  const normalized = String(value ?? "pending_review");
  if (
    normalized === "auto_approved" ||
    normalized === "pending_review" ||
    normalized === "approved" ||
    normalized === "rejected"
  ) {
    return normalized;
  }
  return "pending_review";
}

function asMapEventType(value: unknown): MapEventType {
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

function normalizeListItem(payload: unknown, index: number): AdminEventListItem {
  const raw = (payload ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? `evt-${index}`),
    eventType: asMapEventType(raw.eventType),
    locationText: typeof raw.locationText === "string" && raw.locationText.trim().length > 0 ? raw.locationText : "Unknown location",
    moderationStatus: asModerationStatus(raw.moderationStatus),
    parseStatus: typeof raw.parseStatus === "string" ? raw.parseStatus : "unknown",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    confidence: typeof raw.confidence === "number" ? raw.confidence : null,
  };
}

function normalizeDetail(payload: unknown): AdminEventDetail {
  const raw = (payload ?? {}) as Record<string, unknown>;
  const base = normalizeListItem(raw, 0);
  return {
    ...base,
    rawMessage: typeof raw.rawMessage === "string" ? raw.rawMessage : null,
    description: typeof raw.description === "string" ? raw.description : null,
    senderName: typeof raw.senderName === "string" ? raw.senderName : null,
    eventTime: typeof raw.eventTime === "string" ? raw.eventTime : base.createdAt,
    lat: typeof raw.lat === "number" ? raw.lat : null,
    lng: typeof raw.lng === "number" ? raw.lng : null,
    moderationNote: typeof raw.moderationNote === "string" ? raw.moderationNote : null,
  };
}

async function adminRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    signal: options.signal,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Admin API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function fetchAdminStats(token: string, signal?: AbortSignal): Promise<AdminStats> {
  const payload = await adminRequest<Record<string, unknown>>("/api/admin/stats", {token, signal});
  return {
    total_raw_events: asNumber(payload.total_raw_events),
    total_parsed: asNumber(payload.total_parsed),
    total_enriched: asNumber(payload.total_enriched),
    total_failed: asNumber(payload.total_failed),
    pending_review: asNumber(payload.pending_review),
    approved: asNumber(payload.approved),
    rejected: asNumber(payload.rejected),
    events_last_24h: asNumber(payload.events_last_24h),
    events_last_7d: asNumber(payload.events_last_7d),
    top_event_types: Array.isArray(payload.top_event_types)
      ? payload.top_event_types.map((item) => {
          const raw = (item ?? {}) as Record<string, unknown>;
          return {type: String(raw.type ?? "unknown"), count: asNumber(raw.count)};
        })
      : [],
    enrichment_success_rate: asNumber(payload.enrichment_success_rate),
  };
}

export async function fetchAdminEvents(token: string, signal?: AbortSignal): Promise<AdminEventsResponse> {
  const payload = await adminRequest<Record<string, unknown>>("/api/admin/events", {token, signal});
  const rawData = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.items) ? payload.items : [];
  return {
    data: rawData.map((item, index) => normalizeListItem(item, index)),
    total: asNumber(payload.total, rawData.length),
    page: asNumber(payload.page, 1),
    limit: asNumber(payload.limit, rawData.length || 20),
  };
}

export async function fetchAdminEventDetail(id: string, token: string, signal?: AbortSignal): Promise<AdminEventDetail> {
  const payload = await adminRequest<unknown>(`/api/admin/events/${encodeURIComponent(id)}`, {token, signal});
  return normalizeDetail(payload);
}

export async function approveAdminEvent(id: string, token: string): Promise<void> {
  await adminRequest<unknown>(`/api/admin/events/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    token,
    body: {},
  });
}

export async function rejectAdminEvent(id: string, token: string, note?: string): Promise<void> {
  await adminRequest<unknown>(`/api/admin/events/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    token,
    body: {note: note?.trim() ? note.trim() : undefined},
  });
}