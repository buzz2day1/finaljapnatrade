import { useState } from "react";
import { ArrowUp, ArrowDown, Minus, Plus, Zap } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BetControlsProps {
  balance: number;
  onPlaceBet: (amount: number, direction: "up" | "down") => void;
  disabled?: boolean;
  returnRate: number;
  oneClickEnabled?: boolean;
  onOneClickToggle?: (enabled: boolean) => void;
  oneClickAmount?: number;
  onOneClickAmountChange?: (amount: number) => void;
  onOneClickUp?: () => void;
  onOneClickDown?: () => void;
}

const betAmounts = [10, 50, 100, 500, 1000];
const MIN_BET = 10;
const MAX_BET = 5000;

const BetControls = ({ 
  balance, 
  onPlaceBet, 
  disabled, 
  returnRate,
  oneClickEnabled = false,
  onOneClickToggle,
  oneClickAmount = 10,
  onOneClickAmountChange,
  onOneClickUp,
  onOneClickDown
}: BetControlsProps) => {
  const [selectedAmount, setSelectedAmount] = useState(10);
  const [customAmount, setCustomAmount] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingDirection, setPendingDirection] = useState<"up" | "down" | null>(null);

  const currentAmount = customAmount ? parseInt(customAmount) || 0 : selectedAmount;
  const potentialWin = currentAmount * (1 + returnRate / 100);

  const handleBetClick = (direction: "up" | "down") => {
    if (currentAmount <= 0 || currentAmount > balance || disabled) return;
    
    if (oneClickEnabled) {
      // One-click enabled - bet immediately
      onPlaceBet(currentAmount, direction);
      setCustomAmount("");
    } else {
      // One-click disabled - show confirmation
      setPendingDirection(direction);
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmBet = () => {
    if (pendingDirection && currentAmount > 0 && currentAmount <= balance && !disabled) {
      onPlaceBet(currentAmount, pendingDirection);
      setCustomAmount("");
    }
    setShowConfirmDialog(false);
    setPendingDirection(null);
  };

  const handleCancelBet = () => {
    setShowConfirmDialog(false);
    setPendingDirection(null);
  };

  const adjustAmount = (delta: number) => {
    const newAmount = Math.max(MIN_BET, Math.min(Math.min(balance, MAX_BET), currentAmount + delta));
    setCustomAmount(newAmount.toString());
  };

  // Validate current amount is within limits
  const isValidAmount = currentAmount >= MIN_BET && currentAmount <= MAX_BET && currentAmount <= balance;

  return (
    <div className="space-y-2">
      {/* One-Click Trading Toggle + Amount Selection - Compact Row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onOneClickToggle?.(!oneClickEnabled)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-medium transition-all flex-shrink-0 ${
            oneClickEnabled 
              ? "bg-primary text-primary-foreground" 
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          }`}
        >
          <Zap size={12} className={oneClickEnabled ? "fill-current" : ""} />
          <span className="hidden sm:inline">One-Click</span>
          <span className="sm:hidden">1-Click</span>
        </button>
        
        {/* Quick Amount Buttons */}
        <div className="flex gap-1 flex-1 overflow-x-auto scrollbar-hide">
          {betAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount("");
              }}
              disabled={amount > balance}
              className={`px-2 py-1 rounded-md font-mono text-[10px] sm:text-xs font-medium transition-all flex-shrink-0 ${
                currentAmount === amount && !customAmount
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-50"
              }`}
            >
              ₹{amount}
            </button>
          ))}
        </div>

        {/* Balance Display */}
        <span className="text-[9px] sm:text-[10px] text-muted-foreground flex-shrink-0">
          <span className="text-primary font-mono">₹{(balance ?? 0).toLocaleString()}</span>
        </span>
      </div>

      {/* Amount Input + Potential Win + Buy/Sell - Compact */}
      <div className="flex items-center gap-2">
        {/* Amount Stepper */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => adjustAmount(-10)}
            disabled={currentAmount <= MIN_BET}
            className="p-1 sm:p-1.5 bg-secondary rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-all touch-manipulation"
          >
            <Minus size={12} className="text-foreground" />
          </button>
          <input
            type="number"
            value={customAmount || currentAmount}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || (parseInt(val) >= 0 && parseInt(val) <= MAX_BET)) {
                setCustomAmount(val);
              }
            }}
            min={MIN_BET}
            max={Math.min(balance, MAX_BET)}
            className="w-14 sm:w-18 px-1 py-1 bg-secondary rounded-lg text-center font-mono text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
          />
          <button
            onClick={() => adjustAmount(10)}
            disabled={currentAmount >= Math.min(balance, MAX_BET)}
            className="p-1 sm:p-1.5 bg-secondary rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-all touch-manipulation"
          >
            <Plus size={12} className="text-foreground" />
          </button>
        </div>

        {/* Potential Win */}
        <div className="flex items-center gap-1 flex-shrink-0 px-2 py-1 bg-secondary/50 rounded-lg">
          <span className="font-mono text-profit font-bold text-xs sm:text-sm">
            ₹{potentialWin.toFixed(0)}
          </span>
          <span className="text-[8px] sm:text-[10px] text-muted-foreground">({returnRate}%)</span>
        </div>

        {/* UP/DOWN Buttons */}
        <div className="flex gap-1.5 flex-1">
          {oneClickEnabled ? (
            <>
              <button
                onClick={onOneClickUp}
                disabled={disabled || oneClickAmount > balance}
                className="flex-1 btn-profit py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 touch-manipulation"
              >
                <ArrowUp size={16} strokeWidth={3} />
                <span className="font-bold">UP</span>
              </button>
              <button
                onClick={onOneClickDown}
                disabled={disabled || oneClickAmount > balance}
                className="flex-1 btn-loss py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 touch-manipulation"
              >
                <ArrowDown size={16} strokeWidth={3} />
                <span className="font-bold">DOWN</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleBetClick("up")}
                disabled={disabled || !isValidAmount}
                className="flex-1 btn-profit py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 touch-manipulation"
              >
                <ArrowUp size={16} strokeWidth={3} />
                <span className="font-bold">UP</span>
              </button>
              <button
                onClick={() => handleBetClick("down")}
                disabled={disabled || !isValidAmount}
                className="flex-1 btn-loss py-2 sm:py-2.5 rounded-lg flex items-center justify-center gap-1 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 touch-manipulation"
              >
                <ArrowDown size={16} strokeWidth={3} />
                <span className="font-bold">DOWN</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pendingDirection === "up" ? (
                <ArrowUp className="text-profit" size={20} />
              ) : (
                <ArrowDown className="text-loss" size={20} />
              )}
              Confirm {pendingDirection === "up" ? "Long" : "Short"} Position
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div className="flex justify-between py-1">
                <span>Amount:</span>
                <span className="font-mono font-bold">₹{currentAmount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Direction:</span>
                <span className={pendingDirection === "up" ? "text-profit font-bold" : "text-loss font-bold"}>
                  {pendingDirection === "up" ? "UP (Long)" : "DOWN (Short)"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Potential Win:</span>
                <span className="text-profit font-mono font-bold">₹{potentialWin.toFixed(0)}</span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel onClick={handleCancelBet} className="flex-1">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmBet}
              className={`flex-1 ${pendingDirection === "up" ? "btn-profit" : "btn-loss"}`}
            >
              Confirm {pendingDirection === "up" ? "Long" : "Short"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BetControls;