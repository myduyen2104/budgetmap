"use client";

import { useEffect, useRef } from "react";

const SOURCE_ART = "/brand/auth-warm-editorial.png";

function parseHexColor(value: string) {
  const hex = value.trim().replace(/^#/, "");
  if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(hex)) return null;
  const expanded =
    hex.length === 3 ? [...hex].map((part) => part + part).join("") : hex;
  return [0, 2, 4].map(
    (offset) => Number.parseInt(expanded.slice(offset, offset + 2), 16) / 255,
  ) as [number, number, number];
}

function rgbToHsl(red: number, green: number, blue: number) {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  if (!delta) return [0, 0, lightness] as const;
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (max === red) hue = ((green - blue) / delta) % 6;
  else if (max === green) hue = (blue - red) / delta + 2;
  else hue = (red - green) / delta + 4;
  return [(((hue * 60) % 360) + 360) % 360, saturation, lightness] as const;
}

function hslToRgb(hue: number, saturation: number, lightness: number) {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const [red, green, blue] =
    segment < 1
      ? [chroma, secondary, 0]
      : segment < 2
        ? [secondary, chroma, 0]
        : segment < 3
          ? [0, chroma, secondary]
          : segment < 4
            ? [0, secondary, chroma]
            : segment < 5
              ? [secondary, 0, chroma]
              : [chroma, 0, secondary];
  const offset = lightness - chroma / 2;
  return [red + offset, green + offset, blue + offset] as const;
}

function blendPixelWithColor(
  data: Uint8ClampedArray,
  index: number,
  color: readonly [number, number, number],
  amount: number,
) {
  data[index] = Math.round(data[index] * (1 - amount) + color[0] * 255 * amount);
  data[index + 1] = Math.round(data[index + 1] * (1 - amount) + color[1] * 255 * amount);
  data[index + 2] = Math.round(data[index + 2] * (1 - amount) + color[2] * 255 * amount);
}

export function AuthThemeArt() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !context) return;

    const image = new Image();
    const protectedObjects = new Image();
    const maskCanvas = document.createElement("canvas");
    const maskContext = maskCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!maskContext) return;
    let frame = 0;
    let disposed = false;
    let protectedPixels: Uint8ClampedArray | null = null;

    const render = () => {
      if (
        disposed ||
        !image.complete ||
        !image.naturalWidth ||
        !protectedObjects.complete ||
        !protectedObjects.naturalWidth
      )
        return;
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (
        protectedObjects.naturalWidth !== width ||
        protectedObjects.naturalHeight !== height
      )
        return;
      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      if (!protectedPixels) {
        maskCanvas.width = width;
        maskCanvas.height = height;
        maskContext.drawImage(protectedObjects, 0, 0, width, height);
        protectedPixels = maskContext.getImageData(0, 0, width, height).data;
      }

      const root = document.documentElement;
      const themeColor =
        getComputedStyle(root).getPropertyValue("--theme-primary").trim() ||
        getComputedStyle(root).getPropertyValue("--purple").trim() ||
        "#806fe5";
      const isYellowTheme = root.dataset.themeColor === "yellow";
      const isGreenTheme = root.dataset.themeColor === "green";
      const isRedTheme = root.dataset.themeColor === "red";
      const isBurgundyTheme = root.dataset.themeColor === "burgundy";
      const isBrownTheme = root.dataset.themeColor === "brown";
      const wallThemeColor = isYellowTheme || isBrownTheme
        ? getComputedStyle(root)
            .getPropertyValue("--theme-primary-strong")
            .trim() || themeColor
        : themeColor;
      const rgb = parseHexColor(wallThemeColor);
      const tintRgb = parseHexColor(themeColor) ?? rgb;
      const neutralBeige = parseHexColor("#f1e6d7");
      if (!rgb || !tintRgb || !neutralBeige) return;
      const [themeHue, themeSaturation] = rgbToHsl(...rgb);
      const wallSaturation = isYellowTheme
        ? Math.min(0.66, themeSaturation * 0.92)
        : isGreenTheme
          ? Math.max(0.22, Math.min(0.62, themeSaturation * 0.82))
        : isRedTheme
          ? Math.max(0.5, Math.min(0.76, themeSaturation * 1.35))
            : isBurgundyTheme
              ? Math.max(0.56, Math.min(0.72, themeSaturation * 1.24))
            : isBrownTheme
              ? Math.max(0.36, Math.min(0.46, themeSaturation * 1.25))
              : Math.max(0.14, Math.min(0.56, themeSaturation * 0.62));
      const pixels = context.getImageData(0, 0, width, height);
      const { data } = pixels;
      const blendPixel = (index: number, amount: number) => {
        blendPixelWithColor(data, index, tintRgb, amount);
      };
      const addGreenAmbient = (index: number, amount = 0.1) => {
        if (isGreenTheme) blendPixel(index, amount);
      };

      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const isWallArea = x < 1240 && y < 685;
          const isWindowArea = x >= 1240 && y < 545;
          const isChartArea = x >= 1240 && y >= 545 && y < 715;
          const isFloorArea = y >= 685 && !isChartArea;
          if (!isWallArea && !isWindowArea && !isChartArea && !isFloorArea) continue;
          const index = (y * width + x) * 4;
          const [sourceHue, sourceSaturation, sourceLightness] = rgbToHsl(
            data[index] / 255,
            data[index + 1] / 255,
            data[index + 2] / 255,
          );
          const isCeramicVase =
            x >= 900 && x < 1120 && y >= 490 && y < 700 &&
            sourceHue >= 8 && sourceHue <= 55 &&
            sourceSaturation < 0.82 && sourceLightness > 0.48;
          if (isCeramicVase) {
            const [vaseRed, vaseGreen, vaseBlue] = hslToRgb(
              38,
              0.1,
              Math.min(0.96, sourceLightness * 0.94 + 0.04),
            );
            data[index] = Math.round(vaseRed * 255);
            data[index + 1] = Math.round(vaseGreen * 255);
            data[index + 2] = Math.round(vaseBlue * 255);
            addGreenAmbient(index, 0.12);
            continue;
          }
          if (protectedPixels && protectedPixels[index + 3] > 12) {
            // Keep the ceramic vase neutral across themes; preserve foliage and
            // metallic coins from the protected foreground mask.
            continue;
          }
          // Fill mask pinholes inside the pot silhouette before wall recoloring.
          const vaseProgress = (y - 500) / 185;
          const isVaseSilhouette =
            vaseProgress >= 0 &&
            vaseProgress <= 1 &&
            x >= 960 - 40 * vaseProgress &&
            x <= 1080 + 30 * vaseProgress;
          if (isVaseSilhouette) {
            const [vaseRed, vaseGreen, vaseBlue] = hslToRgb(
              38,
              Math.min(Math.max(sourceSaturation * 0.18, 0.1), 0.14),
              Math.min(0.96, sourceLightness * 0.94 + 0.04),
            );
            data[index] = Math.round(vaseRed * 255);
            data[index + 1] = Math.round(vaseGreen * 255);
            data[index + 2] = Math.round(vaseBlue * 255);
            addGreenAmbient(index, 0.12);
            continue;
          }
          // Keep the floor and outdoor scenery neutral, with a subtle palette wash.
          if (isWindowArea) {
            blendPixelWithColor(data, index, neutralBeige, 0.16);
            addGreenAmbient(index, 0.1);
            continue;
          }
          if (isFloorArea) {
            // Remove the source floor's orange chroma rather than layering over it.
            // Retain luminance so sunlight and floor shadows remain visible.
            const [floorRed, floorGreen, floorBlue] = hslToRgb(
              38,
              Math.min(Math.max(sourceSaturation * 0.18, 0.13), 0.17),
              Math.min(0.96, sourceLightness * 0.94 + 0.04),
            );
            data[index] = Math.round(floorRed * 255);
            data[index + 1] = Math.round(floorGreen * 255);
            data[index + 2] = Math.round(floorBlue * 255);
            addGreenAmbient(index, 0.12);
            continue;
          }
          // Keep the paper/card beige; recolor only the darker, saturated bars.
          if (
            isChartArea &&
            (sourceLightness > 0.72 || sourceSaturation < 0.35)
          ) {
            blendPixelWithColor(data, index, neutralBeige, 0.2);
            addGreenAmbient(index, 0.08);
            continue;
          }
          // The source architecture is terracotta. Keeping this narrow hue range protects
          // green foliage, yellow sunlight, metallic coins, the landscape, and the tabletop.
          const isArchitectureHue =
            isRedTheme || isBurgundyTheme
              ? sourceHue <= 48 || sourceHue >= 330
              : sourceHue <= 34 && sourceHue >= 4;
          if (
            !isArchitectureHue ||
            sourceSaturation < 0.18 ||
            sourceLightness < 0.13 ||
            sourceLightness > 0.94
          )
            continue;
          const lightness = isRedTheme
            ? Math.max(0.2, Math.min(0.86, sourceLightness * 0.92))
            : isBurgundyTheme
              ? Math.max(0.13, Math.min(0.32, sourceLightness * 0.46))
              : isBrownTheme
                ? Math.max(0.22, Math.min(0.48, sourceLightness * 0.6))
                : sourceLightness;
          const wallLightness = isYellowTheme
            ? lightness * 0.48 + 0.56 * 0.52
            : lightness;
          let [red, green, blue] = hslToRgb(
            themeHue,
            wallSaturation,
            wallLightness,
          );
          if (isYellowTheme) {
            const lemonMix = 0.24;
            red = red * (1 - lemonMix) + rgb[0] * lemonMix;
            green = green * (1 - lemonMix) + rgb[1] * lemonMix;
            blue = blue * (1 - lemonMix) + rgb[2] * lemonMix;
          }
          data[index] = Math.round(red * 255);
          data[index + 1] = Math.round(green * 255);
          data[index + 2] = Math.round(blue * 255);
        }
      }
      context.putImageData(pixels, 0, 0);
    };

    image.onload = render;
    protectedObjects.onload = render;
    image.src = SOURCE_ART;
    protectedObjects.src = "/brand/auth-foreground-preserve-mask.png";
    if (image.complete && protectedObjects.complete) render();

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(render);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["style", "data-theme-color"],
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      image.onload = null;
      protectedObjects.onload = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="auth-theme-art-canvas"
      aria-hidden="true"
    />
  );
}
