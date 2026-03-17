"use client";

import {useMemo} from "react";
import {MapPin, PenLine} from "lucide-react";
import {MapContainer, Marker, TileLayer} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {useTranslations} from "next-intl";
import {GeoSourceBadge} from "@/components/admin/geo-source-badge";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface LocationPanelProps {
  latitude: number | null;
  longitude: number | null;
  geoSource: import("@/lib/api").GeoSource;
  formattedAddress?: string | null;
  onChangeCoordinates: (lat: number, lng: number) => void;
  onConfirmLocation: () => void;
  confirming: boolean;
}

function DraggableMarker({
  lat,
  lng,
  onDragEnd,
}: {
  lat: number;
  lng: number;
  onDragEnd: (lat: number, lng: number) => void;
}) {
  return (
    <Marker
      draggable
      position={[lat, lng]}
      eventHandlers={{
        dragend: (event) => {
          const marker = event.target as L.Marker;
          const next = marker.getLatLng();
          onDragEnd(next.lat, next.lng);
        },
      }}
    />
  );
}

export function LocationPanel({
  latitude,
  longitude,
  geoSource,
  formattedAddress,
  onChangeCoordinates,
  onConfirmLocation,
  confirming,
}: LocationPanelProps) {
  const t = useTranslations("admin.eventDetail");

  const hasCoords = typeof latitude === "number" && typeof longitude === "number";
  const mapsUrl = useMemo(() => {
    if (!hasCoords) {
      return "#";
    }
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }, [hasCoords, latitude, longitude]);

  return (
    <section className="rounded-lg border border-[var(--rp-border)] bg-[var(--rp-card)] p-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--rp-ink-soft)]">{t("location.title")}</h2>

      <div className="mt-3 space-y-2 text-sm">
        <p className="text-[var(--rp-ink)]">
          <span className="text-[var(--rp-ink-soft)]">{t("fields.coordinates")}: </span>
          {hasCoords ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : t("location.noCoordinates")}
        </p>

        {hasCoords ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[var(--rp-primary)] transition-colors hover:text-[var(--rp-primary-hover)]"
          >
            <MapPin className="h-4 w-4" />
            {t("location.openGoogleMaps")}
          </a>
        ) : null}

        <div className="flex items-center gap-2">
          <span className="text-[var(--rp-ink-soft)]">{t("fields.geoSource")}:</span>
          <GeoSourceBadge value={geoSource} />
        </div>

        {formattedAddress ? <p className="text-xs text-[var(--rp-ink-soft)]">{formattedAddress}</p> : null}
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-[var(--rp-border)]">
        {hasCoords ? (
          <MapContainer center={[latitude, longitude]} zoom={14} className="h-[200px] w-full" scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker lat={latitude} lng={longitude} onDragEnd={onChangeCoordinates} />
          </MapContainer>
        ) : (
          <div className="flex h-[200px] items-center justify-center bg-[var(--rp-bg)] text-sm text-[var(--rp-ink-soft)]">
            {t("location.noCoordinates")}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfirmLocation}
          disabled={!hasCoords || confirming}
          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <MapPin className="h-4 w-4" />
          {t("location.confirmLocation")}
        </button>
        <span className="inline-flex items-center gap-1 rounded-md border border-[var(--rp-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--rp-primary)]">
          <PenLine className="h-3.5 w-3.5" />
          {t("location.editCoordinates")}
        </span>
      </div>
    </section>
  );
}
