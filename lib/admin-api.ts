import {API_BASE, type GeoSource, type MapEventType} from "@/lib/api";

export type ModerationStatus = "auto_approved" | "pending_review" | "approved" | "rejected";
export type EditSource = "ai_raw" | "admin_edited" | "admin_confirmed" | "web_submitted";

export type EnrichStatus = "pending" | "enriched" | "failed" | "skipped" | string;

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
  admin_edited_count: number;
  admin_confirmed_count: number;
  admin_geo_count: number;
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
  editSource: EditSource;
  enrichStatus: EnrichStatus | null;
  createdAt: string;
  confidence: number | null;
  lat: number | null;
  lng: number | null;
  geoSource: GeoSource;
}

export interface AdminEventDetail extends AdminEventListItem {
  rawMessage: string | null;
  description: string | null;
  senderName: string | null;
  eventTime: string;
  expiresAt: string | null;
  moderationNote: string | null;
  formattedAddress: string | null;
  enrichAttempts: number;
  enrichedAt: string | null;
}

export interface AdminEventsResponse {
  data: AdminEventListItem[];
  total: number;
  page: number;
  limit: number;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token: string;
  body?: unknown;
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

function asGeoSource(value: unknown): GeoSource {
  const normalized = String(value ?? "").toLowerCase();
  if (
    normalized === "fallback" ||
    normalized === "cache" ||
    normalized === "google" ||
    normalized === "google_partial" ||
    normalized === "nominatim" ||
    normalized === "admin" ||
    normalized === "admin_confirmed" ||
    normalized === "demo"
  ) {
    return normalized;
  }
  return null;
}

function asEditSource(value: unknown): EditSource {
  const normalized = String(value ?? "ai_raw").toLowerCase();
  if (
    normalized === "ai_raw" ||
    normalized === "admin_edited" ||
    normalized === "admin_confirmed" ||
    normalized === "web_submitted"
  ) {
    return normalized;
  }
  return "ai_raw";
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
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
  const editSource = raw.editSource ?? raw.edit_source;
  const enrichStatus = raw.enrichStatus ?? raw.enrich_status;
  const confidence = raw.confidence;
  const lat = raw.lat ?? raw.latitude;
  const lng = raw.lng ?? raw.longitude;
  const geoSource = raw.geoSource ?? raw.geo_source;
  
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
    editSource: asEditSource(editSource),
    enrichStatus: typeof enrichStatus === "string" ? enrichStatus : null,
    createdAt: typeof createdAt === "string" ? createdAt : new Date().toISOString(),
    confidence: parsedConfidence,
    lat: asNullableNumber(lat),
    lng: asNullableNumber(lng),
    geoSource: asGeoSource(geoSource),
  };
}

function normalizeDetail(payload: unknown): AdminEventDetail {
  const raw = (payload ?? {}) as Record<string, unknown>;
  const base = normalizeListItem(raw, 0);
  
  // Handle both camelCase and snake_case field names
  const rawMessage = raw.rawMessage ?? raw.raw_message;
  const senderName = raw.senderName ?? raw.sender_name;
  const eventTime = raw.eventTime ?? raw.event_time;
  const expiresAt = raw.expiresAt ?? raw.expires_at;
  const moderationNote = raw.moderationNote ?? raw.moderation_note;
  const formattedAddress = raw.formattedAddress ?? raw.formatted_address;
  const enrichAttempts = raw.enrichAttempts ?? raw.enrich_attempts;
  const enrichedAt = raw.enrichedAt ?? raw.enriched_at;
  
  return {
    ...base,
    rawMessage: typeof rawMessage === "string" ? rawMessage : null,
    description: typeof raw.description === "string" ? raw.description : null,
    senderName: typeof senderName === "string" ? senderName : null,
    eventTime: typeof eventTime === "string" ? eventTime : base.createdAt,
    expiresAt: typeof expiresAt === "string" ? expiresAt : null,
    moderationNote: typeof moderationNote === "string" ? moderationNote : null,
    formattedAddress: typeof formattedAddress === "string" ? formattedAddress : null,
    enrichAttempts: asNumber(enrichAttempts),
    enrichedAt: typeof enrichedAt === "string" ? enrichedAt : null,
  };
}

// On the client, route admin requests through the Next.js proxy so that:
// 1. CORS is avoided (same-origin request to /api/proxy)
// 2. The server-side API_URL env var is used for the real backend address
// Paths like /api/admin/stats become /api/proxy/admin/stats
function adminUrl(path: string): string {
  if (typeof window !== "undefined") {
    return `/api/proxy${path.replace(/^\/api/, "")}`;
  }
  return `${API_BASE}${path}`;
}

async function adminRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const response = await fetch(adminUrl(path), {
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
    admin_edited_count: asNumber(payload.admin_edited_count),
    admin_confirmed_count: asNumber(payload.admin_confirmed_count),
    admin_geo_count: asNumber(payload.admin_geo_count),
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

export interface AdminEventUpdateInput {
  eventType?: string;
  locationText?: string;
  senderName?: string;
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
  confidence?: number | null;
  eventTime?: string | null;
  expiresAt?: string | null;
}

export async function updateAdminEvent(id: string, token: string, data: AdminEventUpdateInput): Promise<{id: string}> {
  return adminRequest<{id: string}>(`/api/admin/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

interface ConfirmEventLocationInput {
  latitude?: number;
  longitude?: number;
  locationText?: string;
  confirmedBy?: string;
}

export async function confirmEventLocation(
  id: string,
  token: string,
  data?: ConfirmEventLocationInput,
): Promise<{id: string; cached: boolean}> {
  return adminRequest<{id: string; cached: boolean}>(`/api/admin/events/${encodeURIComponent(id)}/confirm-location`, {
    method: "POST",
    token,
    body: data ?? {},
  });
}

export async function bulkConfirmLocations(
  token: string,
  eventIds: string[],
): Promise<{confirmed: number; cached: number}> {
  return adminRequest("/api/admin/events/bulk-confirm-location", {
    method: "POST",
    token,
    body: {eventIds},
  });
}

export async function bulkApproveEvents(token: string, eventIds: string[]): Promise<void> {
  for (const id of eventIds) {
    await approveAdminEvent(id, token);
  }
}

export async function bulkRejectEvents(token: string, eventIds: string[], note?: string): Promise<void> {
  for (const id of eventIds) {
    await rejectAdminEvent(id, token, note);
  }
}

export interface ConfirmLocationCandidate {
  location_text: string;
  lat: number;
  lng: number;
  geo_source: string;
  occurrence_count: number;
  event_ids: string[];
}

export async function fetchConfirmLocationCandidates(
  token: string,
  signal?: AbortSignal,
): Promise<ConfirmLocationCandidate[]> {
  return adminRequest("/api/admin/events/confirm-location-candidates", {token, signal});
}

export interface ActivityLogEntry {
  id: string;
  eventId: string;
  action: string;
  performedBy: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
}

function normalizeActivityLogEntry(raw: unknown): ActivityLogEntry {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    eventId: String(r.event_id ?? r.eventId ?? ""),
    action: String(r.action ?? "unknown"),
    performedBy: String(r.performed_by ?? r.performedBy ?? "system"),
    oldValues: (r.old_values ?? r.oldValues ?? null) as Record<string, unknown> | null,
    newValues: (r.new_values ?? r.newValues ?? null) as Record<string, unknown> | null,
    note: typeof r.note === "string" ? r.note : null,
    createdAt: String(r.created_at ?? r.createdAt ?? new Date().toISOString()),
  };
}

export async function fetchEventActivityLog(
  eventId: string,
  token: string,
  signal?: AbortSignal,
): Promise<ActivityLogEntry[]> {
  const raw = await adminRequest<unknown[]>(`/api/admin/events/${encodeURIComponent(eventId)}/activity-log`, {
    token,
    signal,
  });
  return (raw ?? []).map(normalizeActivityLogEntry);
}

export interface GeocodingCacheEntry {
  id: string;
  locationText: string;
  normalizedText: string;
  lat: number;
  lng: number;
  isPartial: boolean;
  locationType: string | null;
  formattedAddr: string | null;
  placeId: string | null;
  hitCount: number;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeocodingCacheResponse {
  items: GeocodingCacheEntry[];
  total: number;
  page: number;
  limit: number;
}

function normalizeCacheEntry(raw: unknown): GeocodingCacheEntry {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ""),
    locationText: String(r.location_text ?? r.locationText ?? ""),
    normalizedText: String(r.normalized_text ?? r.normalizedText ?? ""),
    lat: Number(r.lat ?? 0),
    lng: Number(r.lng ?? 0),
    isPartial: Boolean(r.is_partial ?? r.isPartial ?? false),
    locationType:
      typeof r.location_type === "string"
        ? r.location_type
        : typeof r.locationType === "string"
          ? r.locationType
          : null,
    formattedAddr:
      typeof r.formatted_addr === "string"
        ? r.formatted_addr
        : typeof r.formattedAddr === "string"
          ? r.formattedAddr
          : null,
    placeId: typeof r.place_id === "string" ? r.place_id : null,
    hitCount: Number(r.hit_count ?? r.hitCount ?? 0),
    verified: Boolean(r.verified ?? false),
    createdAt: String(r.created_at ?? r.createdAt ?? new Date().toISOString()),
    updatedAt: String(r.updated_at ?? r.updatedAt ?? new Date().toISOString()),
  };
}

export async function fetchGeocodingCache(
  token: string,
  params?: {
    search?: string;
    verified?: "true" | "false";
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
  },
  signal?: AbortSignal,
): Promise<GeocodingCacheResponse> {
  const query = new URLSearchParams();
  if (params?.search) {
    query.set("search", params.search);
  }
  if (params?.verified) {
    query.set("verified", params.verified);
  }
  if (params?.sortBy) {
    query.set("sortBy", params.sortBy);
  }
  if (params?.sortOrder) {
    query.set("sortOrder", params.sortOrder);
  }
  if (params?.page) {
    query.set("page", String(params.page));
  }
  if (params?.limit) {
    query.set("limit", String(params.limit));
  }

  const queryStr = query.toString();
  const path = `/api/admin/geocoding-cache${queryStr ? `?${queryStr}` : ""}`;
  const raw = await adminRequest<Record<string, unknown>>(path, {token, signal});

  return {
    items: (Array.isArray(raw.items) ? raw.items : []).map(normalizeCacheEntry),
    total: asNumber(raw.total),
    page: asNumber(raw.page, 1),
    limit: asNumber(raw.limit, 20),
  };
}

export async function updateGeocodingCacheEntry(
  id: string,
  token: string,
  data: {lat?: number; lng?: number; locationText?: string; verified?: boolean; formattedAddr?: string},
): Promise<{id: string}> {
  return adminRequest(`/api/admin/geocoding-cache/${encodeURIComponent(id)}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

export async function deleteGeocodingCacheEntry(id: string, token: string): Promise<{deleted: boolean}> {
  return adminRequest(`/api/admin/geocoding-cache/${encodeURIComponent(id)}`, {
    method: "DELETE",
    token,
  });
}