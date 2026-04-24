type NominatimResponse = {
  display_name?: string;
  error?: string;
};

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", "16");
  url.searchParams.set("accept-language", "id");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim TOS mewajibkan User-Agent yang bisa dihubungi
        "User-Agent": "AbsensiEnthalphy/1.0 (contact@enthalphy.com)",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    const data = (await res.json()) as NominatimResponse;
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}
