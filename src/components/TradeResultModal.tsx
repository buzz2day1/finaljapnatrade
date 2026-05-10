import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, TrendingDown, X } from "lucide-react";

interface TradeResult {
  result: "win" | "loss";
  amount: number;
  pnl: number;
  coinSymbol: string;
  direction: "up" | "down";
  returnRate: number;
}

interface TradeResultModalProps {
  result: TradeResult | null;
  onClose: () => void;
}

const TradeResultModal = ({ result, onClose }: TradeResultModalProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (result) {
      setIsVisible(true);
      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [result, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!result) return null;

  const isWin = result.result === "win";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`relative w-full max-w-sm rounded-2xl p-6 ${
              isWin 
                ? "bg-gradient-to-br from-profit/20 via-profit/10 to-background border-2 border-profit/50" 
                : "bg-gradient-to-br from-loss/20 via-loss/10 to-background border-2 border-loss/50"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <X size={16} className="text-muted-foreground" />
            </button>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                isWin ? "bg-profit/20" : "bg-loss/20"
              }`}
            >
              {isWin ? (
                <Trophy size={40} className="text-profit" />
              ) : (
                <TrendingDown size={40} className="text-loss" />
              )}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`text-2xl font-bold text-center mb-2 ${
                isWin ? "text-profit" : "text-loss"
              }`}
            >
              {isWin ? "🎉 You Won!" : "Trade Lost"}
            </motion.h2>

            {/* Amount */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-4"
            >
              <span className={`text-4xl font-bold font-mono ${isWin ? "text-profit" : "text-loss"}`}>
                {isWin ? "+" : ""}₹{Math.abs(result.pnl).toFixed(2)}
              </span>
            </motion.div>

            {/* Trade Details */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-2 bg-secondary/30 rounded-xl p-3"
            >
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Coin</span>
                <span className="font-medium text-foreground">{result.coinSymbol}/USDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Direction</span>
                <span className={`font-medium ${result.direction === "up" ? "text-profit" : "text-loss"}`}>
                  {result.direction === "up" ? "Long ↑" : "Short ↓"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bet Amount</span>
                <span className="font-mono text-foreground">₹{result.amount}</span>
              </div>
              {isWin && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Return Rate</span>
                  <span className="font-mono text-profit">+{result.returnRate}%</span>
                </div>
              )}
            </motion.div>

            {/* Action Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={handleClose}
              className={`w-full mt-4 py-3 rounded-xl font-semibold transition-all ${
                isWin 
                  ? "bg-profit text-white hover:bg-profit/90" 
                  : "bg-loss text-white hover:bg-loss/90"
              }`}
            >
              {isWin ? "Collect Winnings" : "Try Again"}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TradeResultModal;
