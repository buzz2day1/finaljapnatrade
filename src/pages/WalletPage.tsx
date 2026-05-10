import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowDownRight, ArrowUpRight, Clock, CheckCircle2, XCircle, Copy, ChevronLeft, AlertTriangle, Info, Wallet, Shield, Loader2, Gift, Image, Upload } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { DEPOSIT_LIMITS, WITHDRAWAL_LIMITS } from "@/data/cryptoCoins";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Transaction {
  id: string;
  type: "deposit" | "withdraw";
  amount: number;
  status: "pending" | "completed" | "failed";
  date: string;
  upi_id?: string;
  utr_number?: string;
}

interface AdminUpiData {
  upi_id: string;
  qr_url: string | null;
}

interface WalletPageProps {
  balance: number;
  totalDeposit: number;
  totalBet: number;
  userName: string;
  onDeposit: (amount: number) => void;
  onNavigate: (tab: "trade" | "wallet" | "referral" | "profile") => void;
}

const WalletPage = ({ balance, totalDeposit, totalBet, userName, onDeposit, onNavigate }: WalletPageProps) => {
  const [activeView, setActiveView] = useState<"main" | "deposit" | "withdraw" | "history">("main");
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [adminData, setAdminData] = useState<AdminUpiData>({ upi_id: "admin@apnatrade", qr_url: null });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [depositStep, setDepositStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositConfirmed, setDepositConfirmed] = useState(false);
  const [withdrawalsLast24h, setWithdrawalsLast24h] = useState(0);
  const { user } = useAuth();

  // Limits
  const MIN_DEPOSIT = DEPOSIT_LIMITS.min; // ₹100
  const MAX_DEPOSIT = DEPOSIT_LIMITS.max; // ₹5,000
  const MIN_WITHDRAWAL = WITHDRAWAL_LIMITS.min; // ₹110
  const MAX_WITHDRAWAL_PER_DAY = WITHDRAWAL_LIMITS.maxPerDay; // ₹5,000
  const remainingWithdrawal = Math.max(0, MAX_WITHDRAWAL_PER_DAY - withdrawalsLast24h);
  const canWithdraw = balance >= MIN_WITHDRAWAL && remainingWithdrawal > 0;

  // Fetch admin UPI data (UPI ID + QR)
  const fetchAdminData = useCallback(async () => {
    if (!user) return;
    try {
      // Get UPI ID
      const { data: upiData } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "admin_upi_id")
        .maybeSingle();
      
      // Get active QR code
      const { data: qrData } = await (supabase as any)
        .from("admin_qr_codes")
        .select("qr_url, upi_id")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      setAdminData({
        upi_id: upiData?.value || "admin@apnatrade",
        qr_url: qrData?.qr_url || null
      });
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    }
  }, [user]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) {
      setTransactions(data.map(t => ({
        id: t.id,
        type: t.type as "deposit" | "withdraw",
        amount: t.amount,
        status: t.status as "pending" | "completed" | "failed",
        date: new Date(t.created_at).toLocaleString(),
        upi_id: t.wallet_address || undefined,
        utr_number: (t as any).utr_number || undefined
      })));
    }
  }, [user]);

  // Fetch 24h withdrawals
  const fetch24hWithdrawals = useCallback(async () => {
    if (!user) return;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user.id)
      .eq("type", "withdraw")
      .in("status", ["pending", "completed"])
      .gte("created_at", twentyFourHoursAgo);
    if (!error && data) {
      const total = data.reduce((sum, tx) => sum + tx.amount, 0);
      setWithdrawalsLast24h(total);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetch24hWithdrawals();
      fetchAdminData();
    }
  }, [user, fetchTransactions, fetch24hWithdrawals, fetchAdminData]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`wallet-transactions:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedTx = payload.new as { id: string; status: string; type: string; amount: number };
          if (updatedTx.status === "completed" && updatedTx.type === "deposit") {
            setDepositConfirmed(true);
            setDepositStep(3);
            toast.success(`🎉 Deposit of ₹${updatedTx.amount} confirmed!`);
            setTimeout(() => {
              setActiveView("main");
              setDepositStep(1);
              setAmount("");
              setUtrNumber("");
              setScreenshotFile(null);
              setScreenshotPreview("");
              setDepositConfirmed(false);
              onNavigate("trade");
            }, 4000);
          }
          fetchTransactions();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchTransactions()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchTransactions, onNavigate]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleScreenshotSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Screenshot must be less than 5MB");
      return;
    }
    
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setScreenshotPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDepositRequest = async () => {
    const depositAmount = parseFloat(amount);
    if (depositAmount < MIN_DEPOSIT) {
      toast.error(`Minimum deposit is ₹${MIN_DEPOSIT}`);
      return;
    }
    if (depositAmount > MAX_DEPOSIT) {
      toast.error(`Maximum deposit is ₹${MAX_DEPOSIT.toLocaleString()} per transaction.`);
      return;
    }
    if (!utrNumber || utrNumber.length < 6) {
      toast.error("Please enter a valid UTR number");
      return;
    }
    if (!screenshotFile) {
      toast.error("Please upload a payment screenshot");
      return;
    }
    if (!user) {
      toast.error("Please login first");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload screenshot to storage
      const fileExt = screenshotFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("screenshots")
        .upload(fileName, screenshotFile);

      if (uploadError) {
        throw new Error("Failed to upload screenshot");
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("screenshots")
        .getPublicUrl(fileName);

      // Create transaction with UTR and screenshot
      const { data: txData, error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "deposit",
          amount: depositAmount,
          status: "pending",
          coin: "UPI",
          wallet_address: adminData.upi_id,
          utr_number: utrNumber,
          screenshot_url: publicUrl,
        } as any)
        .select()
        .single();

      if (txError || !txData) {
        throw new Error("Failed to create transaction");
      }

      setDepositStep(2);
      toast.success("Deposit request submitted! Admin will verify your payment.");
    } catch (error) {
      console.error("Error creating deposit:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create deposit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawRequest = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (withdrawAmount < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ₹${MIN_WITHDRAWAL.toLocaleString()}`);
      return;
    }
    if (withdrawAmount > remainingWithdrawal) {
      toast.error(`24-hour withdrawal limit: ₹${remainingWithdrawal.toLocaleString()} remaining (Max: ₹${MAX_WITHDRAWAL_PER_DAY.toLocaleString()}/day)`);
      return;
    }
    if (withdrawAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!upiId || upiId.length < 5) {
      toast.error("Please enter your UPI ID");
      return;
    }
    if (!upiId.includes("@")) {
      toast.error("Invalid UPI ID format. Must include @ (e.g., name@bank)");
      return;
    }
    if (!user) {
      toast.error("Please login first");
      return;
    }

    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "withdraw",
        amount: withdrawAmount,
        status: "pending",
        coin: "UPI",
        wallet_address: upiId,
      } as any);

      if (error) throw error;

      toast.success("Withdrawal request submitted! Admin will process it shortly.");
      setActiveView("main");
      setAmount("");
      setUpiId("");
      fetchTransactions();
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      toast.error("Failed to submit withdrawal request");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 size={16} className="text-profit" />;
      case "pending": return <Clock size={16} className="text-primary animate-pulse" />;
      case "failed": return <XCircle size={16} className="text-loss" />;
    }
  };

  const renderMainView = () => (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="glass-card rounded-2xl p-6 text-center">
        <div className="text-sm text-muted-foreground mb-2">Total Balance</div>
        <div className="text-4xl font-bold font-mono text-gradient-gold mb-4">
          ₹{balance.toLocaleString()}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setActiveView("deposit"); setDepositStep(1); setUtrNumber(""); setScreenshotFile(null); setScreenshotPreview(""); }}
            className="flex items-center justify-center gap-2 py-4 bg-profit/10 hover:bg-profit/20 text-profit rounded-xl font-semibold transition-all"
          >
            <ArrowDownRight size={20} />
            Deposit
          </button>
          <button
            onClick={() => setActiveView("withdraw")}
            disabled={!canWithdraw}
            className={`flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${
              canWithdraw
                ? "bg-primary/10 hover:bg-primary/20 text-primary"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            }`}
          >
            <ArrowUpRight size={20} />
            Withdraw
          </button>
        </div>
        {!canWithdraw && (
          <p className="text-xs text-muted-foreground mt-3">
            {balance < MIN_WITHDRAWAL 
              ? `Minimum balance ₹${MIN_WITHDRAWAL.toLocaleString()} required for withdrawal`
              : `24h withdrawal limit reached. Remaining: ₹${remainingWithdrawal.toLocaleString()}`
            }
          </p>
        )}

        {/* Limits Info */}
        <div className="mt-4 p-3 bg-secondary/50 rounded-xl text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-primary" />
            <span className="font-medium text-foreground">UPI Transaction Limits</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-profit">Deposit:</span> ₹{MIN_DEPOSIT}-{MAX_DEPOSIT.toLocaleString()}/tx
            </div>
            <div>
              <span className="text-primary">Withdraw:</span> ₹{MIN_WITHDRAWAL}-{MAX_WITHDRAWAL_PER_DAY.toLocaleString()}/day
            </div>
          </div>
          <p className="mt-2 text-primary">⚡ UPI deposits & withdrawals</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Deposited</div>
          <div className="font-mono font-bold text-lg text-foreground">₹{totalDeposit.toLocaleString()}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Traded</div>
          <div className="font-mono font-bold text-lg text-foreground">₹{totalBet.toLocaleString()}</div>
        </div>
      </div>

      {/* Admin UPI + QR Display */}
      <div className="glass-card rounded-xl p-4 bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <Wallet size={16} className="text-primary" />
          <span className="text-sm text-muted-foreground">Pay to this UPI ID</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="font-mono text-sm text-foreground">
            {adminData.upi_id}
          </div>
          <button
            onClick={() => copyToClipboard(adminData.upi_id, "UPI ID")}
            className="p-2 bg-primary/20 rounded-lg hover:bg-primary/30 transition-all shrink-0"
          >
            <Copy size={16} className="text-primary" />
          </button>
        </div>
        {adminData.qr_url && (
          <div className="mt-3 flex justify-center">
            <img 
              src={adminData.qr_url} 
              alt="UPI QR Code" 
              className="w-48 h-48 rounded-xl border border-primary/30 bg-white p-2"
            />
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2 text-center">
          💳 Scan QR or copy UPI ID to pay, then submit UTR + screenshot
        </p>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Transactions</h3>
          <button
            onClick={() => setActiveView("history")}
            className="text-sm text-primary hover:underline"
          >
            View All
          </button>
        </div>
        <div className="divide-y divide-border">
          {transactions.slice(0, 3).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tx.type === "deposit" ? "bg-profit/20" : "bg-primary/20"}`}>
                  {tx.type === "deposit" ? (
                    <ArrowDownRight size={18} className="text-profit" />
                  ) : (
                    <ArrowUpRight size={18} className="text-primary" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-foreground capitalize">{tx.type}</div>
                  <div className="text-xs text-muted-foreground">{tx.date}</div>
                  {tx.utr_number && <div className="text-xs text-muted-foreground">UTR: {tx.utr_number}</div>}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-mono font-bold ${tx.type === "deposit" ? "text-profit" : "text-foreground"}`}>
                  {tx.type === "deposit" ? "+" : "-"}₹{tx.amount}
                </div>
                <div className="flex items-center gap-1 justify-end">
                  {getStatusIcon(tx.status)}
                  <span className="text-xs text-muted-foreground capitalize">{tx.status}</span>
                </div>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No transactions yet</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDepositView = () => (
    <div className="space-y-6">
      <button
        onClick={() => {
          if (depositStep > 1) {
            setDepositStep((prev) => (prev - 1) as 1 | 2 | 3);
          } else {
            setActiveView("main");
            setDepositStep(1);
          }
        }}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft size={20} />
        Back
      </button>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              depositStep >= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}>
              {depositStep > step ? "✓" : step}
            </div>
            {step < 3 && <div className={`w-8 h-1 ${depositStep > step ? "bg-primary" : "bg-secondary"}`} />}
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-6">
        {depositStep === 1 && (
          <>
            <h2 className="text-xl font-bold text-foreground">Deposit via UPI</h2>

            {/* UPI + QR Display */}
            <div className="p-4 bg-primary/10 rounded-xl border border-primary/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Send to this UPI ID:</div>
                  <div className="font-mono text-lg font-bold text-primary">{adminData.upi_id}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(adminData.upi_id, "UPI ID")}
                  className="p-3 bg-primary/20 rounded-lg hover:bg-primary/30"
                >
                  <Copy size={20} className="text-primary" />
                </button>
              </div>
              {adminData.qr_url && (
                <div className="mt-3 flex justify-center">
                  <img 
                    src={adminData.qr_url} 
                    alt="UPI QR Code" 
                    className="w-44 h-44 rounded-lg border border-primary/30 bg-white p-2"
                  />
                </div>
              )}
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min ₹${MIN_DEPOSIT} - Max ₹${MAX_DEPOSIT.toLocaleString()}`}
                min={MIN_DEPOSIT}
                max={MAX_DEPOSIT}
                className="w-full px-4 py-4 bg-secondary rounded-xl font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <div className="p-2 bg-primary/10 rounded-lg flex items-center gap-2 text-xs text-muted-foreground">
                <Shield size={12} className="text-primary" />
                <span>Min ₹{MIN_DEPOSIT} • Max ₹{MAX_DEPOSIT.toLocaleString()} per transaction</span>
              </div>
              <div className="flex gap-2 mt-2">
                {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                      amount === amt.toString() ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    ₹{amt >= 1000 ? `${amt / 1000}K` : amt}
                  </button>
                ))}
              </div>
            </div>

            {/* UTR Number */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">UTR Number (from your payment)</label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="Enter UTR number from your UPI app"
                className="w-full px-4 py-4 bg-secondary rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                🔍 Find UTR in your UPI app's transaction history after making payment
              </p>
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Payment Screenshot</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-all"
              >
                {screenshotPreview ? (
                  <div className="space-y-2">
                    <img src={screenshotPreview} alt="Payment Screenshot" className="max-h-48 mx-auto rounded-lg" />
                    <p className="text-xs text-muted-foreground">Click to change screenshot</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={32} className="mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload payment screenshot</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotSelect}
                className="hidden"
              />
            </div>

            <div className="p-3 bg-loss/10 rounded-xl border border-loss/30 flex items-start gap-3">
              <AlertTriangle className="text-loss shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-loss">Steps:</span> First send payment to the UPI ID above via your UPI app → Enter the UTR number → Upload screenshot → Submit. Admin will verify and credit your account.
              </div>
            </div>

            <button
              onClick={handleDepositRequest}
              disabled={!amount || parseFloat(amount) < MIN_DEPOSIT || !utrNumber || !screenshotFile || isSubmitting}
              className="w-full py-4 bg-gradient-gold text-primary-foreground font-bold rounded-xl glow-gold disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 size={20} className="animate-spin" /> Submitting...</>
              ) : (
                <>Submit Deposit Request →</>
              )}
            </button>
          </>
        )}

        {depositStep === 2 && (
          <>
            <h2 className="text-xl font-bold text-foreground">Request Submitted!</h2>

            <div className="p-6 bg-profit/10 rounded-xl border border-profit/30 text-center space-y-3">
              <CheckCircle2 size={48} className="text-profit mx-auto" />
              <div className="text-lg font-bold text-foreground">Deposit Request Created!</div>
              <div className="text-sm text-muted-foreground">
                Amount: <span className="text-profit font-bold font-mono">₹{parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                UTR: <span className="text-primary font-bold">{utrNumber}</span>
              </div>
              {screenshotPreview && (
                <img src={screenshotPreview} alt="Payment Screenshot" className="max-h-32 mx-auto rounded-lg border border-profit/30" />
              )}
            </div>

            <div className="p-4 bg-primary/10 rounded-xl border border-primary/30 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Info size={18} />
                What happens next?
              </div>
              <ol className="space-y-2 text-sm text-foreground">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">1.</span>
                  Admin will verify your payment (UTR + screenshot)
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">2.</span>
                  Once approved, your balance will be credited automatically
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">3.</span>
                  You'll receive a notification when it's done
                </li>
              </ol>
            </div>

            <div className="text-center py-6">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 size={32} className="text-primary animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Waiting for Admin Confirmation...</h3>
              <p className="text-sm text-muted-foreground">
                Your deposit of <span className="text-profit font-bold">₹{parseFloat(amount).toLocaleString()}</span> will be credited once admin verifies the payment.
              </p>
            </div>
          </>
        )}

        {depositStep === 3 && depositConfirmed && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-profit/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-profit" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Deposit Successful! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              Your deposit of <span className="text-profit font-bold">₹{parseFloat(amount).toLocaleString()}</span> has been credited to your account.
            </p>
            <div className="p-4 bg-profit/10 rounded-xl text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="text-profit font-medium flex items-center gap-1"><CheckCircle2 size={14} /> Confirmed</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-foreground font-bold">₹{parseFloat(amount).toLocaleString()}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveView("main");
                setDepositStep(1);
                setAmount("");
                setUtrNumber("");
                setScreenshotFile(null);
                setScreenshotPreview("");
                setDepositConfirmed(false);
                onNavigate("trade");
              }}
              className="w-full py-4 bg-profit text-primary-foreground font-bold rounded-xl"
            >
              Start Trading Now →
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderWithdrawView = () => (
    <div className="space-y-6">
      <button
        onClick={() => setActiveView("main")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft size={20} />
        Back
      </button>

      <div className="glass-card rounded-2xl p-6 space-y-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Wallet size={24} className="text-primary" />
          Withdraw Funds
        </h2>

        {/* Balance Info */}
        <div className="p-4 bg-primary/10 rounded-xl border border-primary/30 text-center">
          <div className="text-sm text-muted-foreground">Available Balance</div>
          <div className="text-3xl font-bold font-mono text-primary">₹{balance.toLocaleString()}</div>
        </div>

        {/* 24h Withdrawal Limit */}
        <div className="p-4 bg-secondary/50 rounded-xl border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">24h Withdrawal Limit</span>
            </div>
            <span className="text-xs text-muted-foreground">
              ₹{withdrawalsLast24h.toLocaleString()} / ₹{MAX_WITHDRAWAL_PER_DAY.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${withdrawalsLast24h >= MAX_WITHDRAWAL_PER_DAY ? 'bg-loss' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, (withdrawalsLast24h / MAX_WITHDRAWAL_PER_DAY) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-muted-foreground">Remaining: <span className="text-profit font-medium">₹{remainingWithdrawal.toLocaleString()}</span></span>
            <span className="text-muted-foreground">Resets in ~24h</span>
          </div>
        </div>

        {/* UPI Withdraw Info */}
        <div className="p-4 bg-secondary/50 rounded-xl border border-border flex items-center gap-3">
          <Wallet size={24} className="text-primary" />
          <div className="flex-1">
            <div className="font-semibold text-foreground">UPI Withdrawal</div>
            <div className="text-xs text-muted-foreground">Withdraw directly to your UPI ID</div>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min ₹${MIN_WITHDRAWAL.toLocaleString()} - Max ₹${Math.min(remainingWithdrawal, balance).toLocaleString()}`}
            min={MIN_WITHDRAWAL}
            max={Math.min(remainingWithdrawal, balance)}
            className="w-full px-4 py-4 bg-secondary rounded-xl font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
          <div className="p-2 bg-primary/10 rounded-lg flex items-center gap-2 text-xs text-muted-foreground">
            <Shield size={12} className="text-primary" />
            <span>Min ₹{MIN_WITHDRAWAL.toLocaleString()} • Max ₹{MAX_WITHDRAWAL_PER_DAY.toLocaleString()}/day • Remaining today: ₹{remainingWithdrawal.toLocaleString()}</span>
          </div>
          <div className="flex gap-2 mt-2">
            {[110, 500, 1000, 2000, 5000].filter(amt => amt >= MIN_WITHDRAWAL && amt <= Math.min(remainingWithdrawal, balance)).map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                disabled={amt > balance || amt > remainingWithdrawal}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  amount === amt.toString() ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-50"
                }`}
              >
                ₹{amt >= 1000 ? `${(amt / 1000).toFixed(amt % 1000 === 0 ? 0 : 1)}K` : amt}
              </button>
            ))}
          </div>
        </div>

        {/* UPI ID */}
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Your UPI ID</label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="example@bank"
            className="w-full px-4 py-4 bg-secondary rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-xs text-muted-foreground">
              💳 Enter the UPI ID where you want to receive the withdrawal amount (e.g., name@paytm, name@okaxis)
            </p>
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 bg-loss/10 rounded-xl border border-loss/30 flex items-start gap-3">
          <AlertTriangle className="text-loss shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-loss">Important:</span> Double-check your UPI ID. Wrong ID = lost funds. Withdrawals are processed within 24 hours.
          </div>
        </div>

        <button
          onClick={handleWithdrawRequest}
          disabled={!amount || parseFloat(amount) < MIN_WITHDRAWAL || !upiId}
          className="w-full py-4 bg-gradient-gold text-primary-foreground font-bold rounded-xl glow-gold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Submit Withdrawal Request
        </button>
      </div>
    </div>
  );

  const renderHistoryView = () => (
    <div className="space-y-6">
      <button
        onClick={() => setActiveView("main")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft size={20} />
        Back
      </button>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Transaction History</h3>
        </div>
        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tx.type === "deposit" ? "bg-profit/20" : "bg-primary/20"}`}>
                  {tx.type === "deposit" ? (
                    <ArrowDownRight size={18} className="text-profit" />
                  ) : (
                    <ArrowUpRight size={18} className="text-primary" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-foreground capitalize">{tx.type}</div>
                  <div className="text-xs text-muted-foreground">{tx.date}</div>
                  {tx.upi_id && <div className="text-xs text-muted-foreground">{tx.upi_id}</div>}
                  {tx.utr_number && <div className="text-xs text-muted-foreground">UTR: {tx.utr_number}</div>}
                </div>
              </div>
              <div className="text-right">
                <div className={`font-mono font-bold ${tx.type === "deposit" ? "text-profit" : "text-foreground"}`}>
                  {tx.type === "deposit" ? "+" : "-"}₹{tx.amount}
                </div>
                <div className="flex items-center gap-1 justify-end">
                  {getStatusIcon(tx.status)}
                  <span className="text-xs text-muted-foreground capitalize">{tx.status}</span>
                </div>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No transactions yet</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header balance={balance} userName={userName} />
      <main className="px-4 py-4">
        {activeView === "main" && renderMainView()}
        {activeView === "deposit" && renderDepositView()}
        {activeView === "withdraw" && renderWithdrawView()}
        {activeView === "history" && renderHistoryView()}
      </main>
      <BottomNav activeTab="wallet" onTabChange={onNavigate} />
    </div>
  );
};

export default WalletPage;