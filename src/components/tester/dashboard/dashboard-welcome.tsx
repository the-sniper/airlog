import { Sun, Moon, CloudRain, CloudSnow, Cloud } from "lucide-react";
import { useWeather, WeatherCondition } from "@/hooks/use-weather";
import { WeatherEffects } from "@/components/ui/weather-effects";
import { getWeatherGradient, getWeatherTextColor } from "@/lib/weather-utils";
import { cn } from "@/lib/utils";

interface DashboardWelcomeProps {
  firstName: string;
  lastName: string;
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getWeatherIcon(condition: WeatherCondition, isDay: boolean) {
  switch (condition) {
    case "rain":
      return CloudRain;
    case "snow":
      return CloudSnow;
    case "cloudy":
      return Cloud;
    default:
      return isDay ? Sun : Moon;
  }
}

export function DashboardWelcome({
  firstName,
  lastName,
}: DashboardWelcomeProps) {
  const { condition, isDay, loading, windSpeed, cloudCover } = useWeather();
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  // Fallback to time-based if loading or no weather
  const hour = new Date().getHours();
  const greeting = getGreeting(hour);
  const WeatherIcon = getWeatherIcon(condition, isDay);

  // Default gradient if loading
  const gradientClass = loading
    ? "from-primary/90 via-primary to-accent/80"
    : getWeatherGradient(condition, isDay);

  // Get text colors based on weather
  const textColors = loading
    ? {
        primary: "text-white",
        secondary: "text-white/80",
        muted: "text-white/70",
      }
    : getWeatherTextColor(condition, isDay);

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Check if we have a light background (need dark text & different avatar styling)
  const isLightBg =
    !loading &&
    ((condition === "snow" && isDay) ||
      (condition === "cloudy" && isDay) ||
      (condition === "fog" && isDay) ||
      (condition === "mist" && isDay));

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 transition-colors duration-1000">
      {/* Dynamic background */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br transition-all duration-1000",
          gradientClass,
        )}
      />

      {/* Weather Effects Overlay */}
      {!loading && (
        <WeatherEffects
          type={condition}
          isDay={isDay}
          windSpeed={windSpeed}
          cloudCover={cloudCover}
        />
      )}

      {/* Decorative blobs - adjusted opacity based on weather */}
      <div className="absolute top-0 right-0 w-72 h-72 opacity-20 dark:opacity-15">
        <div className="absolute inset-0 bg-current rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3" />
      </div>

      {/* Mesh pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 z-20">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              "w-16 h-16 md:w-20 md:h-20 rounded-2xl backdrop-blur-md flex items-center justify-center border shadow-lg transition-colors duration-500",
              isLightBg
                ? "bg-white/40 border-slate-200/50 shadow-slate-200/20"
                : "bg-white/20 border-white/30 shadow-primary/20",
            )}
          >
            <span
              className={cn(
                "text-2xl md:text-3xl font-bold transition-colors duration-500",
                textColors.primary,
              )}
            >
              {initials}
            </span>
          </div>
        </div>

        {/* Greeting text */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <WeatherIcon
              className={cn(
                "w-4 h-4 transition-colors duration-500",
                textColors.secondary,
              )}
            />
            <span
              className={cn(
                "text-sm font-medium transition-colors duration-500",
                textColors.secondary,
              )}
            >
              {date}
            </span>
          </div>
          <h1
            className={cn(
              "text-2xl md:text-3xl font-bold mb-2 transition-colors duration-500",
              textColors.primary,
            )}
          >
            {greeting}, {firstName}!
          </h1>
          <p
            className={cn(
              "text-sm md:text-base max-w-lg leading-relaxed transition-colors duration-500",
              textColors.muted,
            )}
          >
            Welcome to your testing dashboard. Here&apos;s an overview of your
            activity and sessions.
          </p>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent to-transparent transition-colors duration-500",
          isLightBg ? "via-slate-400/30" : "via-white/30",
        )}
      />
    </div>
  );
}
