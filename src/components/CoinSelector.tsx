import { useState, useMemo, useCallback, memo } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// USD to INR conversion rate
const USD_TO_INR = 83;

interface Coin {
  symbol: string;
  name: string;
  icon: string;
  price: number; // Price in INR
  change: number;
}

// Prices are in INR
const coins: Coin[] = [
  { symbol: "BTC", name: "Bitcoin", icon: "₿", price: 3754468, change: 2.34 },
  { symbol: "ETH", name: "Ethereum", icon: "Ξ", price: 203912, change: -1.23 },
  { symbol: "SOL", name: "Solana", icon: "◎", price: 8171, change: 5.67 },
  { symbol: "BNB", name: "BNB", icon: "⬡", price: 25924, change: 0.89 },
  { symbol: "XRP", name: "Ripple", icon: "✕", price: 43.44, change: -2.45 },
  { symbol: "ADA", name: "Cardano", icon: "₳", price: 37.91, change: 3.21 },
  { symbol: "DOGE", name: "Dogecoin", icon: "Ð", price: 6.83, change: 8.45 },
  { symbol: "DOT", name: "Polkadot", icon: "●", price: 562.74, change: -0.56 },
  { symbol: "MATIC", name: "Polygon", icon: "⬢", price: 74.15, change: 4.32 },
  { symbol: "SHIB", name: "Shiba Inu", icon: "柴", price: 0.00102, change: 12.34 },
  { symbol: "LTC", name: "Litecoin", icon: "Ł", price: 6013, change: 1.23 },
  { symbol: "AVAX", name: "Avalanche", icon: "▲", price: 2868, change: -3.45 },
  { symbol: "LINK", name: "Chainlink", icon: "⬡", price: 1181, change: 2.67 },
  { symbol: "UNI", name: "Uniswap", icon: "🦄", price: 526, change: 0.45 },
  { symbol: "ATOM", name: "Cosmos", icon: "⚛", price: 757, change: -1.89 },
  { symbol: "XLM", name: "Stellar", icon: "✦", price: 10.24, change: 3.45 },
  { symbol: "ALGO", name: "Algorand", icon: "Ⱥ", price: 13.01, change: -0.78 },
  { symbol: "VET", name: "VeChain", icon: "✓", price: 1.94, change: 5.67 },
  { symbol: "FIL", name: "Filecoin", icon: "⨍", price: 378, change: 2.34 },
  { symbol: "NEAR", name: "NEAR", icon: "Ⓝ", price: 194, change: -4.56 },
  { symbol: "APT", name: "Aptos", icon: "◆", price: 720, change: 6.78 },
  { symbol: "ARB", name: "Arbitrum", icon: "⟠", price: 102, change: 1.45 },
  { symbol: "OP", name: "Optimism", icon: "⊕", price: 203, change: -2.34 },
  { symbol: "INJ", name: "Injective", icon: "◇", price: 1946, change: 8.90 },
  { symbol: "SUI", name: "Sui", icon: "〜", price: 129, change: 4.56 },
  { symbol: "SEI", name: "Sei", icon: "◈", price: 37.35, change: -1.23 },
  { symbol: "TIA", name: "Celestia", icon: "☆", price: 1024, change: 7.89 },
  { symbol: "PEPE", name: "Pepe", icon: "🐸", price: 0.000102, change: 15.67 },
  { symbol: "WIF", name: "dogwifhat", icon: "🎩", price: 194, change: 22.34 },
  { symbol: "BONK", name: "Bonk", icon: "🐕", price: 0.00195, change: -5.67 },
  { symbol: "JUP", name: "Jupiter", icon: "♃", price: 73.87, change: 3.45 },
  { symbol: "PYTH", name: "Pyth", icon: "⌘", price: 28.22, change: 1.23 },
];

// Helper to format INR price
const formatINRPrice = (price: number): string => {
  if (price >= 100000) {
    return `₹${(price / 100000).toFixed(2)}L`;
  } else if (price >= 1000) {
    return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  } else if (price >= 1) {
    return `₹${price.toFixed(2)}`;
  } else if (price >= 0.01) {
    return `₹${price.toFixed(4)}`;
  } else {
    return `₹${price.toFixed(6)}`;
  }
};

interface CoinSelectorProps {
  selectedCoin: Coin;
  onSelectCoin: (coin: Coin) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

// Memoized coin item for better performance
const CoinItem = memo(({ 
  coin, 
  isSelected, 
  onClick 
}: { 
  coin: Coin; 
  isSelected: boolean; 
  onClick: () => void;
}) => (
  <motion.button
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    whileTap={{ scale: 0.98, backgroundColor: "hsl(var(--primary) / 0.1)" }}
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors active:bg-primary/10 ${
      isSelected ? "bg-primary/15 border-l-2 border-primary" : "hover:bg-secondary/80"
    }`}
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
      isSelected ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"
    }`}>
      {coin.icon}
    </div>
    <div className="flex-1 text-left min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground">{coin.symbol}</span>
        {isSelected && <Check size={14} className="text-primary" />}
      </div>
      <div className="text-xs text-muted-foreground truncate">{coin.name}</div>
    </div>
    <div className="text-right flex-shrink-0">
      <div className="font-mono text-sm text-foreground font-medium">
        {formatINRPrice(coin.price)}
      </div>
      <div
        className={`text-xs font-medium ${coin.change >= 0 ? "text-profit" : "text-loss"}`}
      >
        {coin.change >= 0 ? "+" : ""}
        {coin.change}%
      </div>
    </div>
  </motion.button>
));

CoinItem.displayName = 'CoinItem';

const CoinSelector = ({ selectedCoin, onSelectCoin, onSwipeLeft, onSwipeRight }: CoinSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const currentIndex = useMemo(() => 
    coins.findIndex(c => c.symbol === selectedCoin.symbol),
    [selectedCoin.symbol]
  );

  const filteredCoins = useMemo(() => 
    coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [searchQuery]
  );

  const handlePrevCoin = useCallback(() => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : coins.length - 1;
    onSelectCoin(coins[prevIndex]);
  }, [currentIndex, onSelectCoin]);

  const handleNextCoin = useCallback(() => {
    const nextIndex = currentIndex < coins.length - 1 ? currentIndex + 1 : 0;
    onSelectCoin(coins[nextIndex]);
  }, [currentIndex, onSelectCoin]);

  const handleSelectCoin = useCallback((coin: Coin) => {
    onSelectCoin(coin);
    setIsOpen(false);
    setSearchQuery("");
  }, [onSelectCoin]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery("");
  }, []);

  return (
    <div className="relative flex-1 min-w-0">
      {/* Swipe-enabled coin display with arrows */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* Left Arrow - Previous Coin */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handlePrevCoin}
          className="p-1.5 sm:p-2 bg-secondary/60 hover:bg-secondary rounded-full transition-all touch-manipulation flex-shrink-0"
          aria-label="Previous coin"
        >
          <ChevronLeft size={16} className="text-muted-foreground" />
        </motion.button>

        {/* Coin Selector Button - Improved for mobile */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 glass-card rounded-xl hover:border-primary/50 transition-all flex-1 min-w-0 border border-transparent active:border-primary/30"
        >
          <motion.div 
            key={selectedCoin.symbol}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-gold rounded-full flex items-center justify-center text-background font-bold text-sm sm:text-base flex-shrink-0 shadow-lg"
          >
            {selectedCoin.icon}
          </motion.div>
          <div className="text-left min-w-0 flex-1">
            <motion.div 
              key={`name-${selectedCoin.symbol}`}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-1"
            >
              <span className="font-bold text-foreground text-sm sm:text-base">{selectedCoin.symbol}</span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground">/USDT</span>
            </motion.div>
            <motion.div 
              key={`change-${selectedCoin.symbol}`}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className={`text-xs sm:text-sm font-semibold ${
                selectedCoin.change >= 0 ? "text-profit" : "text-loss"
              }`}
            >
              {selectedCoin.change >= 0 ? "+" : ""}
              {selectedCoin.change}%
            </motion.div>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" />
          </motion.div>
        </motion.button>

        {/* Right Arrow - Next Coin */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleNextCoin}
          className="p-1.5 sm:p-2 bg-secondary/60 hover:bg-secondary rounded-full transition-all touch-manipulation flex-shrink-0"
          aria-label="Next coin"
        >
          <ChevronRight size={16} className="text-muted-foreground" />
        </motion.button>
      </div>

      {/* Dropdown Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop with blur */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" 
              onClick={handleClose} 
            />
            
            {/* Dropdown Content */}
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed left-2 right-2 top-20 sm:absolute sm:top-full sm:left-0 sm:right-0 sm:mt-2 glass-card rounded-2xl z-50 overflow-hidden max-h-[70vh] sm:max-h-[50vh] flex flex-col shadow-2xl border border-border/50"
            >
              {/* Header with search */}
              <div className="p-3 sm:p-4 border-b border-border/50 bg-secondary/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Select Coin</h3>
                  <span className="text-xs text-muted-foreground">{coins.length} coins</span>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search coins..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground border border-border/50"
                  />
                </div>
              </div>
              
              {/* Coins List with smooth scroll */}
              <div className="overflow-y-auto flex-1 overscroll-contain">
                <AnimatePresence mode="popLayout">
                  {filteredCoins.length > 0 ? (
                    filteredCoins.map((coin, index) => (
                      <CoinItem
                        key={coin.symbol}
                        coin={coin}
                        isSelected={coin.symbol === selectedCoin.symbol}
                        onClick={() => handleSelectCoin(coin)}
                      />
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No coins found
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export { coins, formatINRPrice };
export type { Coin };
export default CoinSelector;
