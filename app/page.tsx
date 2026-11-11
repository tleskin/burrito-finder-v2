"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import BurritoCard from "@/components/BurritoCard";
import type { BurritoSearchResponse, BurritoSpot } from "@/lib/burritos";

const BurritoMap = dynamic(() => import("@/components/BurritoMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
      Loading map…
    </div>
  ),
});

const FAVORITES_KEY = "burrito-finder:favorites";

function loadFavorites(): BurritoSpot[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spots, setSpots] = useState<BurritoSpot[]>([]);
  const [demo, setDemo] = useState(false);
  const [center, setCenter] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [favorites, setFavorites] = useState<BurritoSpot[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // storage full or unavailable — favorites just won't persist
    }
  }, [favorites]);

  const runSearch = useCallback(async (params: string) => {
    setLoading(true);
    setError(null);
    setSelectedId(null);
    try {
      const res = await fetch(`/api/burritos?${params}`);
      const data = (await res.json()) as BurritoSearchResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || `Search failed (${res.status})`);
      }
      setSpots(data.spots);
      setDemo(data.demo);
      setCenter(data.center);
      setSearched(true);
      setShowFavoritesOnly(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchByText = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const q = query.trim();
      if (!q) return;
      void runSearch(`location=${encodeURIComponent(q)}`);
    },
    [query, runSearch]
  );

  const searchByGeolocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation isn't available in this browser.");
      return;
    }
    setGeoLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        void runSearch(`lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
      },
      () => {
        setGeoLoading(false);
        setError("Couldn't get your location. Try typing it instead.");
      },
      { timeout: 10000 }
    );
  }, [runSearch]);

  const toggleFavorite = useCallback((spot: BurritoSpot) => {
    setFavorites((prev) =>
      prev.some((f) => f.id === spot.id)
        ? prev.filter((f) => f.id !== spot.id)
        : [...prev, spot]
    );
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );

  const selectSpot = useCallback((id: string) => {
    setSelectedId(id);
    // Scroll the card into view inside the list pane.
    requestAnimationFrame(() => {
      const el = listRef.current?.querySelector(`[data-spot-id="${CSS.escape(id)}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const visibleSpots = showFavoritesOnly ? favorites : spots;
  const mapCenter =
    showFavoritesOnly && favorites.length > 0
      ? { lat: favorites[0].lat, lon: favorites[0].lon }
      : (center ?? { lat: 39.7392, lon: -104.9903 });

  return (
    <div className="min-h-full bg-gradient-to-b from-amber-50 via-orange-50 to-stone-100">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-2xl font-black tracking-tight text-stone-900">
          🌯 BurritoFinder
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setShowFavoritesOnly((v) => !v);
              setSelectedId(null);
            }}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              showFavoritesOnly
                ? "bg-red-500 text-white"
                : "bg-white/70 text-stone-700 hover:bg-white"
            }`}
          >
            ❤️ Favorites ({favorites.length})
          </button>
          <Link href="/about" className="text-stone-600 hover:text-stone-900 hover:underline">
            About
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {/* Hero */}
        <section className="py-10 text-center sm:py-14">
          <p className="text-6xl sm:text-7xl" aria-hidden>
            🌯
          </p>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-stone-900 sm:text-5xl">
            Find that perfect burrito
            <br />
            no matter where you are.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-stone-600">
            Search anywhere, see the best burrito spots on a map, and save your
            favorites. A fresh take on a 2015 Turing School classic.
          </p>

          {/* Search */}
          <form
            onSubmit={searchByText}
            className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="City, neighborhood, or address…"
              aria-label="Search location"
              className="flex-1 rounded-full border border-stone-300 bg-white px-5 py-3 text-stone-900 shadow-sm outline-none placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="rounded-full bg-amber-600 px-6 py-3 font-bold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Searching…" : "Search"}
              </button>
              <button
                type="button"
                onClick={searchByGeolocation}
                disabled={loading || geoLoading}
                className="rounded-full bg-stone-900 px-5 py-3 font-bold text-white shadow-sm transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
                title="Use my current location"
              >
                {geoLoading ? "…" : "📍 Near me"}
              </button>
            </div>
          </form>

          {demo && searched && (
            <p className="mx-auto mt-4 inline-block rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800">
              Demo data — add a Google Places API key for live results.
            </p>
          )}
        </section>

        {/* Error */}
        {error && (
          <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {searched && !loading && !error && (
          <section aria-live="polite">
            {visibleSpots.length === 0 ? (
              <div className="mx-auto max-w-xl rounded-3xl bg-white/70 p-10 text-center shadow-sm">
                <p className="text-4xl">🌯❓</p>
                <p className="mt-3 text-lg font-bold text-stone-800">
                  {showFavoritesOnly
                    ? "No favorites yet"
                    : "No burritos found"}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {showFavoritesOnly
                    ? "Tap the heart on any spot to save it here."
                    : "Try a different location."}
                </p>
              </div>
            ) : (
              <>
                <h2 className="mb-4 text-xl font-black text-stone-900">
                  {showFavoritesOnly
                    ? `Your favorite spots (${visibleSpots.length})`
                    : `${visibleSpots.length} burrito spot${visibleSpots.length === 1 ? "" : "s"} found`}
                </h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div
                    ref={listRef}
                    className="flex max-h-[560px] flex-col gap-3 overflow-y-auto pr-1"
                  >
                    {visibleSpots.map((spot) => (
                      <div key={spot.id} data-spot-id={spot.id}>
                        <BurritoCard
                          spot={spot}
                          selected={spot.id === selectedId}
                          isFavorite={isFavorite(spot.id)}
                          onSelect={() => selectSpot(spot.id)}
                          onToggleFavorite={() => toggleFavorite(spot)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="h-[420px] overflow-hidden rounded-3xl border border-stone-200 shadow-sm lg:h-[560px]">
                    <BurritoMap
                      spots={visibleSpots}
                      center={mapCenter}
                      selectedId={selectedId}
                      onSelect={selectSpot}
                    />
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* Loading */}
        {loading && (
          <div className="mx-auto max-w-xl rounded-3xl bg-white/70 p-10 text-center shadow-sm">
            <p className="animate-bounce text-4xl">🌯</p>
            <p className="mt-3 font-bold text-stone-700">Hunting down burritos…</p>
          </div>
        )}
      </main>

      <footer className="border-t border-stone-200/70 py-6 text-center text-sm text-stone-500">
        BurritoFinder · rebuilt 2026 · a tribute to the{" "}
        <Link href="/about" className="underline hover:text-stone-800">
          2015 original
        </Link>
      </footer>
    </div>
  );
}
