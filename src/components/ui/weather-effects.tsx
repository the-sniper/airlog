"use client";

import { useEffect, useRef } from 'react';

interface WeatherEffectsProps {
    type: 'rain' | 'snow' | 'clear' | 'cloudy' | null;
    isDay: boolean;
    windSpeed?: number; // km/h
    cloudCover?: number; // %
}

interface Particle {
    x: number;
    y: number;
    speed: number;
    size: number;
    opacity: number;
    // Specific properties
    angle?: number; // falling angle for rain/snow
    oscillation?: number; // for stars/snow
    type?: 'star' | 'cloud' | 'ray';
}

export function WeatherEffects({ type, isDay, windSpeed = 0, cloudCover = 0 }: WeatherEffectsProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let time = 0;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            initParticles();
        };

        const initParticles = () => {
            particles = [];
            const w = canvas.width;
            const h = canvas.height;

            if (type === 'rain') {
                const isMobile = w < 768;
                const count = (isMobile ? 40 : 100) + (windSpeed * 2);
                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.random() * w,
                        y: Math.random() * h,
                        speed: 0.2 + Math.random() * 0.5, // Barely moving rain
                        size: 1 + Math.random(),
                        opacity: 0.4 + Math.random() * 0.3,
                        angle: Math.random() * 5
                    });
                }
            } else if (type === 'snow') {
                const isMobile = w < 768;
                const count = (isMobile ? 20 : 50) + (windSpeed);
                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.random() * w,
                        y: Math.random() * h,
                        speed: 1 + Math.random() * 2,
                        size: 2 + Math.random() * 3,
                        opacity: 0.4 + Math.random() * 0.6,
                        oscillation: Math.random() * Math.PI * 2
                    });
                }
            } else if (type === 'clear' && !isDay) {
                // Stars
                const count = 60;
                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.random() * w,
                        y: Math.random() * h,
                        speed: 0,
                        size: Math.random() * 2,
                        opacity: Math.random(),
                        oscillation: Math.random() * 100,
                        type: 'star'
                    });
                }
            } else if (type === 'clear' && isDay) {
                // Sun Rays - pseudo particles
                const count = 5;
                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: w * 0.9, // Sun position approx top right
                        y: h * 0.1,
                        speed: 0.001 + Math.random() * 0.002,
                        size: 100 + Math.random() * 200,
                        opacity: 0.1 + Math.random() * 0.2,
                        angle: (Math.PI * 2 * i) / count,
                        type: 'ray'
                    });
                }
            }

            // Separate cloud logic - clouds can exist in cloudy weather or if coverage is high
            // Note: In this simple system, we treat 'cloudy' as the main type, so we checks for it.
            if (type === 'cloudy') {
                const count = 5 + Math.floor(cloudCover / 10);
                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.random() * w,
                        y: Math.random() * (h * 0.5),
                        speed: 0.2 + Math.random() * 0.3,
                        size: 50 + Math.random() * 100,
                        opacity: 0.1 + Math.random() * 0.2,
                        type: 'cloud'
                    });
                }
            }
        };

        const drawStar = (p: Particle) => {
            const twinkle = Math.sin(time * 2 + (p.oscillation || 0)) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * twinkle})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawSunRay = (p: Particle) => {
            // Rotate rays
            const rotation = time * p.speed + (p.angle || 0);
            ctx.save();
            ctx.translate(canvas.width * 0.85, canvas.height * 0.15); // Sun source
            ctx.rotate(rotation);

            const gradient = ctx.createLinearGradient(0, 0, p.size, 0);
            gradient.addColorStop(0, `rgba(255, 255, 200, ${p.opacity})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(p.size, 0);
            ctx.moveTo(0, 10);
            ctx.fill();
            ctx.restore();
        };

        const drawCloud = (p: Particle) => {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            // Add some fluffiness
            ctx.arc(p.x + p.size / 2, p.y - p.size / 4, p.size * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.arc(p.x - p.size / 2, p.y + p.size / 4, p.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            time += 0.01;

            // Wind calculation (pixels per frame displacement)
            const windFactor = windSpeed * 0.02;

            // Clouds loop separately if mixed with rain/snow? 
            // Simplified: One main effect dominates, but we handle types.

            // Draw Sun body for Day Clear
            if (type === 'clear' && isDay) {
                const sunX = canvas.width * 0.85;
                const sunY = canvas.height * 0.15;

                // Glow
                const gradient = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 60);
                gradient.addColorStop(0, 'rgba(255, 255, 220, 0.8)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fill(new Path2D(`M0 0 h${canvas.width} v${canvas.height} h-${canvas.width} z`)); // Full fill? No, just render at spot
                ctx.beginPath();
                ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw Moon for Night Clear
            if (type === 'clear' && !isDay) {
                const moonX = canvas.width * 0.85;
                const moonY = canvas.height * 0.2;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.beginPath();
                ctx.arc(moonX, moonY, 20, 0, Math.PI * 2);
                ctx.fill();

                // Crater/shadow
                ctx.fillStyle = 'rgba(200, 200, 220, 0.2)';
                ctx.beginPath();
                ctx.arc(moonX - 5, moonY + 2, 6, 0, Math.PI * 2);
                ctx.fill();
            }


            particles.forEach(p => {
                if (p.type === 'star') {
                    drawStar(p);
                    return;
                }
                if (p.type === 'ray') {
                    drawSunRay(p);
                    return;
                }
                if (p.type === 'cloud') {
                    p.x += (windSpeed * 0.05) + p.speed;
                    if (p.x > canvas.width + p.size) p.x = -p.size;
                    drawCloud(p);
                    return;
                }

                // Rain / Snow physics
                p.y += p.speed;
                p.x += windFactor;

                if (type === 'snow') {
                    p.x += Math.sin(time + (p.oscillation || 0)) * 0.5;
                }

                if (p.y > canvas.height) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width - (windFactor * 20); // spawn offset to account for wind
                }
                if (p.x > canvas.width && windFactor > 0) {
                    p.x = -10;
                    p.y = Math.random() * canvas.height;
                }

                ctx.beginPath();
                if (type === 'rain') {
                    ctx.strokeStyle = `rgba(174, 194, 224, ${p.opacity})`;
                    ctx.lineWidth = 1;
                    ctx.moveTo(p.x, p.y);
                    // Rain angle matches wind
                    ctx.lineTo(p.x + windFactor, p.y + p.speed * 2);
                    ctx.stroke();
                } else if (type === 'snow') {
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [type, isDay, windSpeed, cloudCover]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ mixBlendMode: 'plus-lighter' }}
        />
    );
}
