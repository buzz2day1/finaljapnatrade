import { ArrowUp, ArrowDown } from "lucide-react";

interface Bet {
  amount: number;
  direction: "up" | "down";
  entryPrice: number;
  returnRate: number;
  candleStartTime?: number;
  candleEndTime?: number;
  upTotalBet?: number;
  downTotalBet?: number;
}

interface ActiveBetProps {
  bet: Bet;
  currentPrice: number;
}

const ActiveBet = ({ bet, currentPrice }: ActiveBetProps) => {
  const isWinning =
    (bet.direction === "up" && currentPrice > bet.entryPrice) ||
    (bet.direction === "down" && currentPrice < bet.entryPrice);

  const priceDiff = currentPrice - bet.entryPrice;
  const percentChange = (priceDiff / bet.entryPrice) * 100;

  const candleStart = bet.candleStartTime
    ? new Date(bet.candleStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;
  const candleEnd = bet.candleEndTime
    ? new Date(bet.candleEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  const upTotal = bet.upTotalBet ?? 0;
  const downTotal = bet.downTotalBet ?? 0;
  const total = upTotal + downTotal;
  const upPct = total > 0 ? (upTotal / total) * 100 : 50;

  return (
    <div
      className={`bg-background/60 backdrop-blur-sm rounded-lg p-2 border transition-all ${
        isWinning ? "border-profit/40" : "border-loss/40"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Direction & Status */}
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-md ${
              bet.direction === "up" ? "bg-profit/20" : "bg-loss/20"
            }`}
          >
            {bet.direction === "up" ? (
              <ArrowUp size={14} className="text-profit" />
            ) : (
              <ArrowDown size={14} className="text-loss" />
            )}
          </div>
          <div>
            <div className="font-medium text-foreground text-xs">
              {bet.direction === "up" ? "Long" : "Short"}
            </div>
            <div
              className={`text-[10px] font-bold ${
                isWinning ? "text-profit" : "text-loss"
              }`}
            >
              {isWinning ? "WINNING" : "LOSING"}
            </div>
            {(candleStart && candleEnd) && (
              <div className="text-[9px] text-muted-foreground leading-tight">
                Candle: <span className="font-mono text-foreground/80">{candleStart}</span> →{" "}
                <span className="font-mono text-foreground/80">{candleEnd}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats - Compact */}
        <div className="flex items-center gap-3 text-center">
          <div>
            <div className="text-[8px] text-muted-foreground">Amount</div>
            <div className="font-mono font-bold text-foreground text-xs">₹{bet.amount}</div>
          </div>
          <div>
            <div className="text-[8px] text-muted-foreground">Entry</div>
            <div className="font-mono font-bold text-foreground text-xs">
              {bet.entryPrice.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-[8px] text-muted-foreground">P&L</div>
            <div
              className={`font-mono font-bold text-xs ${
                isWinning ? "text-profit" : "text-loss"
              }`}
            >
              {percentChange >= 0 ? "+" : ""}
              {percentChange.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-[8px] text-muted-foreground">Return</div>
            <div className="font-mono text-profit font-bold text-xs">
              ₹{(bet.amount * (1 + bet.returnRate / 100)).toFixed(0)}
            </div>
          </div>
        </div>

        {/* Market totals (simulated) */}
        {(upTotal > 0 || downTotal > 0) && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1">
              <span>Market UP ₹{Math.round(upTotal).toLocaleString()}</span>
              <span>DOWN ₹{Math.round(downTotal).toLocaleString()}</span>
            </div>
            <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-profit/70"
                style={{ width: `${Math.max(5, Math.min(95, upPct))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActiveBet;
