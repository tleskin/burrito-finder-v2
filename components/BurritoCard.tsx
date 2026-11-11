"use client";

import type { BurritoSpot } from "@/lib/burritos";

export function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push("★");
    else if (i === full && half) stars.push("⯪");
    else stars.push("☆");
  }
  return (
    <span className="text-amber-500 tracking-tight" aria-label={`${rating} out of 5 stars`}>
      {stars.join("")}
    </span>
  );
}

interface BurritoCardProps {
  spot: BurritoSpot;
  selected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

export default function BurritoCard({
  spot,
  selected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: BurritoCardProps) {
  const addressLine = [spot.address, spot.city, spot.state, spot.zip]
    .filter(Boolean)
    .join(", ");

  return (
    <article
      onClick={onSelect}
      className={`cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
        selected ? "border-amber-500 ring-2 ring-amber-300" : "border-stone-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-stone-900">{spot.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600">
            <Stars rating={spot.rating} />
            <span className="font-medium text-stone-700">{spot.rating.toFixed(1)}</span>
            <span>({spot.reviewCount})</span>
            {spot.price && (
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-700">
                {spot.price}
              </span>
            )}
            {spot.distanceMiles != null && (
              <span className="text-xs">{spot.distanceMiles} mi</span>
            )}
          </div>
          {addressLine && <p className="mt-1 text-sm text-stone-500">{addressLine}</p>}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
          aria-pressed={isFavorite}
          className={`shrink-0 rounded-full p-2 text-xl leading-none transition-transform hover:scale-110 active:scale-95 ${
            isFavorite ? "text-red-500" : "text-stone-300 hover:text-red-400"
          }`}
        >
          {isFavorite ? "❤️" : "🤍"}
        </button>
      </div>
      <a
        href={spot.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-2 inline-block text-sm font-medium text-amber-700 underline-offset-2 hover:underline"
      >
        View on Yelp →
      </a>
    </article>
  );
}
