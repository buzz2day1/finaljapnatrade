import { Wallet, ArrowUpRight, ArrowDownRight, History } from "lucide-react";

interface WalletCardProps {
  balance: number;
  totalDeposit: number;
  totalBet: number;
  onDeposit: () => void;
  onWithdraw: () => void;
  onHistory: () => void;
}

const WalletCard = ({
  balance,
  totalDeposit,
  totalBet,
  onDeposit,
  onWithdraw,
  onHistory,
}: WalletCardProps) => {
  // Minimum withdrawal is now ₹400
  const MIN_WITHDRAWAL = 400;
  const canWithdraw = balance >= MIN_WITHDRAWAL;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl">
            <Wallet size={24} className="text-primary" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total Balance</div>
            <div className="text-2xl font-bold font-mono text-foreground">
              ₹{balance.toLocaleString()}
            </div>
          </div>
        </div>
        <button
          onClick={onHistory}
          className="p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-all"
        >
          <History size={20} className="text-muted-foreground" />
        </button>
      </div>

      {/* Min withdrawal info */}
      {!canWithdraw && (
        <div className="text-xs text-muted-foreground text-center">
          Minimum ₹{MIN_WITHDRAWAL} balance required for withdrawal. Use Litecoin (LTC) for near-zero fees!
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onDeposit}
          className="flex items-center justify-center gap-2 py-3 bg-profit/10 hover:bg-profit/20 text-profit rounded-xl font-medium transition-all"
        >
          <ArrowDownRight size={18} />
          Deposit
        </button>
        <button
          onClick={onWithdraw}
          disabled={!canWithdraw}
          className={`flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
            canWithdraw
              ? "bg-primary/10 hover:bg-primary/20 text-primary"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          }`}
        >
          <ArrowUpRight size={18} />
          Withdraw
        </button>
      </div>
    </div>
  );
};

export default WalletCard;
