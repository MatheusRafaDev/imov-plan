"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { PontoInteresse } from "@/types/mapa";

// Fix for default marker icons in leaflet with nextjs
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

const getCategoryColor = (categoria: string) => {
  switch (categoria.toLowerCase()) {
      case 'mercado': return '#3b82f6'; // blue-500
      case 'farmacia': return '#ef4444'; // red-500
      case 'escola': return '#eab308'; // yellow-500
      case 'padaria': return '#f97316'; // orange-500
      case 'parque': return '#22c55e'; // green-500
      case 'hospital': return '#dc2626'; // red-600
      default: return '#6b7280'; // gray-500
  }
}

const createCustomIcon = (categoria: string) => {
  const color = getCategoryColor(categoria);
  const svg = `<svg viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5" style="width: 32px; height: 32px; filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.3));"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>`;
  
  return L.divIcon({
      className: 'bg-transparent border-0',
      html: svg,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
  });
}

export default function DynamicMap({ 
  center, 
  pontos, 
  raio,
  onMapClick
}: { 
  center: [number, number], 
  pontos: PontoInteresse[],
  raio: number,
  onMapClick?: (lat: number, lng: number) => void
}) {
  return (
    <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%", zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={center} />
      <MapClickHandler onMapClick={onMapClick} />
      <Marker position={center}>
        <Popup>Local Base</Popup>
      </Marker>
      <Circle center={center} radius={raio} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} />
      {pontos.map((ponto) => (
        <Marker 
          key={ponto.idOsm} 
          position={[ponto.latitude, ponto.longitude]}
          icon={createCustomIcon(ponto.categoria)}
        >
          <Popup>
            <div className="font-semibold">{ponto.nome}</div>
            <div className="text-sm capitalize" style={{ color: getCategoryColor(ponto.categoria) }}>{ponto.categoria}</div>
            <div className="text-xs text-muted-foreground">{Math.round(ponto.distanciaMetros)}m</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
