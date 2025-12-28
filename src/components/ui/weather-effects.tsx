"use client";

import { useEffect, useRef, useCallback } from "react";
import type { WeatherCondition } from "@/hooks/use-weather";

interface WeatherEffectsProps {
  type: WeatherCondition | null;
  isDay: boolean;
  windSpeed?: number; // km/h
  cloudCover?: number; // %
}

// Enhanced particle interface with more properties for realistic effects
interface Particle {
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  angle?: number;
  oscillation?: number;
  type?:
    | "star"
    | "cloud"
    | "ray"
    | "raindrop"
    | "splash"
    | "snowflake"
    | "fog"
    | "lightning";
  // Enhanced properties
  rotation?: number;
  rotationSpeed?: number;
  layer?: number; // 0 = far, 1 = mid, 2 = near
  life?: number; // For temporary particles like splashes
  maxLife?: number;
  velocityX?: number;
  velocityY?: number;
  // Snowflake specific
  arms?: number;
  innerRadius?: number;
  // Lightning specific
  branches?: {
    x: number;
    y: number;
    angle: number;
    length: number;
    width: number;
  }[];
  flashIntensity?: number;
}

// Lightning bolt state
interface LightningBolt {
  active: boolean;
  x: number;
  y: number;
  branches: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    width: number;
  }[];
  flashIntensity: number;
  fadeSpeed: number;
}

export function WeatherEffects({
  type,
  isDay,
  windSpeed = 0,
  cloudCover = 0,
}: WeatherEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const lightningRef = useRef<LightningBolt | null>(null);
  const lastLightningRef = useRef(0);

  // Generate lightning bolt with branches
  const generateLightning = useCallback(
    (canvas: HTMLCanvasElement): LightningBolt => {
      const startX = Math.random() * canvas.width;
      const startY = 0;
      const branches: LightningBolt["branches"] = [];

      let currentX = startX;
      let currentY = startY;
      const segments = 8 + Math.floor(Math.random() * 6);
      const targetY = canvas.height * (0.5 + Math.random() * 0.3);

      for (let i = 0; i < segments; i++) {
        const progress = i / segments;
        const nextY = currentY + (targetY - startY) / segments;
        const jitter = (1 - progress) * 50; // Less jitter at the end
        const nextX = currentX + (Math.random() - 0.5) * jitter;

        branches.push({
          startX: currentX,
          startY: currentY,
          endX: nextX,
          endY: nextY,
          width: 3 * (1 - progress * 0.5),
        });

        // Add sub-branches randomly
        if (Math.random() > 0.6 && i > 2) {
          const branchLength = 20 + Math.random() * 40;
          const branchAngle =
            (Math.random() > 0.5 ? 1 : -1) *
            (Math.PI / 4 + (Math.random() * Math.PI) / 4);
          branches.push({
            startX: currentX,
            startY: currentY,
            endX: currentX + Math.cos(branchAngle) * branchLength,
            endY:
              currentY +
              Math.sin(branchAngle) * branchLength * 0.5 +
              branchLength * 0.8,
            width: 1.5 * (1 - progress * 0.5),
          });
        }

        currentX = nextX;
        currentY = nextY;
      }

      return {
        active: true,
        x: startX,
        y: startY,
        branches,
        flashIntensity: 1,
        fadeSpeed: 0.05 + Math.random() * 0.03,
      };
    },
    [],
  );

  // Draw a realistic snowflake
  const drawSnowflake = useCallback(
    (ctx: CanvasRenderingContext2D, p: Particle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation || 0);

      const arms = p.arms || 6;
      const outerRadius = p.size;
      const innerRadius = p.innerRadius || p.size * 0.3;

      ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity})`;
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.5})`;
      ctx.lineWidth = Math.max(0.5, p.size * 0.1);
      ctx.lineCap = "round";

      // Draw snowflake arms
      for (let i = 0; i < arms; i++) {
        const angle = (i * Math.PI * 2) / arms;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const endX = Math.cos(angle) * outerRadius;
        const endY = Math.sin(angle) * outerRadius;
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Small branches on each arm
        const branchPos = 0.5 + Math.random() * 0.2;
        const branchLen = outerRadius * 0.3;
        const branchX = Math.cos(angle) * outerRadius * branchPos;
        const branchY = Math.sin(angle) * outerRadius * branchPos;

        // Left branch
        ctx.beginPath();
        ctx.moveTo(branchX, branchY);
        ctx.lineTo(
          branchX + Math.cos(angle + Math.PI / 4) * branchLen,
          branchY + Math.sin(angle + Math.PI / 4) * branchLen,
        );
        ctx.stroke();

        // Right branch
        ctx.beginPath();
        ctx.moveTo(branchX, branchY);
        ctx.lineTo(
          branchX + Math.cos(angle - Math.PI / 4) * branchLen,
          branchY + Math.sin(angle - Math.PI / 4) * branchLen,
        );
        ctx.stroke();
      }

      // Center dot
      ctx.beginPath();
      ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
    [],
  );

  // Draw realistic raindrop with reflection
  const drawRaindrop = useCallback(
    (ctx: CanvasRenderingContext2D, p: Particle, windFactor: number) => {
      const dropLength = 12 + p.speed * 8;
      const angle = Math.atan2(p.speed, windFactor * 0.5);

      // Create gradient for raindrop
      const gradient = ctx.createLinearGradient(
        p.x,
        p.y,
        p.x + windFactor * 0.3,
        p.y + dropLength,
      );
      gradient.addColorStop(0, `rgba(200, 220, 255, ${p.opacity * 0.3})`);
      gradient.addColorStop(0.3, `rgba(180, 200, 240, ${p.opacity * 0.7})`);
      gradient.addColorStop(1, `rgba(160, 185, 230, ${p.opacity})`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = p.size;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + windFactor * 0.3, p.y + dropLength);
      ctx.stroke();

      // Add subtle glow for larger drops
      if (p.size > 1.5) {
        ctx.strokeStyle = `rgba(200, 230, 255, ${p.opacity * 0.2})`;
        ctx.lineWidth = p.size * 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + windFactor * 0.3, p.y + dropLength * 0.7);
        ctx.stroke();
      }
    },
    [],
  );

  // Draw splash effect
  const drawSplash = useCallback(
    (ctx: CanvasRenderingContext2D, p: Particle) => {
      if (!p.life || !p.maxLife) return;

      const progress = 1 - p.life / p.maxLife;
      const radius = p.size * (1 + progress * 2);
      const opacity = p.opacity * (1 - progress);

      // Splash ring
      ctx.strokeStyle = `rgba(200, 220, 255, ${opacity})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, radius, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Small droplets flying up
      if (progress < 0.5) {
        const droplets = 3;
        for (let i = 0; i < droplets; i++) {
          const angle = (i / droplets) * Math.PI + Math.PI;
          const dist = radius * 0.5 * progress * 2;
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist * 0.3 - progress * 5;

          ctx.fillStyle = `rgba(200, 220, 255, ${opacity * 0.5})`;
          ctx.beginPath();
          ctx.arc(p.x + dx, p.y + dy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    [],
  );

  // Draw fog layer
  const drawFog = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      p: Particle,
      canvasWidth: number,
      canvasHeight: number,
    ) => {
      const layer = p.layer || 0;
      const baseOpacity =
        p.opacity * (layer === 0 ? 0.3 : layer === 1 ? 0.5 : 0.7);

      // Create a large soft ellipse for fog
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, `rgba(200, 210, 220, ${baseOpacity})`);
      gradient.addColorStop(0.4, `rgba(180, 190, 200, ${baseOpacity * 0.6})`);
      gradient.addColorStop(0.7, `rgba(160, 170, 180, ${baseOpacity * 0.3})`);
      gradient.addColorStop(1, "rgba(150, 160, 170, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * 2, p.size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    },
    [],
  );

  // Draw atmospheric cloud layer - wide horizontal bands instead of bubbles
  const drawCloud = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      p: Particle,
      isDarkCloud: boolean = false,
      canvasWidth: number = 800,
    ) => {
      ctx.save();

      const layer = p.layer || 0;

      // Different colors based on layer depth for atmospheric perspective
      let baseColor: { r: number; g: number; b: number };
      if (isDarkCloud) {
        // Storm clouds - darker, more dramatic
        baseColor =
          layer === 0
            ? { r: 60, g: 65, b: 75 }
            : layer === 1
              ? { r: 75, g: 80, b: 90 }
              : { r: 90, g: 95, b: 105 };
      } else {
        // Regular clouds - soft white to light gray
        baseColor =
          layer === 0
            ? { r: 220, g: 225, b: 230 }
            : layer === 1
              ? { r: 235, g: 238, b: 242 }
              : { r: 248, g: 250, b: 252 };
      }

      // Create wide, flat cloud band - more like a horizontal stripe
      const bandWidth = canvasWidth * (0.6 + layer * 0.2);
      const bandHeight = p.size * (0.2 + layer * 0.1);

      // Use a horizontal gradient for more natural cloud look
      const gradient = ctx.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        bandWidth * 0.5,
      );

      const opacity = p.opacity * (0.6 + layer * 0.15);
      gradient.addColorStop(
        0,
        `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${opacity})`,
      );
      gradient.addColorStop(
        0.3,
        `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${opacity * 0.7})`,
      );
      gradient.addColorStop(
        0.6,
        `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${opacity * 0.3})`,
      );
      gradient.addColorStop(
        1,
        `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0)`,
      );

      ctx.fillStyle = gradient;
      ctx.beginPath();
      // Wide, flat ellipse - much more horizontal than circular
      ctx.ellipse(p.x, p.y, bandWidth * 0.5, bandHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
    [],
  );

  // Draw star with twinkle
  const drawStar = useCallback(
    (ctx: CanvasRenderingContext2D, p: Particle, time: number) => {
      const twinkle = Math.sin(time * 2 + (p.oscillation || 0)) * 0.5 + 0.5;
      const finalOpacity = p.opacity * twinkle;

      // Star glow
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      glow.addColorStop(0, `rgba(255, 255, 255, ${finalOpacity})`);
      glow.addColorStop(0.3, `rgba(200, 220, 255, ${finalOpacity * 0.3})`);
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();

      // Star core
      ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle rays for bright stars
      if (p.size > 1.2 && twinkle > 0.7) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${finalOpacity * 0.5})`;
        ctx.lineWidth = 0.5;
        const rayLength = p.size * 4 * twinkle;

        // Cross pattern
        ctx.beginPath();
        ctx.moveTo(p.x - rayLength, p.y);
        ctx.lineTo(p.x + rayLength, p.y);
        ctx.moveTo(p.x, p.y - rayLength);
        ctx.lineTo(p.x, p.y + rayLength);
        ctx.stroke();
      }
    },
    [],
  );

  // Draw sun with animated rays
  const drawSun = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      time: number,
    ) => {
      const sunX = canvas.width * 0.85;
      const sunY = canvas.height * 0.15;

      // Animated outer glow
      const pulseScale = 1 + Math.sin(time) * 0.05;

      // Outer glow layers
      for (let i = 3; i > 0; i--) {
        const radius = (80 + i * 20) * pulseScale;
        const glow = ctx.createRadialGradient(
          sunX,
          sunY,
          20,
          sunX,
          sunY,
          radius,
        );
        glow.addColorStop(0, `rgba(255, 250, 200, ${0.15 / i})`);
        glow.addColorStop(0.5, `rgba(255, 240, 180, ${0.08 / i})`);
        glow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rotating rays
      const rayCount = 8;
      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(time * 0.1);

      for (let i = 0; i < rayCount; i++) {
        const rayAngle = (i * Math.PI * 2) / rayCount;
        const rayLength = 100 + Math.sin(time * 2 + i) * 20;

        const gradient = ctx.createLinearGradient(0, 0, rayLength, 0);
        gradient.addColorStop(0, "rgba(255, 255, 200, 0.3)");
        gradient.addColorStop(0.5, "rgba(255, 255, 220, 0.1)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.save();
        ctx.rotate(rayAngle);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(30, -4);
        ctx.lineTo(rayLength, 0);
        ctx.lineTo(30, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // Inner sun body
      const innerGlow = ctx.createRadialGradient(
        sunX - 5,
        sunY - 5,
        0,
        sunX,
        sunY,
        35,
      );
      innerGlow.addColorStop(0, "rgba(255, 255, 250, 0.95)");
      innerGlow.addColorStop(0.5, "rgba(255, 250, 200, 0.9)");
      innerGlow.addColorStop(0.8, "rgba(255, 240, 180, 0.7)");
      innerGlow.addColorStop(1, "rgba(255, 230, 150, 0.3)");
      ctx.fillStyle = innerGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 35, 0, Math.PI * 2);
      ctx.fill();
    },
    [],
  );

  // Draw moon with details
  const drawMoon = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      time: number,
    ) => {
      const moonX = canvas.width * 0.85;
      const moonY = canvas.height * 0.2;

      // Ambient glow
      const moonGlow = ctx.createRadialGradient(
        moonX,
        moonY,
        15,
        moonX,
        moonY,
        70,
      );
      moonGlow.addColorStop(0, "rgba(200, 220, 255, 0.25)");
      moonGlow.addColorStop(0.3, "rgba(180, 200, 240, 0.12)");
      moonGlow.addColorStop(0.6, "rgba(160, 180, 220, 0.05)");
      moonGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = moonGlow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 70, 0, Math.PI * 2);
      ctx.fill();

      // Moon body with gradient
      const moonGradient = ctx.createRadialGradient(
        moonX - 8,
        moonY - 8,
        0,
        moonX,
        moonY,
        25,
      );
      moonGradient.addColorStop(0, "rgba(255, 255, 255, 0.98)");
      moonGradient.addColorStop(0.4, "rgba(245, 248, 255, 0.95)");
      moonGradient.addColorStop(0.8, "rgba(220, 230, 245, 0.9)");
      moonGradient.addColorStop(1, "rgba(200, 215, 235, 0.85)");
      ctx.fillStyle = moonGradient;
      ctx.beginPath();
      ctx.arc(moonX, moonY, 25, 0, Math.PI * 2);
      ctx.fill();

      // Craters with subtle shading
      const craters = [
        { x: -8, y: 5, r: 6, depth: 0.15 },
        { x: 7, y: -8, r: 4, depth: 0.12 },
        { x: 3, y: 10, r: 5, depth: 0.1 },
        { x: -4, y: -6, r: 3, depth: 0.08 },
        { x: 10, y: 3, r: 3.5, depth: 0.1 },
      ];

      craters.forEach((crater) => {
        const craterGradient = ctx.createRadialGradient(
          moonX + crater.x - crater.r * 0.3,
          moonY + crater.y - crater.r * 0.3,
          0,
          moonX + crater.x,
          moonY + crater.y,
          crater.r,
        );
        craterGradient.addColorStop(
          0,
          `rgba(180, 190, 210, ${crater.depth * 0.5})`,
        );
        craterGradient.addColorStop(
          0.6,
          `rgba(160, 170, 190, ${crater.depth})`,
        );
        craterGradient.addColorStop(
          1,
          `rgba(140, 150, 170, ${crater.depth * 0.3})`,
        );

        ctx.fillStyle = craterGradient;
        ctx.beginPath();
        ctx.arc(moonX + crater.x, moonY + crater.y, crater.r, 0, Math.PI * 2);
        ctx.fill();
      });
    },
    [],
  );

  // Draw lightning bolt
  const drawLightning = useCallback(
    (ctx: CanvasRenderingContext2D, bolt: LightningBolt) => {
      if (!bolt.active || bolt.flashIntensity <= 0) return;

      // Screen flash
      if (bolt.flashIntensity > 0.7) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(bolt.flashIntensity - 0.7) * 0.3})`;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }

      // Draw each branch segment
      bolt.branches.forEach((branch) => {
        // Outer glow
        ctx.strokeStyle = `rgba(200, 220, 255, ${bolt.flashIntensity * 0.3})`;
        ctx.lineWidth = branch.width * 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(branch.startX, branch.startY);
        ctx.lineTo(branch.endX, branch.endY);
        ctx.stroke();

        // Middle glow
        ctx.strokeStyle = `rgba(220, 240, 255, ${bolt.flashIntensity * 0.6})`;
        ctx.lineWidth = branch.width * 2;
        ctx.beginPath();
        ctx.moveTo(branch.startX, branch.startY);
        ctx.lineTo(branch.endX, branch.endY);
        ctx.stroke();

        // Core
        ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.flashIntensity})`;
        ctx.lineWidth = branch.width;
        ctx.beginPath();
        ctx.moveTo(branch.startX, branch.startY);
        ctx.lineTo(branch.endX, branch.endY);
        ctx.stroke();
      });
    },
    [],
  );

  // Initialize particles based on weather type
  const initParticles = useCallback(
    (canvas: HTMLCanvasElement) => {
      const particles: Particle[] = [];
      const w = canvas.width;
      const h = canvas.height;
      const isMobile = w < 768;

      // Helper to check if it's a rain type
      const isRainType =
        type === "rain" ||
        type === "heavy_rain" ||
        type === "drizzle" ||
        type === "thunderstorm";

      // Rain particles
      if (isRainType) {
        const intensity =
          type === "heavy_rain" || type === "thunderstorm"
            ? 2
            : type === "drizzle"
              ? 0.5
              : 1;
        const count = Math.floor((isMobile ? 50 : 120) * intensity);

        for (let i = 0; i < count; i++) {
          const layer = Math.floor(Math.random() * 3);
          const layerScale = 0.5 + layer * 0.25;

          particles.push({
            x: Math.random() * w * 1.5 - w * 0.25,
            y: Math.random() * h,
            speed:
              (type === "drizzle" ? 0.8 : 1.5 + Math.random()) * layerScale,
            size:
              (type === "drizzle" ? 0.5 : 1 + Math.random() * 0.5) * layerScale,
            opacity: (0.3 + Math.random() * 0.4) * layerScale,
            type: "raindrop",
            layer,
            velocityY:
              (type === "drizzle" ? 2 : 4 + Math.random() * 3) * layerScale,
          });
        }
      }

      // Snow particles
      if (type === "snow") {
        const count = isMobile ? 30 : 60;
        for (let i = 0; i < count; i++) {
          const layer = Math.floor(Math.random() * 3);
          const layerScale = 0.5 + layer * 0.3;

          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            speed: (0.3 + Math.random() * 0.5) * layerScale,
            size: (3 + Math.random() * 4) * layerScale,
            opacity: (0.5 + Math.random() * 0.5) * layerScale,
            type: "snowflake",
            layer,
            oscillation: Math.random() * Math.PI * 2,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.02,
            arms: Math.random() > 0.5 ? 6 : 8,
            innerRadius: 0.2 + Math.random() * 0.2,
          });
        }
      }

      // Stars for clear night
      if (type === "clear" && !isDay) {
        const count = isMobile ? 40 : 80;
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            speed: 0,
            size: 0.5 + Math.random() * 1.5,
            opacity: 0.3 + Math.random() * 0.7,
            oscillation: Math.random() * 100,
            type: "star",
          });
        }
      }

      // Only generate dark clouds for thunderstorm (cloudy weather uses gradient only)
      if (type === "thunderstorm") {
        // Dark storm clouds in background - minimal, just for atmosphere
        for (let i = 0; i < (isMobile ? 2 : 3); i++) {
          particles.push({
            x: Math.random() * w,
            y: h * 0.2 + Math.random() * (h * 0.3),
            speed: 0.01 + Math.random() * 0.01,
            size: 80 + Math.random() * 40,
            opacity: 0.15 + Math.random() * 0.1,
            type: "cloud",
            layer: i % 3,
          });
        }
      }

      // Fog layers
      if (type === "fog" || type === "mist") {
        const density = type === "fog" ? 1.5 : 1;
        const layers = [
          {
            count: Math.floor(4 * density),
            layer: 0,
            sizeBase: 200,
            speedBase: 0.01,
            yRange: [0.4, 0.8],
          },
          {
            count: Math.floor(5 * density),
            layer: 1,
            sizeBase: 150,
            speedBase: 0.02,
            yRange: [0.3, 0.9],
          },
          {
            count: Math.floor(3 * density),
            layer: 2,
            sizeBase: 100,
            speedBase: 0.03,
            yRange: [0.5, 1.0],
          },
        ];

        layers.forEach((config) => {
          for (let i = 0; i < config.count; i++) {
            particles.push({
              x: Math.random() * w * 1.5 - w * 0.25,
              y:
                h * config.yRange[0] +
                Math.random() * (h * (config.yRange[1] - config.yRange[0])),
              speed: config.speedBase + Math.random() * 0.01,
              size: config.sizeBase + Math.random() * 80,
              opacity: (type === "fog" ? 0.15 : 0.08) + Math.random() * 0.1,
              type: "fog",
              layer: config.layer,
              oscillation: Math.random() * Math.PI * 2,
            });
          }
        });
      }

      return particles;
    },
    [type, isDay],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particlesRef.current = initParticles(canvas);
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      timeRef.current += 0.016; // ~60fps
      const time = timeRef.current;
      const windFactor = windSpeed * 0.02;

      // Draw celestial bodies first (background)
      if (type === "clear" && isDay) {
        drawSun(ctx, canvas, time);
      }
      if (type === "clear" && !isDay) {
        drawMoon(ctx, canvas, time);
      }

      // Handle lightning for thunderstorm
      if (type === "thunderstorm") {
        const now = Date.now();

        // Randomly trigger lightning
        if (
          !lightningRef.current?.active &&
          now - lastLightningRef.current > 3000
        ) {
          if (Math.random() < 0.01) {
            // ~1% chance per frame after cooldown
            lightningRef.current = generateLightning(canvas);
            lastLightningRef.current = now;
          }
        }

        // Update and draw lightning
        if (lightningRef.current?.active) {
          lightningRef.current.flashIntensity -= lightningRef.current.fadeSpeed;
          if (lightningRef.current.flashIntensity <= 0) {
            lightningRef.current.active = false;
          } else {
            drawLightning(ctx, lightningRef.current);
          }
        }
      }

      // Process and draw particles
      const newParticles: Particle[] = [];

      particlesRef.current.forEach((p) => {
        // Update particle position based on type
        switch (p.type) {
          case "raindrop": {
            p.y += p.velocityY || p.speed;
            p.x += windFactor * (0.5 + (p.layer || 0) * 0.3);

            // Reset when off screen, possibly create splash
            if (p.y > canvas.height) {
              // Create splash effect occasionally
              if (
                Math.random() < 0.3 &&
                (type === "rain" ||
                  type === "heavy_rain" ||
                  type === "thunderstorm")
              ) {
                newParticles.push({
                  x: p.x,
                  y: canvas.height - 5,
                  speed: 0,
                  size: 2 + Math.random() * 3,
                  opacity: 0.4,
                  type: "splash",
                  life: 1,
                  maxLife: 1,
                });
              }
              p.y = -20;
              p.x = Math.random() * canvas.width * 1.5 - canvas.width * 0.25;
            }
            if (p.x > canvas.width + 50) {
              p.x = -50;
            }

            drawRaindrop(ctx, p, windFactor);
            break;
          }

          case "splash": {
            if (p.life !== undefined && p.maxLife !== undefined) {
              p.life -= 0.05;
              if (p.life <= 0) return; // Don't keep this particle
              drawSplash(ctx, p);
            }
            break;
          }

          case "snowflake": {
            p.y += p.speed;
            p.x +=
              Math.sin(time * 2 + (p.oscillation || 0)) * 0.5 +
              windFactor * 0.3;
            p.rotation = (p.rotation || 0) + (p.rotationSpeed || 0);

            if (p.y > canvas.height + 20) {
              p.y = -20;
              p.x = Math.random() * canvas.width;
            }
            if (p.x > canvas.width + 20) p.x = -20;
            if (p.x < -20) p.x = canvas.width + 20;

            drawSnowflake(ctx, p);
            break;
          }

          case "star": {
            drawStar(ctx, p, time);
            break;
          }

          case "cloud": {
            const layerSpeed =
              (p.layer || 0) === 0 ? 0.3 : (p.layer || 0) === 1 ? 0.5 : 0.8;
            p.x += (windSpeed * 0.01 + p.speed) * layerSpeed;

            // Wrap around when off screen
            if (p.x > canvas.width * 1.5) {
              p.x = -canvas.width * 0.5;
            }

            drawCloud(ctx, p, type === "thunderstorm", canvas.width);
            break;
          }

          case "fog": {
            // Slow drift with subtle oscillation
            const layerSpeed =
              (p.layer || 0) === 0 ? 0.3 : (p.layer || 0) === 1 ? 0.6 : 1;
            p.x += p.speed * layerSpeed + windFactor * 0.1;
            p.y += Math.sin(time * 0.5 + (p.oscillation || 0)) * 0.2;

            if (p.x > canvas.width + p.size * 2) {
              p.x = -p.size * 2;
            }

            drawFog(ctx, p, canvas.width, canvas.height);
            break;
          }
        }
      });

      // Add new particles (splashes, etc)
      particlesRef.current = [
        ...particlesRef.current.filter((p) => {
          if (p.type === "splash" && p.life !== undefined && p.life <= 0)
            return false;
          return true;
        }),
        ...newParticles,
      ];

      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [
    type,
    isDay,
    windSpeed,
    cloudCover,
    initParticles,
    drawSun,
    drawMoon,
    drawStar,
    drawCloud,
    drawFog,
    drawSnowflake,
    drawRaindrop,
    drawSplash,
    drawLightning,
    generateLightning,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
