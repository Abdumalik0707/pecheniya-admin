"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onSelect: (lat: number, lng: number, address: string) => void;
  selected?: { lat: number; lng: number } | null;
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

const DEFAULT_CENTER: [number, number] = [41.2995, 69.2401]; // Toshkent

export function LocationMap({ onSelect, selected }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    import("leaflet").then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: selected ? [selected.lat, selected.lng] : DEFAULT_CENTER,
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      leafletRef.current = L;

      if (selected) {
        markerRef.current = L.marker([selected.lat, selected.lng]).addTo(map);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        placeMarker(lat, lng);

        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await resp.json();
          const address = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          onSelect(lat, lng, address);
        } catch {
          onSelect(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      });

      setLoading(false);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function placeMarker(lat: number, lng: number) {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker([lat, lng]).addTo(map);
    map.setView([lat, lng], 16);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=6&countrycodes=uz&accept-language=uz`
        );
        const data = await resp.json();
        setResults(data);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
  }

  function handlePickResult(r: SearchResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    placeMarker(lat, lng);
    onSelect(lat, lng, r.display_name);
    setQuery(r.display_name);
    setShowResults(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {/* Search box */}
      <div style={{ position: "relative" }}>
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Manzilni qidiring... (masalan: Chilonzor, 19-uy)"
          style={{
            width: "100%",
            height: 46,
            borderRadius: 12,
            border: "1px solid var(--border-strong)",
            background: "var(--surface-2)",
            padding: "0 42px 0 16px",
            fontSize: 14,
            color: "var(--fg)",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "var(--muted)" }}>
          {searching ? "⏳" : "🔍"}
        </span>

        {showResults && results.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              boxShadow: "var(--shadow-lg)",
              maxHeight: 220,
              overflowY: "auto",
              zIndex: 1000,
            }}
          >
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => handlePickResult(r)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  border: "none",
                  borderBottom: i < results.length - 1 ? "1px solid var(--border)" : "none",
                  background: "transparent",
                  color: "var(--fg)",
                  fontSize: 13,
                  cursor: "pointer",
                  lineHeight: 1.4,
                }}
              >
                📍 {r.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: "var(--surface-2)",
              zIndex: 10,
              fontSize: 14,
              color: "var(--muted)",
            }}
          >
            Xarita yuklanmoqda...
          </div>
        )}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <div ref={mapRef} style={{ height: 280, width: "100%" }} />
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.65)",
            color: "#fff",
            fontSize: 12,
            padding: "4px 12px",
            borderRadius: 20,
            pointerEvents: "none",
            zIndex: 999,
            whiteSpace: "nowrap",
            maxWidth: "90%",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Qidiring yoki xaritaga bosing
        </div>
      </div>
    </div>
  );
}
