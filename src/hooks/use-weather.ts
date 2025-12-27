import { useState, useEffect } from 'react';

export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow';

interface WeatherData {
    condition: WeatherCondition;
    isDay: boolean;
    temperature: number;
    windSpeed: number; // km/h
    cloudCover: number; // %
    loading: boolean;
    error: string | null;
}

// ... (existing code for WMO codes)

function getWeatherCondition(code: number): WeatherCondition {
    if (code === 0 || code === 1) return 'clear';
    if (code === 2 || code === 3 || code === 45 || code === 48 || code === 51 || code === 53 || code === 55) return 'cloudy';

    if (
        [56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)
    ) return 'rain';

    if (
        [71, 73, 75, 77, 85, 86].includes(code)
    ) return 'snow';

    return 'clear'; // Default fallback
}

export function useWeather() {
    const [weather, setWeather] = useState<WeatherData>({
        condition: 'clear',
        isDay: true,
        temperature: 0,
        windSpeed: 0,
        cloudCover: 0,
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setWeather(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,is_day,weather_code,windspeed_10m,cloudcover&timezone=auto`
                    );

                    if (!response.ok) throw new Error('Failed to fetch weather data');

                    const data = await response.json();
                    const { weather_code, is_day, temperature_2m, windspeed_10m, cloudcover } = data.current;

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
                    console.error(err)
                    setWeather(prev => ({
                        ...prev,
                        loading: false,
                        error: 'Failed to fetch weather'
                    }));
                }
            },
            (error) => {
                setWeather(prev => ({
                    ...prev,
                    loading: false,
                    error: error.message
                }));
            }
        );
    }, []);

    return weather;
}
