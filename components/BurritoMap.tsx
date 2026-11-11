"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { BurritoSpot } from "@/lib/burritos";

function burritoIcon(selected: boolean) {
  return L.divIcon({
    className: "burrito-marker",
    html: `<div style="
      font-size: ${selected ? 34 : 26}px;
      line-height: 1;
      transform: translate(-50%, -100%);
      filter: drop-shadow(0 2px 3px rgba(0,0,0,0.4));
      ${selected ? "outline: 3px solid #f59e0b; outline-offset: 2px; border-radius: 8px;" : ""}
    ">🌯</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function PanToSelected({ spot }: { spot: BurritoSpot | null }) {
  const map = useMap();
  useEffect(() => {
    if (spot) {
      map.flyTo([spot.lat, spot.lon], Math.max(map.getZoom(), 14), {
        duration: 0.8,
      });
    }
  }, [spot, map]);
  return null;
}

interface BurritoMapProps {
  spots: BurritoSpot[];
  center: { lat: number; lon: number };
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function BurritoMap({ spots, center, selectedId, onSelect }: BurritoMapProps) {
  const selected = spots.find((s) => s.id === selectedId) ?? null;

  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={13}
      scrollWheelZoom
      // Pinch zoom OFF: on a touchscreen laptop, Leaflet's pinch handler
      // fires on one-finger touches, so touching the map zooms instead of
      // panning. One-finger drag pans; +/- buttons and the scroll wheel
      // still zoom.
      touchZoom={false}
      className="h-full w-full"
      style={{ minHeight: 320 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <PanToSelected spot={selected} />
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lon]}
          icon={burritoIcon(spot.id === selectedId)}
          eventHandlers={{ click: () => onSelect(spot.id) }}
        />
      ))}
    </MapContainer>
  );
}
