import { useEffect } from "react";
import { ArrowUp, ArrowDown, Clock, ChevronLeft, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

interface Trade {
  id: string;
  coin_symbol: string;
  coin_name: string;
  timeframe: number;
  direction: "up" | "down";
  amount: number;
  entry_price: number;
  exit_price: number | null;
  return_rate: number;
  result: "win" | "loss" | "pending" | null;
  pnl: number | null;
  created_at: string;
  closed_at: string | null;
}

interface TradeHistoryProps {
  balance: number;
  userName: string;
  trades: Trade[];
  stats: {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPnl: number;
    bestWin: number;
  };
  onBack: () => void;
  onNavigate: (tab: "trade" | "wallet" | "referral" | "profile") => void;
}

const TradeHistory = ({ balance, userName, trades, stats, onBack, onNavigate }: TradeHistoryProps) => {
  const formatTimeframe = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${seconds / 60}m`;
  };

  const getResultColor = (result: string | null) => {
    if (result === "win") return "text-profit";
    if (result === "loss") return "text-loss";
    return "text-primary";
  };

  const getResultBg = (result: string | null) => {
    if (result === "win") return "bg-profit/20";
    if (result === "loss") return "bg-loss/20";
    return "bg-primary/20";
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header balance={balance} userName={userName} />

      <main className="px-4 py-4 space-y-6">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft size={20} />
          <span>Back to Trading</span>
        </button>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Trades</div>
            <div className="text-2xl font-bold text-foreground">{stats.totalTrades}</div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
            <div className={`text-2xl font-bold ${stats.winRate >= 50 ? "text-profit" : "text-loss"}`}>
              {stats.winRate.toFixed(1)}%
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Total P&L</div>
            <div className={`text-2xl font-bold font-mono ${stats.totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
              {stats.totalPnl >= 0 ? "+" : ""}₹{stats.totalPnl.toFixed(2)}
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Best Win</div>
            <div className="text-2xl font-bold font-mono text-profit">
              +₹{stats.bestWin.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Win/Loss Summary */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Performance</span>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 flex items-center gap-2">
              <TrendingUp size={20} className="text-profit" />
              <div>
                <div className="text-lg font-bold text-profit">{stats.wins}</div>
                <div className="text-xs text-muted-foreground">Wins</div>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-2">
              <TrendingDown size={20} className="text-loss" />
              <div>
                <div className="text-lg font-bold text-loss">{stats.losses}</div>
                <div className="text-xs text-muted-foreground">Losses</div>
              </div>
            </div>
          </div>
          {stats.totalTrades > 0 && (
            <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden flex">
              <div
                className="h-full bg-profit"
                style={{ width: `${stats.winRate}%` }}
              />
              <div
                className="h-full bg-loss"
                style={{ width: `${100 - stats.winRate}%` }}
              />
            </div>
          )}
        </div>

        {/* Trade List */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Trade History</h3>
          </div>
          
          {trades.length === 0 ? (
            <div className="p-8 text-center">
              <Clock size={48} className="text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No trades yet</p>
              <p className="text-sm text-muted-foreground">
                Start trading to see your history here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[50vh] overflow-y-auto">
              {trades.map((trade) => (
                <div key={trade.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          trade.direction === "up" ? "bg-profit/20" : "bg-loss/20"
                        }`}
                      >
                        {trade.direction === "up" ? (
                          <ArrowUp size={18} className="text-profit" />
                        ) : (
                          <ArrowDown size={18} className="text-loss" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {trade.coin_symbol}/USDT
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimeframe(trade.timeframe)} • {trade.direction.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-bold ${getResultBg(
                          trade.result
                        )} ${getResultColor(trade.result)}`}
                      >
                        {trade.result?.toUpperCase() || "PENDING"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <div className="text-muted-foreground">Amount</div>
                      <div className="font-mono text-foreground">₹{trade.amount}</div>
                    </div>
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <div className="text-muted-foreground">Entry</div>
                      <div className="font-mono text-foreground">${trade.entry_price.toFixed(2)}</div>
                    </div>
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <div className="text-muted-foreground">Exit</div>
                      <div className="font-mono text-foreground">
                        {trade.exit_price ? `$${trade.exit_price.toFixed(2)}` : "-"}
                      </div>
                    </div>
                    <div className="bg-secondary/50 rounded p-2 text-center">
                      <div className="text-muted-foreground">P&L</div>
                      <div className={`font-mono font-bold ${getResultColor(trade.result)}`}>
                        {trade.pnl !== null
                          ? `${trade.pnl >= 0 ? "+" : ""}₹${trade.pnl.toFixed(2)}`
                          : "-"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    {format(new Date(trade.created_at), "MMM dd, yyyy HH:mm")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav activeTab="trade" onTabChange={onNavigate} />
    </div>
  );
};

export default TradeHistory;
