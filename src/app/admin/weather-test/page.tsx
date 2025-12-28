"use client";

import { useState } from "react";
import { WeatherEffects } from "@/components/ui/weather-effects";
import type { WeatherCondition } from "@/hooks/use-weather";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  Droplets,
  Wind,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const weatherTypes: {
  type: WeatherCondition;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    type: "clear",
    label: "Clear",
    icon: <Sun className="h-5 w-5" />,
    description: "Sun (day) or Moon & Stars (night)",
  },
  {
    type: "cloudy",
    label: "Cloudy",
    icon: <Cloud className="h-5 w-5" />,
    description: "Multi-layered clouds drifting",
  },
  {
    type: "drizzle",
    label: "Drizzle",
    icon: <CloudDrizzle className="h-5 w-5" />,
    description: "Light, gentle rain",
  },
  {
    type: "rain",
    label: "Rain",
    icon: <CloudRain className="h-5 w-5" />,
    description: "Normal rain with splashes",
  },
  {
    type: "heavy_rain",
    label: "Heavy Rain",
    icon: <Droplets className="h-5 w-5" />,
    description: "Dense rain with many splashes",
  },
  {
    type: "thunderstorm",
    label: "Thunderstorm",
    icon: <CloudLightning className="h-5 w-5" />,
    description: "Dark clouds + lightning bolts",
  },
  {
    type: "snow",
    label: "Snow",
    icon: <CloudSnow className="h-5 w-5" />,
    description: "Snowflakes with branching arms",
  },
  {
    type: "fog",
    label: "Fog",
    icon: <CloudFog className="h-5 w-5" />,
    description: "Dense, layered fog",
  },
  {
    type: "mist",
    label: "Mist",
    icon: <Wind className="h-5 w-5" />,
    description: "Light fog/mist",
  },
];

export default function WeatherTestPage() {
  const [selectedWeather, setSelectedWeather] =
    useState<WeatherCondition>("clear");
  const [isDay, setIsDay] = useState(true);
  const [windSpeed, setWindSpeed] = useState(10);
  const [cloudCover, setCloudCover] = useState(50);

  return (
    <div className="min-h-screen bg-background">
      {/* Weather Effects Container - Full screen background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 transition-colors duration-1000"
          style={{
            background: isDay
              ? selectedWeather === "thunderstorm"
                ? "linear-gradient(to bottom, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
                : selectedWeather === "fog" || selectedWeather === "mist"
                  ? "linear-gradient(to bottom, #667eea 0%, #764ba2 50%, #f093fb 100%)"
                  : selectedWeather === "rain" ||
                      selectedWeather === "heavy_rain" ||
                      selectedWeather === "drizzle"
                    ? "linear-gradient(to bottom, #4a5568 0%, #2d3748 50%, #1a202c 100%)"
                    : selectedWeather === "snow"
                      ? "linear-gradient(to bottom, #e2e8f0 0%, #cbd5e0 50%, #a0aec0 100%)"
                      : "linear-gradient(to bottom, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(to bottom, #0f0c29 0%, #302b63 50%, #24243e 100%)",
          }}
        />
        <WeatherEffects
          type={selectedWeather}
          isDay={isDay}
          windSpeed={windSpeed}
          cloudCover={cloudCover}
        />
      </div>

      {/* Controls Panel */}
      <div className="relative z-10 p-4 md:p-8 max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <Card className="bg-background/80 backdrop-blur-xl border-white/20">
          <CardHeader>
            <CardTitle className="text-2xl">
              🌤️ Weather Effects Tester
            </CardTitle>
            <CardDescription>
              Test all weather effects with different conditions. Select a
              weather type below and adjust the parameters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Weather Type Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Weather Type</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {weatherTypes.map(({ type, label, icon }) => (
                  <Button
                    key={type}
                    variant={selectedWeather === type ? "default" : "outline"}
                    className="flex flex-col h-auto py-3 gap-1"
                    onClick={() => setSelectedWeather(type)}
                  >
                    {icon}
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {
                  weatherTypes.find((w) => w.type === selectedWeather)
                    ?.description
                }
              </p>
            </div>

            {/* Day/Night Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                {isDay ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-300" />
                )}
                <div>
                  <Label className="text-base font-medium">Time of Day</Label>
                  <p className="text-sm text-muted-foreground">
                    {isDay
                      ? "Daytime - bright sky"
                      : "Nighttime - dark sky with stars"}
                  </p>
                </div>
              </div>
              <Button
                variant={isDay ? "default" : "secondary"}
                size="sm"
                onClick={() => setIsDay(!isDay)}
                className="gap-2"
              >
                {isDay ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                {isDay ? "Day" : "Night"}
              </Button>
            </div>

            {/* Wind Speed Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Wind className="h-4 w-4" />
                  Wind Speed
                </Label>
                <span className="text-sm text-muted-foreground">
                  {windSpeed} km/h
                </span>
              </div>
              <input
                type="range"
                value={windSpeed}
                onChange={(e) => setWindSpeed(Number(e.target.value))}
                min={0}
                max={50}
                step={1}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <p className="text-xs text-muted-foreground">
                Affects rain/snow angle and cloud movement speed
              </p>
            </div>

            {/* Cloud Cover Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  Cloud Cover
                </Label>
                <span className="text-sm text-muted-foreground">
                  {cloudCover}%
                </span>
              </div>
              <input
                type="range"
                value={cloudCover}
                onChange={(e) => setCloudCover(Number(e.target.value))}
                min={0}
                max={100}
                step={5}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            {/* Quick Presets */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Quick Presets</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedWeather("clear");
                    setIsDay(true);
                    setWindSpeed(5);
                  }}
                >
                  ☀️ Sunny Day
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedWeather("clear");
                    setIsDay(false);
                    setWindSpeed(0);
                  }}
                >
                  🌙 Starry Night
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedWeather("rain");
                    setIsDay(true);
                    setWindSpeed(15);
                  }}
                >
                  🌧️ Rainy Day
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedWeather("thunderstorm");
                    setIsDay(false);
                    setWindSpeed(30);
                  }}
                >
                  ⛈️ Night Storm
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedWeather("snow");
                    setIsDay(true);
                    setWindSpeed(8);
                  }}
                >
                  ❄️ Snowy Day
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedWeather("fog");
                    setIsDay(true);
                    setWindSpeed(3);
                  }}
                >
                  🌫️ Foggy Morning
                </Button>
              </div>
            </div>

            {/* Current Settings Summary */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <h4 className="font-medium mb-2">Current Configuration</h4>
              <code className="text-sm text-muted-foreground block">
                {`<WeatherEffects type="${selectedWeather}" isDay={${isDay}} windSpeed={${windSpeed}} cloudCover={${cloudCover}} />`}
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
