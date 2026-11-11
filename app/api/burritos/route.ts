import { NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";
import { BurritoSearchResponse, BurritoSpot, mockSpots } from "@/lib/burritos";

const YELP_SEARCH_URL = "https://api.yelp.com/v3/businesses/search";

interface YelpBusiness {
  id?: string;
  name?: string;
  rating?: number;
  review_count?: number;
  price?: string;
  distance?: number;
  url?: string;
  image_url?: string;
  location?: {
    address1?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

function metersToMiles(meters: number | undefined): number | undefined {
  if (typeof meters !== "number" || Number.isNaN(meters)) return undefined;
  return Math.round((meters / 1609.344) * 10) / 10;
}

function normalizeBusiness(b: YelpBusiness): BurritoSpot | null {
  const lat = b.coordinates?.latitude;
  const lon = b.coordinates?.longitude;
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  return {
    id: String(b.id ?? `${b.name}-${lat}-${lon}`),
    name: b.name ?? "Unknown burrito spot",
    rating: typeof b.rating === "number" ? b.rating : 0,
    reviewCount: typeof b.review_count === "number" ? b.review_count : 0,
    price: b.price,
    distanceMiles: metersToMiles(b.distance),
    address: b.location?.address1 ?? "",
    city: b.location?.city ?? "",
    state: b.location?.state ?? "",
    zip: b.location?.zip_code ?? "",
    lat,
    lon,
    url: b.url ?? "https://www.yelp.com",
    imageUrl: b.image_url,
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

  const apiKey = process.env.YELP_API_KEY;

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

  const params = new URLSearchParams({
    term: "burritos",
    limit: "20",
    sort_by: "best_match",
  });
  if (hasCoords) {
    params.set("latitude", String(lat));
    params.set("longitude", String(lon));
  } else if (location) {
    params.set("location", location);
  }

  let data: { businesses?: YelpBusiness[]; region?: { center?: { latitude?: number; longitude?: number } } };
  try {
    const res = await fetch(`${YELP_SEARCH_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      // Don't cache: results depend on the request.
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Yelp API error (${res.status})`, detail: detail.slice(0, 200) },
        { status: 502 }
      );
    }
    data = (await res.json()) as typeof data;
  } catch (err) {
    return NextResponse.json(
      { error: "Could not reach the Yelp API", detail: String(err).slice(0, 200) },
      { status: 502 }
    );
  }

  const spots = (data.businesses ?? [])
    .map(normalizeBusiness)
    .filter((s): s is BurritoSpot => s !== null);

  const regionCenter = data.region?.center;
  const center =
    regionCenter?.latitude != null && regionCenter?.longitude != null
      ? { lat: regionCenter.latitude, lon: regionCenter.longitude }
      : hasCoords
        ? { lat, lon }
        : spots.length > 0
          ? { lat: spots[0].lat, lon: spots[0].lon }
          : { lat: 39.7392, lon: -104.9903 };

  const body: BurritoSearchResponse = { spots, demo: false, center };
  return NextResponse.json(body);
}
