"use client";

import {useMemo} from "react";
import dynamic from "next/dynamic";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type {AdminEventListItem} from "@/lib/admin-api";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {ssr: false});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {ssr: false});
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), {ssr: false});
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {ssr: false});

interface AdminEventsMapProps {
  events: AdminEventListItem[];
  onEventClick: (id: string) => void;
}

export function AdminEventsMap({events, onEventClick}: AdminEventsMapProps) {
  const geoEvents = useMemo(() => events.filter((event) => event.lat != null && event.lng != null), [events]);

  return (
    <div className="h-[500px] w-full overflow-hidden rounded-lg border border-[var(--rp-border)]">
      <MapContainer center={[43.32, 21.9]} zoom={13} className="h-full w-full" style={{background: "#0f172a"}}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />
        {geoEvents.map((event) => (
          <Marker key={event.id} position={[event.lat as number, event.lng as number]}>
            <Popup>
              <div className="text-xs">
                <p className="font-semibold">{event.eventType}</p>
                <p>{event.locationText}</p>
                <p className="text-[var(--rp-ink-soft)]">{event.moderationStatus}</p>
                <button
                  type="button"
                  onClick={() => onEventClick(event.id)}
                  className="mt-1 text-[var(--rp-primary)] underline"
                >
                  Detalji
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
