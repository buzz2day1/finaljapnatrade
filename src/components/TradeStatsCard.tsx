import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Trophy, Target, BarChart3 } from "lucide-react";

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

interface TradeStatsCardProps {
  trades: Trade[];
}

const TradeStatsCard = ({ trades }: TradeStatsCardProps) => {
  const stats = useMemo(() => {
    const completedTrades = trades.filter(t => t.result && t.result !== "pending");
    const wins = completedTrades.filter(t => t.result === "win");
    const losses = completedTrades.filter(t => t.result === "loss");
    
    const totalPnl = completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const bestWin = Math.max(...wins.map(t => t.pnl || 0), 0);
    const worstLoss = Math.min(...losses.map(t => t.pnl || 0), 0);
    const winRate = completedTrades.length > 0 
      ? (wins.length / completedTrades.length) * 100 
      : 0;
    
    // Calculate member since date
    const firstTrade = trades.length > 0 
      ? new Date(trades[trades.length - 1].created_at)
      : new Date();
    const memberSince = firstTrade.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    return {
      totalTrades: completedTrades.length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      totalPnl,
      bestWin,
      worstLoss,
      memberSince,
    };
  }, [trades]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  // Win rate progress bar color
  const getWinRateColor = (rate: number) => {
    if (rate >= 50) return "bg-profit";
    if (rate >= 30) return "bg-primary";
    return "bg-loss";
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Win Rate Card with Animated Progress */}
      <motion.div 
        variants={itemVariants}
        className="glass-card rounded-2xl p-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Target size={18} className="text-primary" />
            </div>
            <span className="font-medium text-foreground">Win Rate</span>
          </div>
          <motion.span 
            className="text-2xl font-bold text-primary"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
          >
            {stats.winRate.toFixed(1)}%
          </motion.span>
        </div>
        
        {/* Animated Progress Bar */}
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${getWinRateColor(stats.winRate)} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${stats.winRate}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          />
        </div>
        
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{stats.wins} wins</span>
          <span>{stats.losses} losses</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total P&L */}
        <motion.div 
          variants={itemVariants}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            {stats.totalPnl >= 0 ? (
              <TrendingUp size={16} className="text-profit" />
            ) : (
              <TrendingDown size={16} className="text-loss" />
            )}
            <span className="text-xs text-muted-foreground">Total P&L</span>
          </div>
          <motion.div
            className={`text-xl font-bold font-mono ${
              stats.totalPnl >= 0 ? "text-profit" : "text-loss"
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {stats.totalPnl >= 0 ? "+" : ""}₹{Math.abs(stats.totalPnl).toFixed(0)}
          </motion.div>
        </motion.div>

        {/* Total Trades */}
        <motion.div 
          variants={itemVariants}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground">Total Trades</span>
          </div>
          <motion.div
            className="text-xl font-bold text-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            {stats.totalTrades}
          </motion.div>
        </motion.div>

        {/* Best Win */}
        <motion.div 
          variants={itemVariants}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground">Best Win</span>
          </div>
          <motion.div
            className="text-xl font-bold font-mono text-profit"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            +₹{stats.bestWin.toFixed(0)}
          </motion.div>
        </motion.div>

        {/* Member Since */}
        <motion.div 
          variants={itemVariants}
          className="glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">Member Since</span>
          </div>
          <motion.div
            className="text-lg font-bold text-foreground"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            {stats.memberSince}
          </motion.div>
        </motion.div>
      </div>

      {/* Win/Loss Visual Distribution */}
      {stats.totalTrades > 0 && (
        <motion.div 
          variants={itemVariants}
          className="glass-card rounded-xl p-4"
        >
          <div className="text-xs text-muted-foreground mb-3">Trade Distribution</div>
          <div className="flex gap-1 h-8">
            {Array.from({ length: Math.min(20, stats.totalTrades) }).map((_, i) => {
              const isWin = i < Math.round((stats.wins / stats.totalTrades) * Math.min(20, stats.totalTrades));
              return (
                <motion.div
                  key={i}
                  className={`flex-1 rounded-sm ${isWin ? "bg-profit" : "bg-loss"}`}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.8 + i * 0.03, duration: 0.3 }}
                  style={{ transformOrigin: "bottom" }}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-profit">Wins ({stats.wins})</span>
            <span className="text-xs text-loss">Losses ({stats.losses})</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TradeStatsCard;
