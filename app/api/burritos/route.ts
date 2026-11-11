import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import {
  BurritoSearchResponse,
  BurritoSpot,
  haversineMiles,
  mockSpots,
} from "@/lib/burritos";

const PLACES_SEARCH_URL =
  "https://places.googleapis.com/v1/places:searchText";

// Only request the fields the UI shows. Rating, review count, and price
// are Enterprise-tier fields ($35/1k calls, 1,000 free/month); everything
// else here is Pro ($32/1k, 5,000 free/month). The call bills at the
// highest tier present, so each search is one Enterprise call.
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.googleMapsUri",
].join(",");

interface GoogleAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface GooglePlace {
  id?: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  googleMapsUri?: string;
}

function mapPriceLevel(level: string | undefined): string | undefined {
  switch (level) {
    case "PRICE_LEVEL_INEXPENSIVE":
      return "$";
    case "PRICE_LEVEL_MODERATE":
      return "$$";
    case "PRICE_LEVEL_EXPENSIVE":
      return "$$$";
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "$$$$";
    default:
      return undefined;
  }
}

function componentText(
  components: GoogleAddressComponent[] | undefined,
  type: string,
  preferShort = false
): string {
  const found = components?.find((c) => c.types?.includes(type));
  if (!found) return "";
  return (
    (preferShort ? found.shortText : found.longText) ??
    found.shortText ??
    found.longText ??
    ""
  );
}

function normalizePlace(
  p: GooglePlace,
  center: { lat: number; lon: number } | null
): BurritoSpot | null {
  const lat = p.location?.latitude;
  const lon = p.location?.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;

  const name = p.displayName?.text ?? "Unknown burrito spot";
  const streetNumber = componentText(p.addressComponents, "street_number");
  const route = componentText(p.addressComponents, "route");
  const address = [streetNumber, route].filter(Boolean).join(" ");
  const city =
    componentText(p.addressComponents, "locality") ||
    componentText(p.addressComponents, "sublocality") ||
    componentText(p.addressComponents, "postal_town");

  return {
    id: p.id ?? `${name}-${lat}-${lon}`,
    name,
    rating: typeof p.rating === "number" ? p.rating : 0,
    reviewCount:
      typeof p.userRatingCount === "number" ? p.userRatingCount : 0,
    price: mapPriceLevel(p.priceLevel),
    distanceMiles: center
      ? haversineMiles(center.lat, center.lon, lat, lon)
      : undefined,
    address: address || p.formattedAddress?.split(",")[0] || "",
    city,
    state: componentText(
      p.addressComponents,
      "administrative_area_level_1",
      true
    ),
    zip: componentText(p.addressComponents, "postal_code"),
    lat,
    lon,
    url:
      p.googleMapsUri ??
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
  };
}

export async function GET(request: NextRequest) {
  // Skip prerendering: this route depends on the request + a runtime env var.
  await connection();

  const { searchParams } = new URL(request.url);
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");
  const location = searchParams.get("location")?.trim();

  const lat = latParam ? Number(latParam) : NaN;
  const lon = lonParam ? Number(lonParam) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  if (!hasCoords && !location) {
    return NextResponse.json(
      { error: "Provide ?lat=&lon= or ?location=" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    // Demo mode: no key configured. Center the mock spots on the requested
    // coordinates, or Denver (a nod to the original Turing project) for text.
    const centerLat = hasCoords ? lat : 39.7392;
    const centerLon = hasCoords ? lon : -104.9903;
    const spots = mockSpots(centerLat, centerLon);
    const body: BurritoSearchResponse = {
      spots,
      demo: true,
      center: { lat: centerLat, lon: centerLon },
    };
    return NextResponse.json(body);
  }

  const center = hasCoords ? { lat, lon } : null;
  const body = {
    textQuery: hasCoords ? "burritos" : `burritos in ${location}`,
    pageSize: 20,
    languageCode: "en",
    ...(hasCoords
      ? {
          locationBias: {
            circle: {
              center: { latitude: lat, longitude: lon },
              radius: 25000,
            },
          },
        }
      : {}),
  };

  let data: { places?: GooglePlace[] };
  try {
    const res = await fetch(PLACES_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify(body),
      // Don't cache: results depend on the request.
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Google Places API error (${res.status})`,
          detail: detail.slice(0, 200),
        },
        { status: 502 }
      );
    }
    data = (await res.json()) as typeof data;
  } catch (err) {
    return NextResponse.json(
      {
        error: "Could not reach the Google Places API",
        detail: String(err).slice(0, 200),
      },
      { status: 502 }
    );
  }

  const spots = (data.places ?? [])
    .map((p) => normalizePlace(p, center))
    .filter((s): s is BurritoSpot => s !== null);

  const mapCenter =
    center ??
    (spots.length > 0
      ? { lat: spots[0].lat, lon: spots[0].lon }
      : { lat: 39.7392, lon: -104.9903 });

  const responseBody: BurritoSearchResponse = {
    spots,
    demo: false,
    center: mapCenter,
  };
  return NextResponse.json(responseBody);
}
