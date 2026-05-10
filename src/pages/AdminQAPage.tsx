import { useState } from "react";
import { 
  CheckCircle2, XCircle, Clock, ArrowLeft, 
  Wallet, TrendingUp, Bell, Gift, History, 
  CreditCard, RefreshCw, Play
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QACheckItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: "pending" | "pass" | "fail";
  notes: string;
}

const initialChecklist: QACheckItem[] = [
  // Deposit Tests
  { id: "dep-1", category: "Deposit", title: "Deposit UI Opens", description: "Click deposit button, modal should open with coin selection", status: "pending", notes: "" },
  { id: "dep-2", category: "Deposit", title: "Coin Selection Works", description: "All 30+ coins should be visible and selectable", status: "pending", notes: "" },
  { id: "dep-3", category: "Deposit", title: "Min/Max Validation", description: "Min ₹100, Max ₹5000 - amounts outside range should show error", status: "pending", notes: "" },
  { id: "dep-4", category: "Deposit", title: "Balance Updates", description: "After admin approves deposit, user balance should increase", status: "pending", notes: "" },
  { id: "dep-5", category: "Deposit", title: "Transaction History", description: "Deposit should appear in transaction history with correct status", status: "pending", notes: "" },
  
  // Bet/Trading Tests
  { id: "bet-1", category: "Betting", title: "Balance Deducts on Bet", description: "When placing bet, balance should immediately decrease by bet amount", status: "pending", notes: "" },
  { id: "bet-2", category: "Betting", title: "Bet Amount Limits", description: "Min ₹10, Max ₹5000 - validation should work", status: "pending", notes: "" },
  { id: "bet-3", category: "Betting", title: "Active Bet Display", description: "Active bet popup should show with timer, direction, and market totals", status: "pending", notes: "" },
  { id: "bet-4", category: "Betting", title: "One-Click Trading", description: "Toggle one-click mode - bets should place instantly without confirmation", status: "pending", notes: "" },
  { id: "bet-5", category: "Betting", title: "Coin/Timeframe Persists", description: "After trade, selected coin and timeframe should NOT reset", status: "pending", notes: "" },
  
  // Win/Loss Tests
  { id: "win-1", category: "Win/Loss", title: "Win Credits Balance", description: "On win, balance should increase by (bet × return rate)", status: "pending", notes: "" },
  { id: "win-2", category: "Win/Loss", title: "Win Shows Correct Toast", description: "Win should show SUCCESS toast (green) with win amount", status: "pending", notes: "" },
  { id: "win-3", category: "Win/Loss", title: "Win Modal Displays", description: "Win result modal should appear with trophy icon and correct P&L", status: "pending", notes: "" },
  { id: "win-4", category: "Win/Loss", title: "Loss Shows Correct Toast", description: "Loss should show ERROR toast (red) with loss amount", status: "pending", notes: "" },
  { id: "win-5", category: "Win/Loss", title: "Loss Modal Displays", description: "Loss result modal should appear with down icon and correct P&L", status: "pending", notes: "" },
  { id: "win-6", category: "Win/Loss", title: "Confetti on Win", description: "Confetti animation should trigger only on wins", status: "pending", notes: "" },
  { id: "win-7", category: "Win/Loss", title: "70% Loss Rate", description: "Over 10+ trades, approximately 70% should be losses", status: "pending", notes: "" },
  
  // Notification Tests
  { id: "notif-1", category: "Notifications", title: "Trade Win Notification", description: "Win notification should appear with correct message and amount", status: "pending", notes: "" },
  { id: "notif-2", category: "Notifications", title: "Trade Loss Notification", description: "Loss notification should appear with correct message and amount", status: "pending", notes: "" },
  { id: "notif-3", category: "Notifications", title: "Deposit Notification", description: "Deposit received notification should trigger after deposit", status: "pending", notes: "" },
  { id: "notif-4", category: "Notifications", title: "Mark as Read", description: "Clicking notification should mark it as read", status: "pending", notes: "" },
  { id: "notif-5", category: "Notifications", title: "Unread Badge Count", description: "Header should show correct unread notification count", status: "pending", notes: "" },
  
  // Referral Tests
  { id: "ref-1", category: "Referral", title: "Referral Code Generated", description: "Each user should have unique APNAXXXXXX referral code", status: "pending", notes: "" },
  { id: "ref-2", category: "Referral", title: "Code Copy Works", description: "Copy button should copy referral code to clipboard", status: "pending", notes: "" },
  { id: "ref-3", category: "Referral", title: "Share Link Works", description: "Share button should open share sheet with referral link", status: "pending", notes: "" },
  { id: "ref-4", category: "Referral", title: "₹20 Signup Bonus", description: "Referrer gets ₹20 when referred user makes first deposit", status: "pending", notes: "" },
  { id: "ref-5", category: "Referral", title: "10% Deposit Commission", description: "Referrer gets 10% of referred user's first deposit", status: "pending", notes: "" },
  { id: "ref-6", category: "Referral", title: "Referral Notification", description: "Referrer should get notification when referral bonus is credited", status: "pending", notes: "" },
  
  // Trade History Tests
  { id: "hist-1", category: "History", title: "Trades Appear in History", description: "All completed trades should appear in trade history", status: "pending", notes: "" },
  { id: "hist-2", category: "History", title: "Win/Loss Correctly Tagged", description: "Each trade should show correct WIN/LOSS badge", status: "pending", notes: "" },
  { id: "hist-3", category: "History", title: "P&L Matches Settlement", description: "P&L in history should match actual balance change", status: "pending", notes: "" },
  { id: "hist-4", category: "History", title: "Stats Calculate Correctly", description: "Win rate, total P&L, best win should be accurate", status: "pending", notes: "" },
  
  // Withdrawal Tests
  { id: "with-1", category: "Withdrawal", title: "Withdrawal UI Opens", description: "Withdrawal modal should open with coin selection", status: "pending", notes: "" },
  { id: "with-2", category: "Withdrawal", title: "Min/Max Validation", description: "Min ₹110, Max ₹5000 - validation should work", status: "pending", notes: "" },
  { id: "with-3", category: "Withdrawal", title: "Bet Requirement Check", description: "Cannot withdraw until total bet >= total deposit", status: "pending", notes: "" },
  { id: "with-4", category: "Withdrawal", title: "Pending Status Shows", description: "Withdrawal should show as pending until admin approves", status: "pending", notes: "" },
];

const AdminQAPage = () => {
  const [checklist, setChecklist] = useState<QACheckItem[]>(initialChecklist);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const navigate = useNavigate();

  const categories = ["all", ...Array.from(new Set(checklist.map(c => c.category)))];

  const filteredChecklist = activeCategory === "all" 
    ? checklist 
    : checklist.filter(c => c.category === activeCategory);

  const updateStatus = (id: string, status: "pass" | "fail") => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, status } : item
    ));
  };

  const updateNotes = (id: string, notes: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, notes } : item
    ));
  };

  const resetAll = () => {
    setChecklist(initialChecklist);
  };

  const stats = {
    total: checklist.length,
    passed: checklist.filter(c => c.status === "pass").length,
    failed: checklist.filter(c => c.status === "fail").length,
    pending: checklist.filter(c => c.status === "pending").length,
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Deposit": return CreditCard;
      case "Betting": return TrendingUp;
      case "Win/Loss": return TrendingUp;
      case "Notifications": return Bell;
      case "Referral": return Gift;
      case "History": return History;
      case "Withdrawal": return Wallet;
      default: return CheckCircle2;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass": return <CheckCircle2 size={20} className="text-profit" />;
      case "fail": return <XCircle size={20} className="text-loss" />;
      default: return <Clock size={20} className="text-primary animate-pulse" />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <div>
              <h1 className="font-bold text-foreground">Pre-Launch QA</h1>
              <p className="text-xs text-muted-foreground">Test all features before launch</p>
            </div>
          </div>
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-lg text-sm hover:bg-secondary/80"
          >
            <RefreshCw size={14} />
            Reset
          </button>
        </div>
      </div>

      <main className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-profit">{stats.passed}</div>
            <div className="text-xs text-muted-foreground">Passed</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-loss">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-primary">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">
              {Math.round(((stats.passed + stats.failed) / stats.total) * 100)}%
            </span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-profit transition-all duration-300" 
              style={{ width: `${(stats.passed / stats.total) * 100}%` }}
            />
            <div 
              className="h-full bg-loss transition-all duration-300" 
              style={{ width: `${(stats.failed / stats.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {cat === "all" ? "All" : cat}
            </button>
          ))}
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          {filteredChecklist.map(item => {
            const Icon = getCategoryIcon(item.category);
            return (
              <div 
                key={item.id} 
                className={`glass-card rounded-xl p-4 border-l-4 ${
                  item.status === "pass" ? "border-l-profit" :
                  item.status === "fail" ? "border-l-loss" : "border-l-primary"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-secondary rounded-lg flex-shrink-0">
                    <Icon size={18} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-secondary rounded text-muted-foreground">
                        {item.category}
                      </span>
                      {getStatusIcon(item.status)}
                    </div>
                    <h3 className="font-medium text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(item.id, "pass")}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          item.status === "pass" 
                            ? "bg-profit text-white" 
                            : "bg-profit/20 text-profit hover:bg-profit/30"
                        }`}
                      >
                        ✓ Pass
                      </button>
                      <button
                        onClick={() => updateStatus(item.id, "fail")}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          item.status === "fail" 
                            ? "bg-loss text-white" 
                            : "bg-loss/20 text-loss hover:bg-loss/30"
                        }`}
                      >
                        ✗ Fail
                      </button>
                    </div>

                    {/* Notes */}
                    {item.status === "fail" && (
                      <textarea
                        value={item.notes}
                        onChange={(e) => updateNotes(item.id, e.target.value)}
                        placeholder="Add notes about the issue..."
                        className="mt-2 w-full px-3 py-2 bg-secondary rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-loss resize-none"
                        rows={2}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Launch Readiness */}
        <div className={`glass-card rounded-2xl p-6 text-center ${
          stats.failed === 0 && stats.pending === 0 
            ? "border-2 border-profit" 
            : stats.failed > 0 
              ? "border-2 border-loss" 
              : ""
        }`}>
          {stats.failed === 0 && stats.pending === 0 ? (
            <>
              <CheckCircle2 size={48} className="text-profit mx-auto mb-3" />
              <h2 className="text-xl font-bold text-profit mb-2">Ready to Launch! 🚀</h2>
              <p className="text-muted-foreground">All tests passed. Platform is ready for production.</p>
            </>
          ) : stats.failed > 0 ? (
            <>
              <XCircle size={48} className="text-loss mx-auto mb-3" />
              <h2 className="text-xl font-bold text-loss mb-2">Issues Found</h2>
              <p className="text-muted-foreground">{stats.failed} test(s) failed. Fix issues before launch.</p>
            </>
          ) : (
            <>
              <Play size={48} className="text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold text-foreground mb-2">Testing in Progress</h2>
              <p className="text-muted-foreground">{stats.pending} test(s) remaining. Complete all tests.</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminQAPage;
