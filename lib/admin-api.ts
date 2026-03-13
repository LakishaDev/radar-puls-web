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
  rawMessage: string | null;
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
  // Map 'control' to 'checkpoint'
  if (normalized === "control") {
    return "checkpoint";
  }
  return "unknown";
}

function normalizeListItem(payload: unknown, index: number): AdminEventListItem {
  const raw = (payload ?? {}) as Record<string, unknown>;
  
  // Handle both camelCase and snake_case field names
  const eventType = raw.eventType ?? raw.event_type;
  const locationText = raw.locationText ?? raw.location_text;
  const parseStatus = raw.parseStatus ?? raw.parse_status;
  const moderationStatus = raw.moderationStatus ?? raw.moderation_status;
  const createdAt = raw.createdAt ?? raw.created_at;
  const rawMessage = raw.rawMessage ?? raw.raw_message;
  const confidence = raw.confidence;
  
  // Parse confidence from string if needed
  let parsedConfidence: number | null = null;
  if (typeof confidence === "number") {
    parsedConfidence = confidence;
  } else if (typeof confidence === "string") {
    const parsed = parseFloat(confidence);
    parsedConfidence = Number.isFinite(parsed) ? parsed : null;
  }
  
  return {
    id: String(raw.id ?? `evt-${index}`),
    eventType: asMapEventType(eventType),
    locationText: typeof locationText === "string" && locationText.trim().length > 0 ? locationText : "Unknown location",
    rawMessage: typeof rawMessage === "string" && rawMessage.trim().length > 0 ? rawMessage : null,
    moderationStatus: asModerationStatus(moderationStatus),
    parseStatus: typeof parseStatus === "string" ? parseStatus : "unknown",
    createdAt: typeof createdAt === "string" ? createdAt : new Date().toISOString(),
    confidence: parsedConfidence,
  };
}

function normalizeDetail(payload: unknown): AdminEventDetail {
  const raw = (payload ?? {}) as Record<string, unknown>;
  const base = normalizeListItem(raw, 0);
  
  // Handle both camelCase and snake_case field names
  const rawMessage = raw.rawMessage ?? raw.raw_message;
  const senderName = raw.senderName ?? raw.sender_name;
  const eventTime = raw.eventTime ?? raw.event_time;
  const lat = raw.lat ?? raw.latitude;
  const lng = raw.lng ?? raw.longitude;
  const moderationNote = raw.moderationNote ?? raw.moderation_note;
  
  return {
    ...base,
    rawMessage: typeof rawMessage === "string" ? rawMessage : null,
    description: typeof raw.description === "string" ? raw.description : null,
    senderName: typeof senderName === "string" ? senderName : null,
    eventTime: typeof eventTime === "string" ? eventTime : base.createdAt,
    lat: typeof lat === "number" ? lat : null,
    lng: typeof lng === "number" ? lng : null,
    moderationNote: typeof moderationNote === "string" ? moderationNote : null,
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