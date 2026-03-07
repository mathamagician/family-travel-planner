// GET /api/weather?destination=Denver&start_date=2026-04-15&days=5
// Uses Open-Meteo (free, no API key) + its geocoding endpoint.
// Falls back to latitude-adjusted seasonal estimates for dates beyond the 16-day forecast.

function wmoToCondition(code) {
  if (code === 0) return { icon: "☀️", label: "Clear" };
  if (code <= 2)  return { icon: "⛅", label: "Partly Cloudy" };
  if (code === 3) return { icon: "☁️", label: "Overcast" };
  if (code <= 49) return { icon: "🌫️", label: "Fog" };
  if (code <= 67) return { icon: "🌧️", label: "Rain" };
  if (code <= 77) return { icon: "❄️", label: "Snow" };
  if (code <= 82) return { icon: "🌦️", label: "Showers" };
  return { icon: "⛈️", label: "Thunderstorm" };
}

// Estimate typical high temperature for a given lat + month
function estimateHighF(latitude, month) {
  // Very rough: 35°N, July = ~88°F baseline
  const monthTemp = [38,42,52,62,72,82,88,86,78,66,52,40]; // Jan–Dec typical US
  const latAdj = (latitude - 35) * -1.2; // colder as latitude increases
  return Math.round(monthTemp[month - 1] + latAdj);
}

// Seasonal icon estimate for a given latitude + month
function estimateIcon(latitude, month) {
  if ([6,7,8].includes(month)) return { icon: "☀️", label: "Sunny" };
  if ([12,1,2].includes(month)) return latitude > 40 ? { icon: "❄️", label: "Snow" } : { icon: "☁️", label: "Overcast" };
  return { icon: "⛅", label: "Partly Cloudy" };
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get("destination");
  const startDate   = searchParams.get("start_date");
  const numDays     = Math.min(parseInt(searchParams.get("days") ?? "7"), 21);

  if (!destination || !startDate) {
    return Response.json({ error: "destination and start_date required" }, { status: 400 });
  }

  try {
    // 1. Geocode the destination
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`,
      { next: { revalidate: 86400 } }
    );
    const geoData = await geoRes.json();
    const place = geoData.results?.[0];
    if (!place) {
      return Response.json({ error: "Location not found" }, { status: 404 });
    }

    const { latitude, longitude, timezone } = place;

    // 2. Build list of dates we need
    const dateList = Array.from({ length: numDays }, (_, i) => addDays(startDate, i));

    // 3. Determine which dates are within 16-day forecast window
    const today = new Date();
    const forecast16End = new Date(today);
    forecast16End.setDate(forecast16End.getDate() + 15);
    const forecastDates = dateList.filter(d => new Date(d + "T00:00:00") <= forecast16End);

    const weather = {};

    // 4. Fetch live forecast for near dates
    if (forecastDates.length > 0) {
      const fStart = forecastDates[0];
      const fEnd   = forecastDates[forecastDates.length - 1];
      const forecastUrl = [
        "https://api.open-meteo.com/v1/forecast",
        `?latitude=${latitude}&longitude=${longitude}`,
        `&daily=temperature_2m_max,weathercode`,
        `&temperature_unit=fahrenheit`,
        `&timezone=${encodeURIComponent(timezone ?? "auto")}`,
        `&start_date=${fStart}&end_date=${fEnd}`,
      ].join("");

      const forecastRes = await fetch(forecastUrl, { next: { revalidate: 3600 } });
      const forecastData = await forecastRes.json();
      const dates    = forecastData.daily?.time ?? [];
      const maxTemps = forecastData.daily?.temperature_2m_max ?? [];
      const codes    = forecastData.daily?.weathercode ?? [];

      dates.forEach((date, i) => {
        const condition = wmoToCondition(codes[i] ?? 0);
        weather[date] = {
          icon:  condition.icon,
          label: condition.label,
          highF: Math.round(maxTemps[i] ?? 70),
        };
      });
    }

    // 5. Fill remaining dates with seasonal estimate
    for (const date of dateList) {
      if (!weather[date]) {
        const month = parseInt(date.split("-")[1]);
        const condition = estimateIcon(latitude, month);
        weather[date] = {
          icon:  condition.icon,
          label: condition.label + " (est.)",
          highF: estimateHighF(latitude, month),
        };
      }
    }

    return Response.json({ weather, source: "open-meteo", location: place.name });
  } catch (err) {
    console.error("[weather]", err);
    return Response.json({ error: "Weather fetch failed" }, { status: 500 });
  }
}
