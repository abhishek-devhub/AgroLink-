import { NextResponse } from 'next/server';
import { BASE_PRICES } from '@/lib/mandiData';
import { groq } from '@/lib/groq';

// WMO weather codes → human-readable condition + type
const WMO_CODES = {
  0: { condition: 'Clear Sky', icon: '☀️', type: 'normal' },
  1: { condition: 'Mainly Clear', icon: '🌤️', type: 'normal' },
  2: { condition: 'Partly Cloudy', icon: '⛅', type: 'normal' },
  3: { condition: 'Overcast', icon: '☁️', type: 'normal' },
  45: { condition: 'Foggy', icon: '🌫️', type: 'cold_wave' },
  48: { condition: 'Depositing Rime Fog', icon: '🌫️', type: 'cold_wave' },
  51: { condition: 'Light Drizzle', icon: '🌦️', type: 'normal' },
  53: { condition: 'Moderate Drizzle', icon: '🌦️', type: 'heavy_rain' },
  55: { condition: 'Dense Drizzle', icon: '🌧️', type: 'heavy_rain' },
  61: { condition: 'Slight Rain', icon: '🌦️', type: 'normal' },
  63: { condition: 'Moderate Rain', icon: '🌧️', type: 'heavy_rain' },
  65: { condition: 'Heavy Rain', icon: '🌧️', type: 'heavy_rain' },
  66: { condition: 'Freezing Rain', icon: '🌧️', type: 'cold_wave' },
  67: { condition: 'Heavy Freezing Rain', icon: '🌧️', type: 'cold_wave' },
  71: { condition: 'Slight Snow', icon: '🌨️', type: 'cold_wave' },
  73: { condition: 'Moderate Snow', icon: '🌨️', type: 'cold_wave' },
  75: { condition: 'Heavy Snow', icon: '❄️', type: 'cold_wave' },
  80: { condition: 'Slight Rain Showers', icon: '🌦️', type: 'normal' },
  81: { condition: 'Moderate Rain Showers', icon: '🌧️', type: 'heavy_rain' },
  82: { condition: 'Violent Rain Showers', icon: '⛈️', type: 'heavy_rain' },
  95: { condition: 'Thunderstorm', icon: '⛈️', type: 'heavy_rain' },
  96: { condition: 'Thunderstorm w/ Hail', icon: '⛈️', type: 'heavy_rain' },
  99: { condition: 'Thunderstorm w/ Heavy Hail', icon: '⛈️', type: 'heavy_rain' },
};

// Weather-crop price correlation intelligence
const WEATHER_CROP_IMPACTS = {
  Wheat: {
    drought: { priceImpact: +12, insight: 'Drought reduces wheat arrivals — prices typically rise 10-15%' },
    heavy_rain: { priceImpact: -8, insight: 'Heavy rain can damage standing wheat, short-term prices may drop' },
    normal: { priceImpact: 0, insight: 'Stable weather — prices following normal seasonal trends' },
    heatwave: { priceImpact: +15, insight: 'Extreme heat causes shriveled grains, reducing market supply' },
    cold_wave: { priceImpact: +5, insight: 'Cold wave may delay harvest slightly, minor upward price pressure' },
  },
  Rice: {
    drought: { priceImpact: +18, insight: 'Rice is highly water-dependent — drought causes significant price spikes' },
    heavy_rain: { priceImpact: +5, insight: 'Flooding can damage crop and raise prices' },
    normal: { priceImpact: 0, insight: 'Normal monsoon — adequate water for paddy cultivation' },
    heatwave: { priceImpact: +8, insight: 'Heat stress during flowering reduces yield' },
    cold_wave: { priceImpact: -3, insight: 'Post-harvest cold storage conditions are favorable' },
  },
  Tomato: {
    drought: { priceImpact: +25, insight: 'Tomato prices are extremely volatile — drought can triple prices within weeks' },
    heavy_rain: { priceImpact: +30, insight: 'Heavy rains cause rot and transport disruption — prices spike dramatically' },
    normal: { priceImpact: -5, insight: 'Good growing conditions may lead to oversupply and lower prices' },
    heatwave: { priceImpact: +20, insight: 'Heat causes flower drop reducing fruit set — significant price increase expected' },
    cold_wave: { priceImpact: +10, insight: 'Cold reduces new supply — stored inventory keeps prices elevated' },
  },
  Onion: {
    drought: { priceImpact: +15, insight: 'Dry conditions reduce onion size and yield — prices climb steadily' },
    heavy_rain: { priceImpact: +35, insight: 'Onion storage losses from rain are catastrophic — prices can double' },
    normal: { priceImpact: -3, insight: 'Normal conditions favor good harvest — prices remain competitive' },
    heatwave: { priceImpact: +8, insight: 'Heat speeds maturation — early arrivals may briefly stabilize prices' },
    cold_wave: { priceImpact: +5, insight: 'Cold storage onions dominate market — gradual price increase' },
  },
  Sugarcane: {
    drought: { priceImpact: +10, insight: 'Sugarcane needs consistent water — drought reduces juice content' },
    heavy_rain: { priceImpact: -5, insight: 'Adequate rain benefits sugarcane — may lead to surplus' },
    normal: { priceImpact: 0, insight: 'FRP-regulated pricing — weather has moderate impact' },
    heatwave: { priceImpact: +5, insight: 'Heat increases sugar concentration but reduces tonnage' },
    cold_wave: { priceImpact: +3, insight: 'Mild cold improves sucrose content — favorable for pricing' },
  },
  Soybean: {
    drought: { priceImpact: +20, insight: 'Soybean flowering is critical — drought slashes output' },
    heavy_rain: { priceImpact: -10, insight: 'Good rain during vegetative stage boosts soybean yield — prices ease' },
    normal: { priceImpact: 0, insight: 'Normal monsoon supports average production levels' },
    heatwave: { priceImpact: +12, insight: 'Excessive heat during pod filling reduces seed weight' },
    cold_wave: { priceImpact: +5, insight: 'Post-harvest cold conditions help storage — gradual price firming' },
  },
};

function getWeatherType(code, temperature) {
  // Override based on extreme temperatures
  if (temperature >= 42) return 'heatwave';
  if (temperature >= 40 && code <= 3) return 'heatwave'; // Clear + very hot = heatwave

  const wmo = WMO_CODES[code] || WMO_CODES[0];
  return wmo.type;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat') || '18.52'; // Default: Pune
  const lon = searchParams.get('lon') || '73.86';

  try {
    // Fetch REAL weather from Open-Meteo (free, no API key needed)
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Asia/Kolkata&forecast_days=7&hourly=relativehumidity_2m,precipitation,windspeed_10m`,
      { next: { revalidate: 900 } } // Cache 15 minutes
    );

    if (!weatherRes.ok) throw new Error('Weather API failed');
    const weatherData = await weatherRes.json();

    const current = weatherData.current_weather;
    const daily = weatherData.daily;

    // Get current hour index for hourly data
    const currentHour = new Date().getHours();
    const humidity = weatherData.hourly?.relativehumidity_2m?.[currentHour] || 50;
    const precipitation = weatherData.hourly?.precipitation?.[currentHour] || 0;
    const windSpeed = current.windspeed;

    const currentCode = current.weathercode;
    const wmoInfo = WMO_CODES[currentCode] || WMO_CODES[0];
    const weatherType = getWeatherType(currentCode, current.temperature);

    // Build 7-day forecast from real data
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const forecast = [];
    for (let i = 1; i < Math.min(daily.time.length, 7); i++) {
      const dayDate = new Date(daily.time[i]);
      const dayCode = daily.weathercode[i];
      const dayWmo = WMO_CODES[dayCode] || WMO_CODES[0];
      forecast.push({
        day: i === 1 ? 'Tomorrow' : dayNames[dayDate.getDay()],
        date: daily.time[i],
        condition: dayWmo.condition,
        icon: dayWmo.icon,
        tempMax: Math.round(daily.temperature_2m_max[i]),
        tempMin: Math.round(daily.temperature_2m_min[i]),
      });
    }

    // Reverse geocode to get region name
    let regionName = 'Your Location';
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=8`,
        { headers: { 'User-Agent': 'AgroLink/1.0' } }
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        regionName = geoData.address?.state_district || geoData.address?.county || geoData.address?.state || regionName;
      }
    } catch { /* ignore geocode failures */ }

    // Compute crop price impacts using REAL mandi base prices
    const cropAnalysis = Object.entries(WEATHER_CROP_IMPACTS).map(([crop, impacts]) => {
      const impact = impacts[weatherType] || impacts.normal;
      const mandiEntry = BASE_PRICES[crop];
      const basePrice = mandiEntry.base;
      const mandiMarket = mandiEntry.mandi;
      const adjustedPrice = Math.round(basePrice * (1 + impact.priceImpact / 100));
      const priceChange = adjustedPrice - basePrice;

      let sellRecommendation, sellUrgency;
      if (impact.priceImpact > 10) {
        sellRecommendation = 'Sell now! Prices are elevated due to weather conditions';
        sellUrgency = 'high';
      } else if (impact.priceImpact > 5) {
        sellRecommendation = 'Good time to sell — above-average prices expected';
        sellUrgency = 'medium';
      } else if (impact.priceImpact < -5) {
        sellRecommendation = 'Hold if possible — prices may recover in 1-2 weeks';
        sellUrgency = 'low';
      } else {
        sellRecommendation = 'Market is stable — sell at your convenience';
        sellUrgency = 'medium';
      }

      return {
        crop, basePrice, mandiMarket, adjustedPrice, priceChange,
        priceImpactPct: impact.priceImpact,
        insight: impact.insight,
        sellRecommendation, sellUrgency,
      };
    });

    // Build advisory based on actual weather
    let advisory;
    if (weatherType === 'heavy_rain') {
      advisory = `⚠️ Rain alert for ${regionName}: Ensure drainage, avoid harvesting in wet conditions, and protect stored produce from moisture.`;
    } else if (weatherType === 'heatwave') {
      advisory = `🔥 Heatwave in ${regionName}: Irrigate during cool hours, use mulch to retain soil moisture, and avoid midday field work.`;
    } else if (weatherType === 'cold_wave') {
      advisory = `❄️ Cold conditions in ${regionName}: Protect nursery beds, ensure frost-sensitive crops are covered.`;
    } else {
      advisory = `✅ Normal weather in ${regionName}. Follow your standard crop management practices.`;
    }

    // --- AI-Powered Insights via Groq ---
    let aiInsights = null;

    if (groq) {
      try {
        const cropSummary = cropAnalysis.map(c =>
          `${c.crop}: base ₹${c.basePrice}/q, adjusted ₹${c.adjustedPrice}/q (${c.priceImpactPct > 0 ? '+' : ''}${c.priceImpactPct}%), recommendation: ${c.sellRecommendation}`
        ).join('\n');

        const aiResponse = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 600,
          messages: [
            {
              role: 'user',
              content: `You are a senior agricultural advisor for Indian farmers. Given real-time weather and mandi price data, provide actionable advice.

WEATHER:
- Location: ${regionName}
- Condition: ${wmoInfo.condition} (${weatherType})
- Temperature: ${Math.round(current.temperature)}°C
- Humidity: ${humidity}%
- Precipitation: ${precipitation}mm
- Wind: ${Math.round(windSpeed)} km/h

CROP PRICE ANALYSIS:
${cropSummary}

Respond ONLY with a JSON object (no markdown, no explanation):
{
  "overallOutlook": "1-2 sentence summary of market + weather conditions for farmers in simple Hindi-English mix",
  "topAction": "The single most important thing a farmer should do TODAY (max 12 words)",
  "sellStrategy": [
    {"crop": "CropName", "action": "Sell now / Hold / Wait", "reason": "10-15 word reason in plain farmer language"}
  ],
  "riskAlerts": ["Short risk alert 1", "Short risk alert 2"],
  "weekAheadTip": "What to expect this week in 1 sentence"
}`
            },
          ],
        });

        const raw = aiResponse.choices[0].message.content;
        aiInsights = JSON.parse(raw.replace(/```json|```/g, '').trim());
      } catch (e) {
        console.error('Groq weather-pricing AI error:', e.message);
        // AI failure is non-fatal — page works without it
        aiInsights = null;
      }
    }

    return NextResponse.json({
      weather: {
        condition: wmoInfo.condition,
        type: weatherType,
        temperature: Math.round(current.temperature),
        humidity,
        rainfall: precipitation,
        windSpeed: Math.round(windSpeed),
        icon: wmoInfo.icon,
        region: regionName,
        forecast,
        source: 'Open-Meteo (live)',
      },
      cropAnalysis,
      lastUpdated: new Date().toISOString(),
      advisory,
      aiInsights,
      coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Unable to fetch live weather data. Please try again.' }, { status: 500 });
  }
}
