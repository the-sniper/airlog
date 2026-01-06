import { WeatherCondition } from "@/hooks/use-weather";

/**
 * Get the gradient classes for a weather condition
 */
export function getWeatherGradient(
  condition: WeatherCondition,
  isDay: boolean,
): string {
  if (
    condition === "rain" ||
    condition === "drizzle" ||
    condition === "heavy_rain"
  ) {
    return "from-slate-700 via-blue-900 to-slate-900";
  }
  if (condition === "thunderstorm") {
    return "from-slate-800 via-slate-900 to-gray-900";
  }
  if (condition === "snow") {
    return isDay
      ? "from-blue-100 via-blue-200 to-indigo-200"
      : "from-slate-800 via-blue-900 to-slate-900";
  }
  if (condition === "cloudy") {
    return isDay
      ? "from-slate-300 via-sky-200/40 to-slate-400"
      : "from-slate-800 via-indigo-950 to-slate-900";
  }
  if (condition === "fog" || condition === "mist") {
    return isDay
      ? "from-gray-300 via-slate-400 to-gray-400"
      : "from-slate-700 via-gray-700 to-slate-800";
  }
  // Clear/Default
  return isDay
    ? "from-blue-400 via-sky-400 to-blue-200"
    : "from-slate-800 via-gray-900 to-slate-950";
}

/**
 * Get text color classes for weather conditions
 */
export function getWeatherTextColor(
  condition: WeatherCondition,
  isDay: boolean,
): {
  primary: string;
  secondary: string;
  muted: string;
} {
  // Light backgrounds need dark text
  const isLightBg =
    (condition === "snow" && isDay) ||
    (condition === "cloudy" && isDay) ||
    (condition === "fog" && isDay) ||
    (condition === "mist" && isDay);

  if (isLightBg) {
    return {
      primary: "text-slate-950",
      secondary: "text-slate-800",
      muted: "text-slate-700",
    };
  }

  return {
    primary: "text-white",
    secondary: "text-white/80",
    muted: "text-white/70",
  };
}
