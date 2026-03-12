"use client";

import {useEffect, useState} from "react";
import "leaflet/dist/leaflet.css";
import {MapContainer, TileLayer, Marker, Popup, useMap} from "react-leaflet";
import L from "leaflet";

// Fix Leaflet default icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type ReportType = "police" | "radar" | "checkpoint";

interface MockReport {
  id: number;
  lat: number;
  lng: number;
  type: ReportType;
  label: string;
  location: string;
  time: string;
  votes: number;
}

const mockReports: MockReport[] = [
  {id: 1, lat: 43.3209, lng: 21.8954, type: "police",     label: "Policija",  location: "Centar, Obrenovićeva ul.",      time: "pre 5 min",  votes: 12},
  {id: 2, lat: 43.3150, lng: 21.9080, type: "radar",      label: "Radar",     location: "Bulevar Nemanjića bb",          time: "pre 12 min", votes: 8},
  {id: 3, lat: 43.3290, lng: 21.9165, type: "checkpoint", label: "Kontrola",  location: "Medijana, Vojvode Tankosića",   time: "pre 3 min",  votes: 21},
  {id: 4, lat: 43.3060, lng: 21.8890, type: "police",     label: "Policija",  location: "Bubanj, Braće Tasković",        time: "pre 18 min", votes: 5},
  {id: 5, lat: 43.3360, lng: 21.9046, type: "radar",      label: "Radar",     location: "Palilula, prema autoputu",      time: "pre 7 min",  votes: 15},
  {id: 6, lat: 43.3180, lng: 21.8810, type: "checkpoint", label: "Kontrola",  location: "Trosarina, izlaz ka Beogradu",  time: "pre 25 min", votes: 9},
  {id: 7, lat: 43.3240, lng: 21.9010, type: "police",     label: "Policija",  location: "Dušanova ul., Jagodin Mala",    time: "pre 2 min",  votes: 17},
];

const markerConfig: Record<ReportType, {bg: string; border: string; emoji: string}> = {
  police:     {bg: "#DC2626", border: "#FCA5A5", emoji: "👮"},
  radar:      {bg: "#D97706", border: "#FCD34D", emoji: "📡"},
  checkpoint: {bg: "#2563EB", border: "#93C5FD", emoji: "🚧"},
};

function createMarkerIcon(type: ReportType) {
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

const typeLabels: Record<ReportType, {text: string; color: string}> = {
  police:     {text: "Policija",  color: "text-red-600"},
  radar:      {text: "Radar",     color: "text-amber-600"},
  checkpoint: {text: "Kontrola",  color: "text-blue-600"},
};

export default function MapClient() {
  const [activeReport, setActiveReport] = useState<MockReport | null>(null);

  return (
    <div className="flex h-[480px] flex-col overflow-hidden rounded-xl border border-[var(--rp-border)] bg-white shadow-md lg:flex-row">
      {/* Map */}
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
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {mockReports.map((r) => (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={createMarkerIcon(r.type)}
              eventHandlers={{click: () => setActiveReport(r)}}
            >
              <Popup>
                <div className="min-w-[160px] text-sm">
                  <p className={`font-semibold ${typeLabels[r.type].color}`}>
                    {markerConfig[r.type].emoji} {r.label}
                  </p>
                  <p className="mt-1 text-slate-600">{r.location}</p>
                  <p className="mt-1 text-xs text-slate-400">{r.time} · {r.votes} potvrda</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map legend */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-xs backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#DC2626]" /> Policija</div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#D97706]" /> Radar</div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" /> Kontrola</div>
        </div>
      </div>

      {/* Sidebar feed */}
      <div className="flex w-full flex-col border-t border-[var(--rp-border)] bg-[var(--rp-bg)] lg:w-64 lg:border-t-0 lg:border-l">
        <div className="border-b border-[var(--rp-border)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--rp-ink-soft)]">Live Izveštaji</p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            {mockReports.length} aktivnih
          </div>
        </div>
        <ul className="overflow-y-auto">
          {[...mockReports]
            .sort((a, b) => a.votes - b.votes)
            .reverse()
            .map((r) => (
              <li
                key={r.id}
                className={`cursor-pointer border-b border-[var(--rp-border)] px-4 py-3 transition-colors hover:bg-[var(--rp-surface)] ${activeReport?.id === r.id ? "bg-[var(--rp-surface)]" : ""}`}
                onClick={() => setActiveReport(r)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-semibold ${typeLabels[r.type].color}`}>
                    {markerConfig[r.type].emoji} {r.label}
                  </span>
                  <span className="text-[10px] text-[var(--rp-ink-soft)]">{r.time}</span>
                </div>
                <p className="mt-0.5 text-[11px] leading-4 text-[var(--rp-ink-soft)]">{r.location}</p>
                <p className="mt-1 text-[10px] text-slate-400">✓ {r.votes} potvrda</p>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
