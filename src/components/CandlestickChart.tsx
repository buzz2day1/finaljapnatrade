import { useEffect, useState, useRef, useCallback } from "react";

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  time: number;
  volume: number;
}

interface CandlestickChartProps {
  timeframe: number;
  coinSymbol: string;
  basePrice: number;
  onPriceUpdate?: (price: number) => void;
}

interface CrosshairData {
  x: number;
  y: number;
  price: number;
  time: number;
  visible: boolean;
}

// Prices in INR
const COIN_BASE_PRICES: Record<string, number> = {
  BTC: 3754468, ETH: 203912, SOL: 8171, BNB: 25924, XRP: 43.44,
  ADA: 37.91, DOGE: 6.83, DOT: 562.74, MATIC: 74.15, SHIB: 0.00102,
  LTC: 6013, AVAX: 2868, LINK: 1181, UNI: 526, ATOM: 757,
  XLM: 10.24, ALGO: 13.01, VET: 1.94, FIL: 378, NEAR: 194,
  APT: 720, ARB: 102, OP: 203, INJ: 1946, SUI: 129,
  SEI: 37.35, TIA: 1024, PEPE: 0.000102, WIF: 194, BONK: 0.00195,
  JUP: 73.87, PYTH: 28.22,
};

// Chart data persistence key
const getChartStorageKey = (coin: string, tf: number) => `chart_state_${coin}_${tf}_v2`;

// Mulberry32 PRNG for consistent random numbers
const mulberry32 = (seed: number) => {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

// Generate consistent seed based on coin, timeframe, and candle index with time synchronization
const generateSeed = (coin: string, tf: number, candleStartTime: number) => {
  const str = `${coin}-${tf}-${candleStartTime}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const CandlestickChart = ({ timeframe, coinSymbol, basePrice, onPriceUpdate }: CandlestickChartProps) => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentCandle, setCurrentCandle] = useState<Candle | null>(null);
  const [currentPrice, setCurrentPrice] = useState(basePrice);
  const [viewOffset, setViewOffset] = useState(0);
  const [scale, setScale] = useState(1);
  const [crosshair, setCrosshair] = useState<CrosshairData>({ x: 0, y: 0, price: 0, time: 0, visible: false });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const lastPriceRef = useRef(basePrice);
  const candleStartTimeRef = useRef<number>(0);
  const targetPriceRef = useRef(basePrice);
  const currentCandleRef = useRef<Candle | null>(null);
  const currentVolumeRef = useRef(0);
  const animationPhaseRef = useRef(0);

  // Inertial panning
  const velocityRef = useRef(0);
  const inertiaRef = useRef<number>();

  // Pinch zoom
  const initialPinchDistRef = useRef(0);
  const initialScaleRef = useRef(1);

  // Chart dimensions for crosshair calculations
  const chartDimensionsRef = useRef({ paddedMin: 0, paddedMax: 0, displayRange: 1, chartHeight: 0, paddingTop: 20, paddingRight: 70 });

  const MAX_HISTORY_CANDLES = 500;
  const VISIBLE_CANDLES = Math.max(10, Math.floor(40 / scale));

  // Generate historical candles using time-synchronized seeded random
  const generateInitialCandles = useCallback(() => {
    const initialCandles: Candle[] = [];
    const coinBasePrice = COIN_BASE_PRICES[coinSymbol] || basePrice;
    const candleDurationMs = timeframe * 1000;
    const now = Date.now();
    
    // Calculate the current candle's start time
    const currentCandleStart = Math.floor(now / candleDurationMs) * candleDurationMs;
    
    let price = coinBasePrice * 0.9;

    for (let i = 0; i < MAX_HISTORY_CANDLES; i++) {
      const candleStartTime = currentCandleStart - (MAX_HISTORY_CANDLES - i) * candleDurationMs;
      const seed = generateSeed(coinSymbol, timeframe, candleStartTime);
      const random = mulberry32(seed);

      const rand1 = random();
      const rand2 = random();
      const rand3 = random();
      const rand4 = random();
      const rand5 = random();

      const isUp = rand1 > 0.5;
      const sizePercent = 0.002 + rand2 * 0.012;
      const bodySize = price * sizePercent;

      const open = price;
      const close = isUp ? open + bodySize : open - bodySize;
      const minPrice = coinBasePrice * 0.7;
      const maxPrice = coinBasePrice * 1.3;
      const clampedClose = Math.max(minPrice, Math.min(maxPrice, close));

      const wickFactor = 0.15 + rand3 * 0.25;
      const upperWick = Math.abs(clampedClose - open) * wickFactor * rand4;
      const lowerWick = Math.abs(clampedClose - open) * wickFactor * (1 - rand4);

      const baseVolume = 1000 + rand5 * 5000;
      const moveMultiplier = 1 + Math.abs(clampedClose - open) / open * 30;
      const volume = baseVolume * moveMultiplier;

      initialCandles.push({
        open,
        high: Math.max(open, clampedClose) + upperWick,
        low: Math.min(open, clampedClose) - lowerWick,
        close: clampedClose,
        time: candleStartTime,
        volume,
      });

      price = clampedClose;
    }

    return initialCandles;
  }, [timeframe, coinSymbol, basePrice]);

  // Load saved state or generate new
  useEffect(() => {
    const storageKey = getChartStorageKey(coinSymbol, timeframe);
    const savedState = localStorage.getItem(storageKey);
    
    const now = Date.now();
    const candleDurationMs = timeframe * 1000;
    const currentCandleStart = Math.floor(now / candleDurationMs) * candleDurationMs;
    
    let newCandles: Candle[];
    let lastPrice: number;
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const lastCandleTime = parsed.candles[parsed.candles.length - 1]?.time || 0;
        
        // If the saved state is still valid (within the same session window)
        if (currentCandleStart - lastCandleTime <= candleDurationMs * 5) {
          // Fill in any missing candles
          const missingCandles: Candle[] = [];
          let fillPrice = parsed.lastPrice;
          
          for (let t = lastCandleTime + candleDurationMs; t < currentCandleStart; t += candleDurationMs) {
            const seed = generateSeed(coinSymbol, timeframe, t);
            const random = mulberry32(seed);
            
            const rand1 = random();
            const rand2 = random();
            const rand3 = random();
            const rand4 = random();
            const rand5 = random();

            const isUp = rand1 > 0.5;
            const sizePercent = 0.002 + rand2 * 0.012;
            const bodySize = fillPrice * sizePercent;
            const coinBasePrice = COIN_BASE_PRICES[coinSymbol] || basePrice;
            
            const open = fillPrice;
            const close = isUp ? open + bodySize : open - bodySize;
            const clampedClose = Math.max(coinBasePrice * 0.7, Math.min(coinBasePrice * 1.3, close));
            
            const wickFactor = 0.15 + rand3 * 0.25;
            const upperWick = Math.abs(clampedClose - open) * wickFactor * rand4;
            const lowerWick = Math.abs(clampedClose - open) * wickFactor * (1 - rand4);
            
            missingCandles.push({
              open,
              high: Math.max(open, clampedClose) + upperWick,
              low: Math.min(open, clampedClose) - lowerWick,
              close: clampedClose,
              time: t,
              volume: 1000 + rand5 * 5000,
            });
            
            fillPrice = clampedClose;
          }
          
          newCandles = [...parsed.candles, ...missingCandles].slice(-MAX_HISTORY_CANDLES);
          lastPrice = newCandles[newCandles.length - 1]?.close || basePrice;
        } else {
          newCandles = generateInitialCandles();
          lastPrice = newCandles[newCandles.length - 1]?.close || basePrice;
        }
      } catch {
        newCandles = generateInitialCandles();
        lastPrice = newCandles[newCandles.length - 1]?.close || basePrice;
      }
    } else {
      newCandles = generateInitialCandles();
      lastPrice = newCandles[newCandles.length - 1]?.close || basePrice;
    }
    
    setCandles(newCandles);
    setCurrentPrice(lastPrice);
    lastPriceRef.current = lastPrice;
    targetPriceRef.current = lastPrice;
    setViewOffset(0);
    setCurrentCandle(null);
    currentCandleRef.current = null;
    candleStartTimeRef.current = 0;
    animationPhaseRef.current = 0;
    currentVolumeRef.current = 0;
    velocityRef.current = 0;
    // Note: onPriceUpdate is now handled by a separate effect to avoid setState during render
  }, [coinSymbol, timeframe, generateInitialCandles, basePrice]);

  // Save state periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (candles.length > 0) {
        const storageKey = getChartStorageKey(coinSymbol, timeframe);
        localStorage.setItem(storageKey, JSON.stringify({
          candles: candles.slice(-100), // Save last 100 candles to reduce storage
          lastPrice: lastPriceRef.current,
          timestamp: Date.now()
        }));
      }
    }, 5000);
    
    return () => clearInterval(saveInterval);
  }, [candles, coinSymbol, timeframe]);

  // Smooth price animation with professional movement
  useEffect(() => {
    let mounted = true;
    
    const updatePrice = () => {
      if (!mounted) return;
      
      const now = Date.now();
      const candleStart = candleStartTimeRef.current || now;
      const elapsed = now - candleStart;
      const totalDuration = timeframe * 1000;
      const progress = Math.min(1, elapsed / totalDuration);
      
      // Multi-phase animation for realistic price movement
      animationPhaseRef.current += 0.02;
      const phase = animationPhaseRef.current;
      
      // Combine multiple sine waves for organic movement
      const wave1 = Math.sin(phase * 2.1) * 0.3;
      const wave2 = Math.sin(phase * 3.7) * 0.2;
      const wave3 = Math.sin(phase * 5.3) * 0.1;
      const waveOffset = (wave1 + wave2 + wave3) * 0.4;
      
      // Increment volume gradually with variation
      currentVolumeRef.current += 5 + Math.random() * 25;

      setCurrentPrice(prev => {
        const target = targetPriceRef.current;
        const start = currentCandleRef.current?.open ?? prev;
        
        // Smooth easing with organic wave motion
        const easeProgress = 1 - Math.pow(1 - progress, 2.5);
        const basePriceCalc = start + (target - start) * easeProgress;
        
        // Add subtle oscillation around the target path
        const oscillation = (target - start) * waveOffset * (1 - progress);
        const newPrice = basePriceCalc + oscillation;
        
        // Smooth interpolation
        const smoothPrice = prev + (newPrice - prev) * 0.08;
        
        lastPriceRef.current = smoothPrice;
        return smoothPrice;
      });
    };

    const interval = setInterval(updatePrice, 33); // ~30fps for smoother animation
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [timeframe]);

  // Separate effect to notify parent of price updates (avoids setState during render)
  useEffect(() => {
    if (onPriceUpdate) {
      onPriceUpdate(currentPrice);
    }
  }, [currentPrice, onPriceUpdate]);

  // Candle formation with time synchronization
  useEffect(() => {
    const coinBasePrice = COIN_BASE_PRICES[coinSymbol] || basePrice;
    const candleDurationMs = timeframe * 1000;

    const tick = () => {
      const now = Date.now();
      const candleStartTime = Math.floor(now / candleDurationMs) * candleDurationMs;

      if (candleStartTimeRef.current !== candleStartTime) {
        const prevCandle = currentCandleRef.current;
        if (prevCandle) {
          setCandles(c => {
            const finished = { ...prevCandle, close: lastPriceRef.current, volume: currentVolumeRef.current };
            finished.high = Math.max(finished.high, finished.close);
            finished.low = Math.min(finished.low, finished.close);
            return [...c, finished].slice(-MAX_HISTORY_CANDLES);
          });
        }

        candleStartTimeRef.current = candleStartTime;
        animationPhaseRef.current = 0;
        currentVolumeRef.current = 0;

        // Generate target price using seeded random for consistency
        const seed = generateSeed(coinSymbol, timeframe, candleStartTime);
        const random = mulberry32(seed);
        
        const openPrice = lastPriceRef.current;
        const rand1 = random();
        const rand2 = random();
        
        const isUp = rand1 > 0.5;
        const sizePercent = 0.002 + rand2 * 0.012;
        const bodySize = openPrice * sizePercent;
        let target = isUp ? openPrice + bodySize : openPrice - bodySize;
        target = Math.max(coinBasePrice * 0.7, Math.min(coinBasePrice * 1.3, target));
        targetPriceRef.current = target;

        const nextCandle: Candle = { 
          open: openPrice, 
          high: openPrice, 
          low: openPrice, 
          close: openPrice, 
          time: candleStartTime, 
          volume: 0 
        };
        currentCandleRef.current = nextCandle;
        setCurrentCandle(nextCandle);
        return;
      }

      const live = currentCandleRef.current;
      if (!live) return;
      const price = lastPriceRef.current;
      const updated: Candle = { 
        ...live, 
        high: Math.max(live.high, price), 
        low: Math.min(live.low, price), 
        close: price, 
        volume: currentVolumeRef.current 
      };
      currentCandleRef.current = updated;
      setCurrentCandle(updated);
    };

    const interval = setInterval(tick, 80);
    tick();
    return () => clearInterval(interval);
  }, [timeframe, coinSymbol, basePrice]);

  // Inertial animation
  useEffect(() => {
    const animate = () => {
      if (Math.abs(velocityRef.current) > 0.1) {
        setViewOffset(prev => {
          const maxOffset = Math.max(0, candles.length - VISIBLE_CANDLES);
          const next = prev + velocityRef.current;
          return Math.max(0, Math.min(maxOffset, next));
        });
        velocityRef.current *= 0.92;
        inertiaRef.current = requestAnimationFrame(animate);
      }
    };

    return () => { if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current); };
  }, [candles.length, VISIBLE_CANDLES]);

  // Touch/mouse events with inertia + pinch zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDragging = false;
    let lastX = 0;
    let lastTime = 0;

    const startDrag = (x: number) => {
      isDragging = true;
      lastX = x;
      lastTime = Date.now();
      velocityRef.current = 0;
      if (inertiaRef.current) cancelAnimationFrame(inertiaRef.current);
      container.style.cursor = 'grabbing';
    };

    const moveDrag = (x: number) => {
      if (!isDragging) return;
      const now = Date.now();
      const dt = now - lastTime;
      const delta = x - lastX;

      if (dt > 0) {
        velocityRef.current = delta / dt * 8;
      }

      lastX = x;
      lastTime = now;

      setViewOffset(prev => {
        const maxOffset = Math.max(0, candles.length - VISIBLE_CANDLES);
        return Math.max(0, Math.min(maxOffset, prev + delta / 8));
      });
    };

    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      container.style.cursor = 'grab';

      if (Math.abs(velocityRef.current) > 0.5) {
        const animate = () => {
          if (Math.abs(velocityRef.current) > 0.1) {
            setViewOffset(prev => {
              const maxOffset = Math.max(0, candles.length - VISIBLE_CANDLES);
              return Math.max(0, Math.min(maxOffset, prev + velocityRef.current));
            });
            velocityRef.current *= 0.92;
            inertiaRef.current = requestAnimationFrame(animate);
          }
        };
        inertiaRef.current = requestAnimationFrame(animate);
      }
    };

    const onMouseDown = (e: MouseEvent) => startDrag(e.clientX);
    const onMouseMove = (e: MouseEvent) => moveDrag(e.clientX);
    const onMouseUp = () => endDrag();

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startDrag(e.touches[0].clientX);
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistRef.current = Math.hypot(dx, dy);
        initialScaleRef.current = scale;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        moveDrag(e.touches[0].clientX);
      } else if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const ratio = dist / initialPinchDistRef.current;
        setScale(Math.max(0.5, Math.min(3, initialScaleRef.current * ratio)));
      }
    };

    const onTouchEnd = () => endDrag();

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        setScale(prev => Math.max(0.5, Math.min(3, prev - e.deltaY * 0.002)));
      } else {
        setViewOffset(prev => {
          const maxOffset = Math.max(0, candles.length - VISIBLE_CANDLES);
          return Math.max(0, Math.min(maxOffset, prev + e.deltaY / 15));
        });
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.style.cursor = 'grab';

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('wheel', onWheel);
    };
  }, [candles.length, VISIBLE_CANDLES, scale]);

  // Draw main chart with volume bars
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      const volumeHeight = 40;
      const padding = { top: 15, right: 65, bottom: 8 + volumeHeight, left: 8 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      // Background gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, "hsl(220, 25%, 6%)");
      bgGradient.addColorStop(1, "hsl(220, 20%, 3%)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      const allCandles = currentCandle ? [...candles, currentCandle] : candles;
      const startIdx = Math.max(0, allCandles.length - VISIBLE_CANDLES - Math.floor(viewOffset));
      const endIdx = Math.min(allCandles.length, startIdx + VISIBLE_CANDLES);
      const visibleCandles = allCandles.slice(startIdx, endIdx);

      if (visibleCandles.length === 0) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const prices = visibleCandles.flatMap(c => [c.high, c.low]);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = (maxPrice - minPrice) || maxPrice * 0.01;
      const paddedMin = minPrice - priceRange * 0.1;
      const paddedMax = maxPrice + priceRange * 0.1;
      const displayRange = paddedMax - paddedMin;

      const volumes = visibleCandles.map(c => c.volume);
      const maxVolume = Math.max(...volumes, 1);

      chartDimensionsRef.current = { paddedMin, paddedMax, displayRange, chartHeight, paddingTop: padding.top, paddingRight: padding.right };

      // Grid lines
      ctx.strokeStyle = "hsla(220, 15%, 20%, 0.3)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.setLineDash([2, 4]);
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.setLineDash([]);

        const price = paddedMax - (displayRange / 4) * i;
        ctx.fillStyle = "hsl(215, 20%, 45%)";
        ctx.font = "10px 'SF Mono', Monaco, monospace";
        ctx.textAlign = "left";
        ctx.fillText(formatPrice(price), width - padding.right + 4, y + 3);
      }

      // Candles
      const gap = chartWidth / visibleCandles.length;
      const candleWidth = Math.max(2, Math.min(gap * 0.72, gap - 2));

      visibleCandles.forEach((candle, index) => {
        const x = padding.left + index * gap + gap / 2;
        const isGreen = candle.close >= candle.open;
        const color = isGreen ? "hsl(155, 100%, 50%)" : "hsl(345, 90%, 55%)";

        const openY = padding.top + ((paddedMax - candle.open) / displayRange) * chartHeight;
        const closeY = padding.top + ((paddedMax - candle.close) / displayRange) * chartHeight;
        const highY = padding.top + ((paddedMax - candle.high) / displayRange) * chartHeight;
        const lowY = padding.top + ((paddedMax - candle.low) / displayRange) * chartHeight;

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Body
        ctx.fillStyle = color;
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(2, Math.abs(closeY - openY));
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

        // Glow for current candle
        if (endIdx === allCandles.length && index === visibleCandles.length - 1) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 12;
          ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
          ctx.shadowBlur = 0;
        }

        // Volume bar
        const volumeBarHeight = (candle.volume / maxVolume) * (volumeHeight - 5);
        const volumeY = height - padding.bottom + volumeHeight - volumeBarHeight + 5;
        ctx.fillStyle = isGreen ? "hsla(155, 100%, 50%, 0.25)" : "hsla(345, 90%, 55%, 0.25)";
        ctx.fillRect(x - candleWidth / 2, volumeY, candleWidth, volumeBarHeight);
      });

      // Volume label
      ctx.fillStyle = "hsl(215, 20%, 40%)";
      ctx.font = "9px 'SF Mono', Monaco, monospace";
      ctx.textAlign = "left";
      ctx.fillText("VOL", padding.left, height - 6);

      // Current price line
      if (viewOffset < 5 && currentCandle) {
        const priceY = padding.top + ((paddedMax - currentPrice) / displayRange) * chartHeight;
        const isGreen = currentPrice >= currentCandle.open;
        const color = isGreen ? "hsl(155, 100%, 50%)" : "hsl(345, 90%, 55%)";

        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, priceY);
        ctx.lineTo(width - padding.right, priceY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Price tag
        ctx.fillStyle = color;
        const tagWidth = 58;
        const tagHeight = 18;
        const tagX = width - padding.right;
        const tagY = priceY - tagHeight / 2;
        
        ctx.beginPath();
        ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 3);
        ctx.fill();
        
        ctx.fillStyle = "hsl(220, 20%, 4%)";
        ctx.font = "bold 10px 'SF Mono', Monaco, monospace";
        ctx.textAlign = "left";
        ctx.fillText(formatPrice(currentPrice), tagX + 4, priceY + 4);
      }

      // Crosshair
      if (crosshair.visible && crosshair.x > padding.left && crosshair.x < width - padding.right && crosshair.y > padding.top && crosshair.y < height - padding.bottom) {
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = "hsl(45, 100%, 51%)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(crosshair.x, padding.top);
        ctx.lineTo(crosshair.x, height - padding.bottom);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(padding.left, crosshair.y);
        ctx.lineTo(width - padding.right, crosshair.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Price label
        ctx.fillStyle = "hsl(45, 100%, 51%)";
        ctx.beginPath();
        ctx.roundRect(width - padding.right, crosshair.y - 9, 58, 18, 3);
        ctx.fill();
        ctx.fillStyle = "hsl(220, 20%, 4%)";
        ctx.font = "bold 10px 'SF Mono', Monaco, monospace";
        ctx.textAlign = "left";
        ctx.fillText(formatPrice(crosshair.price), width - padding.right + 4, crosshair.y + 4);

        // Time label
        const date = new Date(crosshair.time);
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        ctx.fillStyle = "hsl(45, 100%, 51%)";
        const timeWidth = ctx.measureText(timeStr).width + 10;
        ctx.beginPath();
        ctx.roundRect(crosshair.x - timeWidth / 2, height - padding.bottom - volumeHeight + 2, timeWidth, 16, 3);
        ctx.fill();
        ctx.fillStyle = "hsl(220, 20%, 4%)";
        ctx.font = "bold 9px 'SF Mono', Monaco, monospace";
        ctx.textAlign = "center";
        ctx.fillText(timeStr, crosshair.x, height - padding.bottom - volumeHeight + 13);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [candles, currentCandle, currentPrice, viewOffset, scale, VISIBLE_CANDLES, crosshair]);

  // Draw minimap
  useEffect(() => {
    const minimap = minimapRef.current;
    if (!minimap) return;
    const ctx = minimap.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = minimap.getBoundingClientRect();
    minimap.width = rect.width * dpr;
    minimap.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.fillStyle = "hsl(220, 20%, 6%)";
    ctx.fillRect(0, 0, width, height);

    const allCandles = currentCandle ? [...candles, currentCandle] : candles;
    if (allCandles.length === 0) return;

    const prices = allCandles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const displayRange = (maxPrice - minPrice) || 1;

    const candleWidth = Math.max(1, width / allCandles.length);
    allCandles.forEach((candle, i) => {
      const x = (i / allCandles.length) * width;
      const isGreen = candle.close >= candle.open;
      ctx.fillStyle = isGreen ? "hsl(155, 80%, 40%)" : "hsl(345, 70%, 45%)";

      const top = ((maxPrice - Math.max(candle.open, candle.close)) / displayRange) * height;
      const bottom = ((maxPrice - Math.min(candle.open, candle.close)) / displayRange) * height;
      ctx.fillRect(x, top, candleWidth, Math.max(1, bottom - top));
    });

    // Viewport indicator
    const totalCandles = allCandles.length;
    const viewStart = Math.max(0, totalCandles - VISIBLE_CANDLES - Math.floor(viewOffset));
    const viewEnd = Math.min(totalCandles, viewStart + VISIBLE_CANDLES);

    const vpX = (viewStart / totalCandles) * width;
    const vpWidth = ((viewEnd - viewStart) / totalCandles) * width;

    ctx.fillStyle = "hsla(45, 100%, 50%, 0.15)";
    ctx.fillRect(vpX, 0, vpWidth, height);
    ctx.strokeStyle = "hsl(45, 100%, 50%)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vpX, 0, vpWidth, height);
  }, [candles, currentCandle, viewOffset, VISIBLE_CANDLES]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;

    const allCandles = currentCandle ? [...candles, currentCandle] : candles;
    const targetIdx = Math.floor(ratio * allCandles.length);
    const newOffset = Math.max(0, allCandles.length - targetIdx - VISIBLE_CANDLES / 2);
    const maxOffset = Math.max(0, allCandles.length - VISIBLE_CANDLES);
    setViewOffset(Math.max(0, Math.min(maxOffset, newOffset)));
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const { paddedMax, displayRange, chartHeight, paddingTop, paddingRight } = chartDimensionsRef.current;
    const padding = { left: 8 };
    
    const priceAtCursor = paddedMax - ((y - paddingTop) / chartHeight) * displayRange;
    
    const allCandles = currentCandle ? [...candles, currentCandle] : candles;
    const startIdx = Math.max(0, allCandles.length - VISIBLE_CANDLES - Math.floor(viewOffset));
    const endIdx = Math.min(allCandles.length, startIdx + VISIBLE_CANDLES);
    const visibleCandles = allCandles.slice(startIdx, endIdx);
    
    const chartWidth = rect.width - padding.left - paddingRight;
    const gap = chartWidth / visibleCandles.length;
    const candleIdx = Math.floor((x - padding.left) / gap);
    
    const hoveredCandle = visibleCandles[candleIdx];
    const candleTime = hoveredCandle?.time || Date.now();
    
    setCrosshair({
      x,
      y,
      price: priceAtCursor,
      time: candleTime,
      visible: true
    });
  }, [candles, currentCandle, viewOffset, VISIBLE_CANDLES]);

  const handleMouseLeave = useCallback(() => {
    setCrosshair(prev => ({ ...prev, visible: false }));
  }, []);

  function formatPrice(price: number) {
    if (price >= 100000) return `₹${(price / 100000).toFixed(2)}L`;
    if (price >= 1000) return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `₹${price.toFixed(2)}`;
    if (price >= 0.01) return `₹${price.toFixed(4)}`;
    return `₹${price.toFixed(6)}`;
  }

  return (
    <div className="w-full h-full flex flex-col bg-background rounded-lg overflow-hidden">
      {/* Main chart */}
      <div ref={containerRef} className="flex-1 relative min-h-0">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full" 
          style={{ display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        <div className="absolute bottom-12 right-2 flex gap-1 z-10">
          <button
            onClick={() => setScale(s => Math.min(3, s + 0.25))}
            className="w-7 h-7 bg-secondary/90 hover:bg-secondary rounded text-foreground flex items-center justify-center text-sm font-bold backdrop-blur-sm"
          >+</button>
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
            className="w-7 h-7 bg-secondary/90 hover:bg-secondary rounded text-foreground flex items-center justify-center text-sm font-bold backdrop-blur-sm"
          >−</button>
          <button
            onClick={() => { setViewOffset(0); setScale(1); }}
            className="px-2 h-7 bg-secondary/90 hover:bg-secondary rounded text-foreground text-xs flex items-center justify-center backdrop-blur-sm"
          >Reset</button>
        </div>
      </div>

      {/* Minimap */}
      <div className="h-8 px-2 py-1">
        <canvas
          ref={minimapRef}
          onClick={handleMinimapClick}
          className="w-full h-full rounded cursor-pointer"
          style={{ display: "block" }}
        />
      </div>
    </div>
  );
};

export default CandlestickChart;
