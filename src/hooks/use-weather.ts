import { useState, useEffect } from "react";

export type WeatherCondition =
  | "clear"
  | "cloudy"
  | "rain"
  | "heavy_rain"
  | "drizzle"
  | "thunderstorm"
  | "snow"
  | "fog"
  | "mist";

interface WeatherData {
  condition: WeatherCondition;
  isDay: boolean;
  temperature: number;
  windSpeed: number; // km/h
  cloudCover: number; // %
  loading: boolean;
  error: string | null;
}

/**
 * WMO Weather interpretation codes (WW)
 * https://open-meteo.com/en/docs
 *
 * 0: Clear sky
 * 1, 2, 3: Mainly clear, partly cloudy, overcast
 * 45, 48: Fog, depositing rime fog
 * 51, 53, 55: Drizzle: Light, moderate, dense
 * 56, 57: Freezing Drizzle: Light, dense
 * 61, 63, 65: Rain: Slight, moderate, heavy
 * 66, 67: Freezing Rain: Light, heavy
 * 71, 73, 75: Snow fall: Slight, moderate, heavy
 * 77: Snow grains
 * 80, 81, 82: Rain showers: Slight, moderate, violent
 * 85, 86: Snow showers: Slight, heavy
 * 95: Thunderstorm: Slight or moderate
 * 96, 99: Thunderstorm with slight/heavy hail
 */
function getWeatherCondition(code: number): WeatherCondition {
  // Clear
  if (code === 0 || code === 1) return "clear";

  // Cloudy
  if (code === 2 || code === 3) return "cloudy";

  // Fog / Mist
  if (code === 45) return "fog";
  if (code === 48) return "mist"; // Rime fog is more like mist

  // Drizzle
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";

  // Rain (light to moderate)
  if ([61, 63, 80, 81].includes(code)) return "rain";

  // Heavy rain
  if ([65, 66, 67, 82].includes(code)) return "heavy_rain";

  // Thunderstorm
  if ([95, 96, 99].includes(code)) return "thunderstorm";

  // Snow
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";

  return "clear"; // Default fallback
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData>({
    condition: "clear",
    isDay: true,
    temperature: 0,
    windSpeed: 0,
    cloudCover: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setWeather((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocation not supported",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,is_day,weather_code,windspeed_10m,cloudcover&timezone=auto`,
          );

          if (!response.ok) throw new Error("Failed to fetch weather data");

          const data = await response.json();
          const {
            weather_code,
            is_day,
            temperature_2m,
            windspeed_10m,
            cloudcover,
          } = data.current;

          setWeather({
            condition: getWeatherCondition(weather_code),
            isDay: is_day === 1,
            temperature: temperature_2m,
            windSpeed: windspeed_10m,
            cloudCover: cloudcover,
            loading: false,
            error: null,
          });
        } catch (err) {
          console.error(err);
          setWeather((prev) => ({
            ...prev,
            loading: false,
            error: "Failed to fetch weather",
          }));
        }
      },
      (error) => {
        setWeather((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
        }));
      },
    );
  }, []);

  return weather;
}
