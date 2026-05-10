import { useEffect, useState, useRef } from "react";

interface TradingTimerProps {
  timeframe: number; // in seconds
  onCandleClose: () => void;
  compact?: boolean;
}

const TradingTimer = ({ timeframe, onCandleClose, compact = false }: TradingTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const lastCandleEndRef = useRef<number>(0);
  const hasCalledCloseRef = useRef(false);
  const onCandleCloseRef = useRef(onCandleClose);

  useEffect(() => {
    onCandleCloseRef.current = onCandleClose;
  }, [onCandleClose]);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const candleEndTime = Math.ceil(now / (timeframe * 1000)) * timeframe * 1000;
      const remaining = Math.max(0, Math.floor((candleEndTime - now) / 1000));
      const msRemaining = Math.max(0, candleEndTime - now);
      return { remaining, candleEndTime, msRemaining };
    };

    const { remaining: initialRemaining, candleEndTime: initialCandleEnd } = calculateTimeLeft();
    setTimeLeft(initialRemaining);
    lastCandleEndRef.current = initialCandleEnd;
    hasCalledCloseRef.current = false;

    const interval = setInterval(() => {
      const { remaining, candleEndTime, msRemaining } = calculateTimeLeft();
      setTimeLeft(remaining);

      // Trigger candle close exactly at the boundary (within 60ms tolerance)
      if (msRemaining <= 60 && !hasCalledCloseRef.current) {
        hasCalledCloseRef.current = true;
        onCandleCloseRef.current();
      }

      // Reset for next candle when we cross to new period
      if (candleEndTime !== lastCandleEndRef.current) {
        lastCandleEndRef.current = candleEndTime;
        hasCalledCloseRef.current = false;
      }
    }, 40);

    return () => clearInterval(interval);
  }, [timeframe]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((timeframe - timeLeft) / timeframe) * 100;

  const isLow = timeLeft <= 5;
  const isCritical = timeLeft <= 3;

  // Calculate stroke dash for circular progress
  const radius = compact ? 18 : 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const size = compact ? 44 : 72;
  const viewBox = compact ? "0 0 50 50" : "0 0 100 100";
  const cx = compact ? 25 : 50;
  const cy = compact ? 25 : 50;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg className="w-full h-full -rotate-90" viewBox={viewBox}>
            {/* Background circle */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="3"
              opacity="0.3"
            />
            {/* Progress circle */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={isCritical ? "hsl(var(--loss))" : isLow ? "hsl(var(--primary))" : "hsl(var(--profit))"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-100"
              style={{
                filter: isCritical
                  ? "drop-shadow(0 0 6px hsl(var(--loss)))"
                  : isLow
                  ? "drop-shadow(0 0 5px hsl(var(--primary)))"
                  : "drop-shadow(0 0 4px hsl(var(--profit)))",
              }}
            />
          </svg>
          
          {/* Timer text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`font-mono text-sm font-bold ${
                isCritical ? "text-loss animate-pulse" : isLow ? "text-primary" : "text-foreground"
              }`}
            >
              {minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : seconds}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="text-[9px] text-muted-foreground uppercase tracking-[0.15em] font-medium mb-1.5">
        Next Candle
      </div>
      <div className="relative w-[72px] h-[72px]">
        {/* Background glow */}
        <div 
          className={`absolute inset-0 rounded-full blur-lg transition-all duration-300 ${
            isCritical ? "bg-loss/30" : isLow ? "bg-primary/30" : "bg-profit/20"
          }`}
        />
        
        <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={38}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="5"
            opacity="0.3"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={38}
            fill="none"
            stroke={isCritical ? "hsl(var(--loss))" : isLow ? "hsl(var(--primary))" : "hsl(var(--profit))"}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 38}
            strokeDashoffset={(2 * Math.PI * 38) - (progress / 100) * (2 * Math.PI * 38)}
            className="transition-all duration-100"
            style={{
              filter: isCritical
                ? "drop-shadow(0 0 12px hsl(var(--loss)))"
                : isLow
                ? "drop-shadow(0 0 10px hsl(var(--primary)))"
                : "drop-shadow(0 0 8px hsl(var(--profit)))",
            }}
          />
        </svg>
        
        {/* Timer text */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <span
            className={`font-mono text-2xl font-bold tracking-tight ${
              isCritical ? "text-loss animate-pulse" : isLow ? "text-primary" : "text-foreground"
            }`}
          >
            {minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, "0")}` : seconds}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TradingTimer;
