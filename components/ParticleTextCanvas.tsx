import React, { useEffect, useRef } from 'react';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bx: number;
  by: number;
};

type ParticleTextCanvasProps = {
  /** 단일 문자열 — `\n`으로 줄 구분 */
  text?: string;
  /** 여러 줄 텍스트 (text보다 우선) */
  lines?: string[];
  className?: string;
  /** 텍스트·인터랙션 스케일 (기본 1) */
  sizeScale?: number;
  /** 파티클 RGBA 색상 */
  particleColor?: [number, number, number, number];
  /** 마우스 없을 때 자동으로 반발 포인트가 움직임 */
  autoAnimate?: boolean;
  /** 자동 움직임 궤도 크기 (컨테이너 너비 대비, 기본 0.14) */
  idleOrbitScale?: number;
  /** 캔버스 텍스트 윤곽선 서체 */
  fontFamily?: string;
  /** 캔버스 텍스트 윤곽선 굵기 */
  fontWeight?: number;
  /** 텍스트·반발 여백 (컨테이너 대비, 기본 0.1) */
  edgePaddingRatio?: number;
};

const resolveLines = (text: string, lines?: string[]): string[] => {
  if (lines && lines.length > 0) {
    return lines.map((line) => line.trim()).filter(Boolean);
  }
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const dist = (x1: number, y1: number, x2: number, y2: number) =>
  Math.hypot(x1 - x2, y1 - y2);
const angle = (x1: number, y1: number, x2: number, y2: number) =>
  Math.atan2(y2 - y1, x2 - x1);

type EngineOptions = {
  mouse: { lerpAmt: number; repelThreshold: number };
  particles: { density: number; pLerpAmt: number; vLerpAmt: number };
  text: {
    fontColor: [number, number, number, number];
    fontSize: number;
    lines: string[];
  };
};

const buildOptions = (
  lines: string[],
  fontSize: number,
  fontColor: [number, number, number, number]
): EngineOptions => ({
  mouse: { lerpAmt: 0.5, repelThreshold: 100 },
  particles: {
    density: 3,
    pLerpAmt: 0.25,
    vLerpAmt: 0.1,
  },
  text: {
    fontColor,
    fontSize,
    lines,
  },
});

const DEFAULT_FONT_FAMILY = 'Oswald, "Arial Narrow", system-ui, sans-serif';
const DEFAULT_FONT_WEIGHT = 700;
const LINE_LEADING = 1.2;
const EDGE_PADDING_RATIO = 0.1;

const pixelDensity = (density: number) => (4 - density) * 4;

export const ParticleTextCanvas: React.FC<ParticleTextCanvasProps> = ({
  text = 'TEESHOT\nDESIGN',
  lines: linesProp,
  className = '',
  sizeScale = 1,
  particleColor = [163, 230, 53, 255] as [number, number, number, number],
  autoAnimate = false,
  idleOrbitScale = 0.14,
  fontFamily = DEFAULT_FONT_FAMILY,
  fontWeight = DEFAULT_FONT_WEIGHT,
  edgePaddingRatio = EDGE_PADDING_RATIO,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messageLines = resolveLines(text, linesProp);
  const linesKey = messageLines.join('\n');

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const buffer = document.createElement('canvas');
    const bufferCtx = buffer.getContext('2d', { willReadFrequently: true });
    const ctx = canvas.getContext('2d');
    if (!bufferCtx || !ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let imageBuffer: ImageData | null = null;
    let hover = false;
    let userx = 0;
    let usery = 0;
    let repelx = -9999;
    let repely = -9999;
    let animPhase = 0;
    let textBlockCenterX = 0;
    let textBlockCenterY = 0;
    let fontSize = 120;
    let options = buildOptions(messageLines, fontSize, particleColor);
    let rafId = 0;

    const lineCount = messageLines.length;

    const computeFontSize = () => {
      const padX = width * edgePaddingRatio;
      const padY = height * edgePaddingRatio;
      const innerW = Math.max(1, width - padX * 2);
      const innerH = Math.max(1, height - padY * 2);
      const widthBased = Math.floor(innerW * 0.22 * sizeScale);

      if (lineCount <= 1) {
        const heightBased = Math.floor(innerH * 0.88);
        return Math.max(48, Math.min(260, Math.min(widthBased, heightBased)));
      }

      const heightBased = Math.floor(
        innerH / (lineCount * LINE_LEADING - (LINE_LEADING - 1) + (lineCount - 1) * 0.1)
      );
      return Math.max(48, Math.min(260, Math.min(widthBased, heightBased)));
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      buffer.width = width;
      buffer.height = height;

      imageBuffer = bufferCtx.createImageData(width, height);

      fontSize = computeFontSize();
      options = buildOptions(messageLines, fontSize, particleColor);
      options.mouse.repelThreshold = 120 * sizeScale;
    };

    const drawMessage = () => {
      bufferCtx.clearRect(0, 0, width, height);
      const { fontSize: size, lines } = options.text;
      bufferCtx.font = `${fontWeight} ${size}px ${fontFamily}`;
      bufferCtx.textAlign = 'center';
      bufferCtx.textBaseline = 'alphabetic';
      bufferCtx.lineWidth = 1.5;
      bufferCtx.strokeStyle = 'rgba(255,255,255,0.95)';

      const gap = size * 0.1;
      const padY = height * edgePaddingRatio;
      const innerH = height - padY * 2;
      const lineMetrics = lines.map((line) => {
        const metrics = bufferCtx.measureText(line);
        return {
          ascent: metrics.actualBoundingBoxAscent ?? size * 0.85,
          descent: metrics.actualBoundingBoxDescent ?? size * 0.22,
        };
      });

      const blockHeight = lineMetrics.reduce(
        (total, metric, index) =>
          total + metric.ascent + metric.descent + (index < lines.length - 1 ? gap : 0),
        0
      );

      let y = padY + (innerH - blockHeight) / 2;
      textBlockCenterX = width / 2;
      textBlockCenterY = y + blockHeight / 2;

      lines.forEach((line, index) => {
        const metric = lineMetrics[index];
        bufferCtx.strokeText(line, textBlockCenterX, y + metric.ascent);
        y += metric.ascent + metric.descent + gap;
      });
    };

    const mapParticles = () => {
      drawMessage();
      const { data } = bufferCtx.getImageData(0, 0, width, height);
      const step = pixelDensity(options.particles.density) * 4;
      const next: Particle[] = [];

      for (let i = 0; i < data.length; i += step) {
        if (data[i + 3] > 0) {
          const bx = (i / 4) % width;
          const by = Math.floor(i / 4 / width);
          next.push({
            x: bx,
            y: by,
            vx: 0,
            vy: 0,
            bx,
            by,
          });
        }
      }

      particles = next;
    };

    const updatePixelCoords = (p: Particle): Particle => {
      const dx = p.bx - p.x;
      const dy = p.by - p.y;

      let targetVx = dx;
      let targetVy = dy;

      if (hover || autoAnimate) {
        const rd = Math.max(dist(p.x, p.y, repelx, repely), 0.001);
        const phi = angle(repelx, repely, p.x, p.y);
        const threshold = options.mouse.repelThreshold;
        const f = (threshold * threshold) / rd * (rd / threshold);
        targetVx = dx + Math.cos(phi) * f;
        targetVy = dy + Math.sin(phi) * f;
      }

      const vx = lerp(p.vx, targetVx, options.particles.vLerpAmt);
      const vy = lerp(p.vy, targetVy, options.particles.vLerpAmt);
      const x = lerp(p.x, p.x + vx, options.particles.pLerpAmt);
      const y = lerp(p.y, p.y + vy, options.particles.pLerpAmt);

      return { ...p, x, y, vx, vy };
    };

    const drawParticles = () => {
      if (!imageBuffer) return;

      imageBuffer.data.fill(0);
      const [r, g, b, a] = options.text.fontColor;

      for (let index = 0; index < particles.length; index++) {
        particles[index] = updatePixelCoords(particles[index]);
        const { x, y } = particles[index];
        const px = x | 0;
        const py = y | 0;

        if (px >= 0 && px < width && py >= 0 && py < height) {
          const i = 4 * (px + py * width);
          imageBuffer.data[i] = r;
          imageBuffer.data[i + 1] = g;
          imageBuffer.data[i + 2] = b;
          imageBuffer.data[i + 3] = a;
        }
      }

      bufferCtx.putImageData(imageBuffer, 0, 0);
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      drawParticles();

      ctx.save();
      ctx.filter = 'blur(8px) brightness(200%)';
      ctx.drawImage(buffer, 0, 0, width, height);
      ctx.filter = 'blur(0)';
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(buffer, 0, 0, width, height);
      ctx.restore();
    };

    const update = () => {
      if (hover) {
        repelx = lerp(repelx, userx, options.mouse.lerpAmt);
        repely = lerp(repely, usery, options.mouse.lerpAmt);
      } else if (autoAnimate && width > 0) {
        animPhase += 0.018;
        const orbitX = width * idleOrbitScale;
        const orbitY = height * idleOrbitScale * 0.72;
        const targetX = textBlockCenterX + Math.cos(animPhase) * orbitX;
        const targetY = textBlockCenterY + Math.sin(animPhase * 1.28) * orbitY;
        repelx = lerp(repelx, targetX, 0.07);
        repely = lerp(repely, targetY, 0.07);
      }
    };

    const tick = () => {
      update();
      render();
      rafId = requestAnimationFrame(tick);
    };

    const setup = async () => {
      resize();
      try {
        await document.fonts.load(`${fontWeight} ${fontSize}px ${fontFamily.split(',')[0].trim()}`);
      } catch {
        /* fallback system font */
      }
      mapParticles();
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      hover = true;
      userx = event.clientX - rect.left;
      usery = event.clientY - rect.top;
    };

    const onMouseLeave = () => {
      hover = false;
    };

    const onResize = () => {
      resize();
      mapParticles();
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);
    container.addEventListener('mousemove', onMouseMove, { passive: true });
    container.addEventListener('mouseleave', onMouseLeave);
    setup().then(() => {
      rafId = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [linesKey, sizeScale, particleColor, autoAnimate, idleOrbitScale, fontFamily, fontWeight, edgePaddingRatio]);

  return (
    <div ref={containerRef} className={`relative ${className}`} aria-hidden>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};
