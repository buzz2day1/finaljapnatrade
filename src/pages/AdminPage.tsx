import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, TrendingUp, ArrowDownRight, ArrowUpRight, DollarSign,
  Activity, BarChart3, Settings, ChevronLeft, CheckCircle2, XCircle, Clock,
  RefreshCw, Key, UserX, UserCheck, Gift, Wallet, Plus, Minus,
  ClipboardCheck, Smartphone, Upload, Image, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminStats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  totalTrades: number;
  platformProfit: number;
  activeUsers: number;
  totalReferrals: number;
  totalReferralEarnings: number;
}

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  status: string;
  coin: string | null;
  wallet_address: string | null;
  utr_number?: string;
  screenshot_url?: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  total_deposit: number;
  total_bet: number;
  referral_code: string | null;
  referral_earnings: number;
  blocked: boolean;
  created_at: string;
}

interface ReferralData {
  id: string;
  referrer_id: string;
  referred_id: string;
  total_earnings: number;
  signup_bonus_paid: boolean;
  created_at: string;
  referrer_name?: string;
  referred_name?: string;
}

interface AdminPageProps {
  onBack: () => void;
}

type TabType = "overview" | "deposits" | "withdrawals" | "users" | "referrals" | "settings";

const AdminPage = ({ onBack }: AdminPageProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0, totalDeposits: 0, totalWithdrawals: 0, pendingDeposits: 0,
    pendingWithdrawals: 0, totalTrades: 0, platformProfit: 0, activeUsers: 0,
    totalReferrals: 0, totalReferralEarnings: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [loading, setLoading] = useState(true);

  // UPI Settings state
  const [adminUpiId, setAdminUpiId] = useState("admin@apnatrade");
  const [newUpiId, setNewUpiId] = useState("");

  // QR Code state
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string>("");
  const [existingQrUrl, setExistingQrUrl] = useState<string>("");
  const [uploadingQr, setUploadingQr] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // View screenshot modal
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);

  useEffect(() => { fetchAdminData(); }, []);

  // Real-time subscription for admin page (auto-refresh on changes)
  useEffect(() => {
    const channel = supabase
      .channel('admin-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        () => {
          fetchAdminData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          fetchAdminData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      const { data: profilesData, count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact" });

      setUsers((profilesData || []) as UserProfile[]);

      const { data: tradesData, count: tradesCount } = await supabase
        .from("trades")
        .select("*", { count: "exact" });

      const { data: transactionsData } = await (supabase as any)
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: referralsData } = await supabase
        .from("referrals")
        .select("*");

      const profileMap = new Map((profilesData || []).map(p => [p.id, p.name]));
      const mappedReferrals = (referralsData || []).map(r => ({
        ...r,
        referrer_name: profileMap.get(r.referrer_id) || "Unknown",
        referred_name: profileMap.get(r.referred_id) || "Unknown",
      }));
      setReferrals(mappedReferrals);

      const deposits = transactionsData?.filter(t => t.type === "deposit") || [];
      const withdrawals = transactionsData?.filter(t => t.type === "withdraw") || [];

      const totalDeposits = deposits.filter(d => d.status === "completed").reduce((sum, d) => sum + d.amount, 0);
      const totalWithdrawals = withdrawals.filter(w => w.status === "completed").reduce((sum, w) => sum + w.amount, 0);
      const pendingDeposits = deposits.filter(d => d.status === "pending").length;
      const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;
      const platformProfit = tradesData?.filter(t => t.result === "loss").reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) || 0;
      const totalReferralEarnings = referralsData?.reduce((sum, r) => sum + r.total_earnings, 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalDeposits,
        totalWithdrawals,
        pendingDeposits,
        pendingWithdrawals,
        totalTrades: tradesCount || 0,
        platformProfit,
        activeUsers: Math.floor((usersCount || 0) * 0.3),
        totalReferrals: referralsData?.length || 0,
        totalReferralEarnings,
      });

      setTransactions(transactionsData || []);

      // Fetch admin UPI ID
      const { data: upiData } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "admin_upi_id")
        .maybeSingle();

      if (upiData?.value) {
        setAdminUpiId(upiData.value);
        setNewUpiId(upiData.value);
      }

      // Fetch existing QR code
      const { data: qrData } = await (supabase as any)
        .from("admin_qr_codes")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (qrData?.qr_url) {
        setExistingQrUrl(qrData.qr_url);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionStatus = async (id: string, status: "completed" | "failed") => {
    try {
      const tx = transactions.find(t => t.id === id);
      if (tx && status === "completed") {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", tx.user_id)
          .maybeSingle();

        if (profile) {
          if (tx.type === "deposit") {
            await supabase.from("profiles").update({
              balance: profile.balance + tx.amount,
              total_deposit: profile.total_deposit + tx.amount,
            }).eq("user_id", tx.user_id);

            await supabase.from("notifications").insert({
              user_id: tx.user_id,
              title: "Deposit Successful! 🎉",
              message: `Your deposit of ₹${tx.amount} has been credited.`,
              type: "deposit",
            });
          } else if (tx.type === "withdraw") {
            if (profile.balance >= tx.amount) {
              await supabase.from("profiles").update({
                balance: profile.balance - tx.amount,
              }).eq("user_id", tx.user_id);

              await supabase.from("notifications").insert({
                user_id: tx.user_id,
                title: "Withdrawal Sent! 🚀",
                message: `Your withdrawal of ₹${tx.amount} has been processed.`,
                type: "withdraw",
              });
            } else {
              toast.error("User has insufficient balance");
              return;
            }
          }
        }
      }

      const { error } = await supabase.from("transactions").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      toast.success(`Transaction ${status}`);
      fetchAdminData();
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction");
    }
  };

  const updateUserBalance = async (userId: string, amount: number, action: "add" | "subtract") => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error("User not found");
      const newBalance = action === "add" ? user.balance + amount : user.balance - amount;
      if (newBalance < 0) { toast.error("Balance cannot be negative"); return; }
      const { error } = await supabase.from("profiles").update({ balance: newBalance }).eq("id", userId);
      if (error) throw error;
      toast.success(`Balance ${action === "add" ? "added" : "subtracted"} successfully`);
      fetchAdminData();
    } catch (error) {
      console.error("Error updating balance:", error);
      toast.error("Failed to update balance");
    }
  };

  const toggleUserBlock = async (userId: string, blocked: boolean) => {
    try {
      const { error } = await supabase.from("profiles").update({ blocked: !blocked }).eq("id", userId);
      if (error) throw error;
      toast.success(`User ${blocked ? "unblocked" : "blocked"} successfully`);
      fetchAdminData();
    } catch (error) {
      console.error("Error toggling block:", error);
      toast.error("Failed to update user status");
    }
  };

  const saveUpiId = async () => {
    if (!newUpiId || !newUpiId.includes("@")) {
      toast.error("Please enter a valid UPI ID (must include @)");
      return;
    }
    try {
      await supabase.from("platform_settings").upsert(
        { key: "admin_upi_id", value: newUpiId },
        { onConflict: "key" }
      );
      setAdminUpiId(newUpiId);
      toast.success("UPI ID updated successfully!");
    } catch (error) {
      toast.error("Failed to save UPI ID");
    }
  };

  const handleQrUpload = async () => {
    if (!qrFile) {
      toast.error("Please select a QR code image");
      return;
    }
    setUploadingQr(true);
    try {
      const fileExt = qrFile.name.split('.').pop();
      const fileName = `admin/qr_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("screenshots")
        .upload(fileName, qrFile);

      if (uploadError) throw new Error("Failed to upload QR code");

      const { data: { publicUrl } } = supabase.storage
        .from("screenshots")
        .getPublicUrl(fileName);

      // Deactivate old QR codes
      await (supabase as any)
        .from("admin_qr_codes")
        .update({ is_active: false })
        .eq("is_active", true);

      // Insert new QR code
      await (supabase as any)
        .from("admin_qr_codes")
        .insert({
          qr_url: publicUrl,
          upi_id: adminUpiId,
          is_active: true,
        });

      setExistingQrUrl(publicUrl);
      setQrFile(null);
      setQrPreview("");
      toast.success("QR code updated successfully!");
    } catch (error) {
      toast.error("Failed to upload QR code");
    } finally {
      setUploadingQr(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 size={16} className="text-profit" />;
      case "pending": return <Clock size={16} className="text-primary animate-pulse" />;
      case "failed": return <XCircle size={16} className="text-loss" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: Users, label: "Total Users", value: stats.totalUsers, color: "text-primary" },
          { icon: Activity, label: "Active Users", value: stats.activeUsers, color: "text-profit" },
          { icon: ArrowDownRight, label: "Total Deposits", value: `₹${stats.totalDeposits.toLocaleString()}`, color: "text-profit", sub: `${stats.pendingDeposits} pending` },
          { icon: ArrowUpRight, label: "Total Withdrawals", value: `₹${stats.totalWithdrawals.toLocaleString()}`, color: "text-loss", sub: `${stats.pendingWithdrawals} pending` },
          { icon: BarChart3, label: "Total Trades", value: stats.totalTrades, color: "text-primary" },
          { icon: DollarSign, label: "Platform Profit", value: `₹${stats.platformProfit.toLocaleString()}`, color: "text-gradient-gold" },
          { icon: Gift, label: "Total Referrals", value: stats.totalReferrals, color: "text-primary" },
          { icon: TrendingUp, label: "Referral Payouts", value: `₹${stats.totalReferralEarnings.toLocaleString()}`, color: "text-profit" },
        ].map((stat, i) => (
          <div key={i} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={18} className={stat.color} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
            {stat.sub && <div className="text-xs text-primary">{stat.sub}</div>}
          </div>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Pending Actions</h3>
          <button onClick={fetchAdminData} className="p-2 hover:bg-secondary rounded-lg"><RefreshCw size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="divide-y divide-border">
          {transactions.filter(t => t.status === "pending").slice(0, 5).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tx.type === "deposit" ? "bg-profit/20" : "bg-primary/20"}`}>
                  {tx.type === "deposit" ? <ArrowDownRight size={18} className="text-profit" /> : <ArrowUpRight size={18} className="text-primary" />}
                </div>
                <div>
                  <div className="font-medium text-foreground capitalize">{tx.type}</div>
                  <div className="text-xs text-muted-foreground">{tx.coin} • {new Date(tx.created_at).toLocaleDateString()}</div>
                  {tx.utr_number && <div className="text-xs text-primary">UTR: {tx.utr_number}</div>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-foreground">₹{tx.amount}</span>
                {tx.screenshot_url && (
                  <button onClick={() => setViewingScreenshot(tx.screenshot_url || null)} className="p-2 bg-primary/20 rounded-lg hover:bg-primary/30">
                    <Image size={16} className="text-primary" />
                  </button>
                )}
                <button onClick={() => updateTransactionStatus(tx.id, "completed")} className="p-2 bg-profit/20 rounded-lg hover:bg-profit/30"><CheckCircle2 size={16} className="text-profit" /></button>
                <button onClick={() => updateTransactionStatus(tx.id, "failed")} className="p-2 bg-loss/20 rounded-lg hover:bg-loss/30"><XCircle size={16} className="text-loss" /></button>
              </div>
            </div>
          ))}
          {transactions.filter(t => t.status === "pending").length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No pending transactions</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderTransactionsList = (type: "deposit" | "withdraw") => {
    const filtered = transactions.filter(t => t.type === type);
    return (
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground capitalize">{type}s</h3>
          <span className="text-sm text-muted-foreground">{filtered.length} total</span>
        </div>
        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
          {filtered.map((tx) => (
            <div key={tx.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${type === "deposit" ? "bg-profit/20" : "bg-primary/20"}`}>
                    {type === "deposit" ? <ArrowDownRight size={18} className="text-profit" /> : <ArrowUpRight size={18} className="text-primary" />}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">₹{tx.amount.toLocaleString()} • {tx.coin}</div>
                    <div className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">{getStatusIcon(tx.status)}<span className="text-xs text-muted-foreground capitalize">{tx.status}</span></div>
                  {tx.status === "pending" && (
                    <>
                      <button onClick={() => updateTransactionStatus(tx.id, "completed")} className="p-2 bg-profit/20 rounded-lg hover:bg-profit/30"><CheckCircle2 size={16} className="text-profit" /></button>
                      <button onClick={() => updateTransactionStatus(tx.id, "failed")} className="p-2 bg-loss/20 rounded-lg hover:bg-loss/30"><XCircle size={16} className="text-loss" /></button>
                    </>
                  )}
                </div>
              </div>
              {/* UTR + Screenshot details */}
              <div className="flex flex-wrap gap-2 text-xs">
                {tx.wallet_address && (
                  <span className="px-2 py-1 bg-secondary rounded">
                    {type === "deposit" ? "Sent to:" : "User UPI:"} {tx.wallet_address}
                  </span>
                )}
                {tx.utr_number && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded">UTR: {tx.utr_number}</span>
                )}
                {tx.screenshot_url && (
                  <button 
                    onClick={() => setViewingScreenshot(tx.screenshot_url || null)}
                    className="px-2 py-1 bg-primary/10 text-primary rounded flex items-center gap-1 hover:bg-primary/20"
                  >
                    <Image size={12} /> View Screenshot
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <div className="p-8 text-center text-muted-foreground">No {type}s yet</div>}
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">User Management</h3>
          <p className="text-xs text-muted-foreground">{users.length} total users</p>
        </div>
        <div className="divide-y divide-border max-h-[65vh] overflow-y-auto">
          {users.map((user) => (
            <div key={user.id} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${user.blocked ? "bg-loss/20 text-loss" : "bg-primary/20 text-primary"}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-foreground flex items-center gap-2">
                      {user.name}
                      {user.blocked && <span className="text-xs bg-loss/20 text-loss px-2 py-0.5 rounded">Blocked</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">Code: {user.referral_code || "N/A"}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-foreground">₹{user.balance.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Deposit: ₹{user.total_deposit}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateUserBalance(user.id, 100, "add")} className="flex-1 py-2 bg-profit/20 text-profit rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-profit/30">
                  <Plus size={14} /> Add ₹100
                </button>
                <button onClick={() => updateUserBalance(user.id, 100, "subtract")} className="flex-1 py-2 bg-loss/20 text-loss rounded-lg text-sm font-medium flex items-center justify-center gap-1 hover:bg-loss/30">
                  <Minus size={14} /> Sub ₹100
                </button>
                <button onClick={() => toggleUserBlock(user.id, user.blocked)} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${user.blocked ? "bg-profit/20 text-profit hover:bg-profit/30" : "bg-loss/20 text-loss hover:bg-loss/30"}`}>
                  {user.blocked ? <UserCheck size={14} /> : <UserX size={14} />}
                  {user.blocked ? "Unblock" : "Block"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReferrals = () => (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Referral Tracking</h3>
          <p className="text-xs text-muted-foreground">{referrals.length} total referrals • ₹{stats.totalReferralEarnings} earned</p>
        </div>
        <div className="divide-y divide-border max-h-[65vh] overflow-y-auto">
          {referrals.map((ref) => (
            <div key={ref.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg"><Gift size={18} className="text-primary" /></div>
                <div>
                  <div className="font-medium text-foreground">{ref.referrer_name} → {ref.referred_name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(ref.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-profit">₹{ref.total_earnings}</div>
                <div className="text-xs text-muted-foreground">{ref.signup_bonus_paid ? "Bonus Paid" : "Pending Bonus"}</div>
              </div>
            </div>
          ))}
          {referrals.length === 0 && <div className="p-8 text-center text-muted-foreground">No referrals yet</div>}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* UPI Configuration */}
      <div className="glass-card rounded-2xl p-6 space-y-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Smartphone size={24} className="text-primary" />
          UPI Payment Configuration
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Current Admin UPI ID</label>
            <div className="p-4 bg-primary/10 rounded-xl border border-primary/30">
              <div className="font-mono text-lg font-bold text-primary">{adminUpiId}</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">New UPI ID</label>
            <input
              type="text"
              value={newUpiId}
              onChange={(e) => setNewUpiId(e.target.value)}
              placeholder="admin@bank"
              className="w-full px-4 py-3 bg-secondary rounded-xl text-foreground font-mono"
            />
          </div>

          <button
            onClick={saveUpiId}
            disabled={!newUpiId || newUpiId === adminUpiId}
            className="w-full py-3 bg-gradient-gold text-primary-foreground font-bold rounded-xl disabled:opacity-50"
          >
            Save UPI ID
          </button>
        </div>
      </div>

      {/* QR Code Management */}
      <div className="glass-card rounded-2xl p-6 space-y-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Image size={24} className="text-primary" />
          QR Code Management
        </h2>

        <p className="text-sm text-muted-foreground">
          Upload a UPI QR code image for users to scan and make payments. 
          This QR will be shown on the wallet page.
        </p>

        <div className="space-y-4">
          {existingQrUrl && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Current QR Code</label>
              <div className="flex justify-center p-4 bg-white rounded-xl border border-primary/30">
                <img src={existingQrUrl} alt="Current QR" className="w-40 h-40" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">
              {existingQrUrl ? "Replace QR Code" : "Upload QR Code"}
            </label>
            <div 
              onClick={() => qrInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-all"
            >
              {qrPreview ? (
                <div className="space-y-2">
                  <img src={qrPreview} alt="New QR Preview" className="max-h-32 mx-auto rounded-lg" />
                  <p className="text-xs text-muted-foreground">Click to change QR</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload size={32} className="mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to select QR code image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
            <input
              ref={qrInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setQrFile(file);
                  const reader = new FileReader();
                  reader.onload = (ev) => setQrPreview(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
            />
          </div>

          <button
            onClick={handleQrUpload}
            disabled={!qrFile || uploadingQr}
            className="w-full py-3 bg-gradient-gold text-primary-foreground font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploadingQr ? <><RefreshCw size={18} className="animate-spin" /> Uploading...</> : <>Upload QR Code</>}
          </button>
        </div>
      </div>

      {/* Admin Info */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Key size={24} className="text-primary" />
          Admin Actions Guide
        </h2>
        <div className="space-y-3">
          <div className="p-4 bg-secondary/50 rounded-xl flex items-center gap-3">
            <ArrowDownRight size={20} className="text-profit" />
            <div className="text-sm text-foreground">
              <span className="font-bold text-profit">Deposit:</span> User sends payment → submits UTR + screenshot → Verify & approve to credit balance
            </div>
          </div>
          <div className="p-4 bg-secondary/50 rounded-xl flex items-center gap-3">
            <ArrowUpRight size={20} className="text-primary" />
            <div className="text-sm text-foreground">
              <span className="font-bold text-primary">Withdrawal:</span> User requests with UPI ID → You send payment manually → Mark as completed
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading admin data...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as TabType, icon: BarChart3, label: "Overview" },
    { id: "deposits" as TabType, icon: ArrowDownRight, label: "Deposits" },
    { id: "withdrawals" as TabType, icon: ArrowUpRight, label: "Withdrawals" },
    { id: "users" as TabType, icon: Users, label: "Users" },
    { id: "referrals" as TabType, icon: Gift, label: "Referrals" },
    { id: "settings" as TabType, icon: Settings, label: "Settings" },
  ];

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-secondary rounded-lg"><ChevronLeft size={24} className="text-foreground" /></button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Manage your platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate("/apnadradeadmin/qa")} 
              className="flex items-center gap-1.5 px-3 py-2 bg-profit/20 rounded-lg hover:bg-profit/30 text-profit text-sm font-medium"
            >
              <ClipboardCheck size={16} />
              QA
            </button>
            <button onClick={fetchAdminData} className="p-2 bg-primary/20 rounded-lg hover:bg-primary/30"><RefreshCw size={20} className="text-primary" /></button>
          </div>
        </div>

        <div className="flex overflow-x-auto px-4 pb-3 gap-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              <tab.icon size={16} />{tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-4">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "deposits" && renderTransactionsList("deposit")}
        {activeTab === "withdrawals" && renderTransactionsList("withdraw")}
        {activeTab === "users" && renderUsers()}
        {activeTab === "referrals" && renderReferrals()}
        {activeTab === "settings" && renderSettings()}
      </main>

      {/* Screenshot Modal */}
      {viewingScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setViewingScreenshot(null)}>
          <div className="relative max-w-lg max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={viewingScreenshot} alt="Payment Screenshot" className="max-w-full max-h-[85vh] rounded-xl" />
            <button 
              onClick={() => setViewingScreenshot(null)}
              className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;