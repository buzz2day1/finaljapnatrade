import { useState, useEffect } from "react";
import { Copy, Share2, Users, Gift, TrendingUp, Loader2, Calendar, IndianRupee, UserPlus, ChevronRight, BarChart3 } from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Referral {
  id: string;
  name: string;
  joinDate: string;
  totalDeposit: number;
  yourEarnings: number;
}

interface DailyEarning {
  date: string;
  dayName: string;
  newSignups: number;
  earnings: number;
}

interface ReferralTier {
  tier_level: number;
  active_count: number;
  commission_percentage: number;
  bonus_amount: number;
}

interface ReferralStats {
  success: boolean;
  current_tier: ReferralTier;
  total_referrals: number;
  active_referrals: number;
  total_earnings: number;
  today_earnings: number;
  this_month_earnings: number;
  referral_code: string;
  referral_link: string;
}

interface ReferralPageProps {
  balance: number;
  userName: string;
  onNavigate: (tab: "trade" | "wallet" | "referral" | "profile") => void;
}

const ReferralPage = ({ balance, userName, onNavigate }: ReferralPageProps) => {
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<DailyEarning[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "referrals" | "chart">("overview");

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      setLoading(true);

      // First check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No authenticated user for referral stats");
        setDefaultStats();
        return;
      }

      // Use the new get_user_referral_stats RPC function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_user_referral_stats' as any);

      if (statsError) {
        console.error("Error fetching referral stats:", statsError);
        // Fallback to old method if new function fails
        await fetchReferralDataFallback();
        return;
      }

      const stats = statsData as unknown as ReferralStats;
      if (stats?.success) {
        setReferralStats(stats);
        setReferralCode(stats.referral_code || "");

        // Get detailed referral list for the referrals tab
        await fetchReferralDetails();
      } else {
        // If no data or error, show level 0 with fallback
        await fetchReferralDataFallback();
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
      await fetchReferralDataFallback();
    } finally {
      setLoading(false);
    }
  };

  const setDefaultStats = () => {
    setReferralStats({
      success: true,
      current_tier: {
        tier_level: 0,
        active_count: 0,
        commission_percentage: 2,
        bonus_amount: 0
      },
      total_referrals: 0,
      active_referrals: 0,
      total_earnings: 0,
      today_earnings: 0,
      this_month_earnings: 0,
      referral_code: "",
      referral_link: ""
    });
  };

  // Fallback function for backward compatibility
  const fetchReferralDataFallback = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, referral_code, referral_earnings")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      setReferralCode(profile.referral_code || "");
      setReferralStats({
        success: true,
        current_tier: {
          tier_level: 0,
          active_count: 0,
          commission_percentage: 2,
          bonus_amount: 0
        },
        total_referrals: 0,
        active_referrals: 0,
        total_earnings: profile.referral_earnings || 0,
        today_earnings: 0,
        this_month_earnings: 0,
        referral_code: profile.referral_code || "",
        referral_link: `https://apnatrade.lovable.app/?ref=${profile.referral_code || ""}`
      });
    }
  };

  const fetchReferralDetails = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;

    // Get referrals where current user is referrer
    const { data: referralsData } = await supabase
      .from("referrals")
      .select("id, referred_id, total_earnings, created_at")
      .eq("referrer_id", profile.id);

    if (referralsData && referralsData.length > 0) {
      // Get referred user profiles
      const referredIds = referralsData.map(r => r.referred_id);
      const { data: referredProfiles } = await supabase
        .from("profiles")
        .select("id, name, total_deposit, created_at")
        .in("id", referredIds);

      const mappedReferrals = referralsData.map(ref => {
        const refProfile = referredProfiles?.find(p => p.id === ref.referred_id);
        return {
          id: ref.id,
          name: refProfile?.name || "Unknown User",
          joinDate: new Date(ref.created_at).toLocaleDateString(),
          totalDeposit: refProfile?.total_deposit || 0,
          yourEarnings: ref.total_earnings || 0,
        };
      });

      setReferrals(mappedReferrals);
      generateWeeklyData(referralsData, mappedReferrals);
    } else {
      setReferrals([]);
      generateWeeklyData([], []);
    }
  };

  const generateWeeklyData = (referralsData: any[], mappedReferrals: Referral[]) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const weekData: DailyEarning[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];

      // Count signups on this day
      const signups = referralsData.filter(r => {
        const refDate = new Date(r.created_at).toISOString().split('T')[0];
        return refDate === dateStr;
      }).length;

      // Calculate earnings for this day (simplified - based on signups)
      const earnings = signups * 20; // ₹20 per signup

      weekData.push({
        date: dateStr,
        dayName: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : dayName.slice(0, 3),
        newSignups: signups,
        earnings: earnings,
      });
    }

    setWeeklyData(weekData);
  };

  // Get the preview URL and construct referral link
  const referralLink = `https://apnatrade.lovable.app/?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied! 🔗");
  };

  const shareLink = async () => {
    const shareText = `🚀 Join ApnaTrade and start earning with crypto trading!\n\n✅ Easy deposits via LTC, TRX, DOGE (low fees!)\n✅ Quick withdrawals\n✅ 85% profit on winning trades\n\nJoin now: ${referralLink}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join ApnaTrade - Crypto Trading",
          text: shareText,
          url: referralLink,
        });
      } catch {
        copyLink();
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Share message copied! 📋");
    }
  };

  const maxEarning = Math.max(...weeklyData.map(d => d.earnings), 1);
  const totalWeekSignups = weeklyData.reduce((sum, d) => sum + d.newSignups, 0);
  const totalWeekEarnings = weeklyData.reduce((sum, d) => sum + d.earnings, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header balance={balance} userName={userName} />

      <main className="px-4 py-4 space-y-4">
        {/* Hero Card with Share Link */}
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-gold rounded-xl">
                <Gift size={24} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Refer & Earn</h1>
                <p className="text-sm text-muted-foreground">Share link & earn lifetime</p>
              </div>
            </div>

            {/* Current Tier & Commission Info */}
            <div className="mb-4">
              <div className="text-center mb-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-gold text-primary-foreground rounded-xl font-bold">
                  <span className="text-sm">Level {referralStats?.current_tier.tier_level || 0}</span>
                  <span className="text-xs opacity-90">
                    ({referralStats?.current_tier.active_count || 0} active users)
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-profit/10 border border-profit/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-profit">{referralStats?.current_tier.commission_percentage || 2}%</div>
                  <div className="text-xs text-muted-foreground">Commission Rate</div>
                </div>
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {referralStats?.current_tier.bonus_amount ?
                      `₹${referralStats.current_tier.bonus_amount.toLocaleString()}` :
                      '₹0'
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">Tier Bonus</div>
                </div>
              </div>

              {/* Next Milestone */}
              {referralStats && (
                <div className="mt-3 p-3 bg-secondary/50 rounded-xl border border-border/50">
                  <div className="text-center text-sm text-muted-foreground">
                    {referralStats.current_tier.tier_level < 4 ? (
                      <>
                        <span className="font-medium">Next: </span>
                        {referralStats.current_tier.tier_level === 0 && `${10 - referralStats.current_tier.active_count} more users for 3% commission`}
                        {referralStats.current_tier.tier_level === 1 && `${50 - referralStats.current_tier.active_count} more users for 5% + ₹500 bonus`}
                        {referralStats.current_tier.tier_level === 2 && `${100 - referralStats.current_tier.active_count} more users for 10% + ₹800 bonus`}
                        {referralStats.current_tier.tier_level === 3 && `${1000 - referralStats.current_tier.active_count} more users for 20% + ₹9,000 bonus`}
                      </>
                    ) : (
                      <span className="font-medium text-profit">🎉 Maximum Tier Reached!</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Referral Link */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Your Referral Link</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-3 bg-secondary rounded-xl font-mono text-xs text-primary overflow-hidden truncate border border-border">
                  {referralLink}
                </div>
                <button
                  onClick={copyLink}
                  className="p-3 bg-primary/20 rounded-xl hover:bg-primary/30 transition-all"
                >
                  <Copy size={18} className="text-primary" />
                </button>
                <button
                  onClick={shareLink}
                  className="p-3 bg-gradient-gold rounded-xl hover:opacity-90 transition-all"
                >
                  <Share2 size={18} className="text-primary-foreground" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                🔗 No code needed! Friends auto-tracked when they join via your link
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-3 text-center">
            <Users size={18} className="text-primary mx-auto mb-1" />
            <div className="text-xl font-bold text-foreground">{referrals.length}</div>
            <div className="text-xs text-muted-foreground">Total Referrals</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <TrendingUp size={18} className="text-profit mx-auto mb-1" />
            <div className="text-xl font-bold text-profit">₹{(referralStats?.total_earnings || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Earned</div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <Calendar size={18} className="text-primary mx-auto mb-1" />
            <div className="text-xl font-bold text-foreground">₹{totalWeekEarnings}</div>
            <div className="text-xs text-muted-foreground">This Week</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2">
          {[
            { id: "overview", label: "Overview", icon: Gift },
            { id: "chart", label: "Daily Stats", icon: BarChart3 },
            { id: "referrals", label: "Referrals", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon size={16} />
              <span className="text-sm">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* How it works */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="text-lg">🚀</span> How It Works
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">1</div>
                  <div>
                    <div className="font-medium text-foreground">Share Your Link</div>
                    <div className="text-sm text-muted-foreground">Send your unique link to friends via WhatsApp, Telegram, etc.</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">2</div>
                  <div>
                    <div className="font-medium text-foreground">Referral Deposits</div>
                    <div className="text-sm text-muted-foreground">Your friends join via your link and deposit any amount (LTC/TRX/DOGE).</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gradient-gold rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">3</div>
                  <div>
                    <div className="font-medium text-foreground">Earn Lifetime Commissions</div>
                    <div className="text-sm text-muted-foreground">Earn <span className="text-profit font-medium">{referralStats?.current_tier.commission_percentage || 2}%</span> commission on EVERY deposit they make, forever!</div>
                  </div>
                </div>
              </div>

              {/* Tier Table */}
              <div className="glass-card rounded-xl p-4 mt-4">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span>🏆</span> Commission Tiers
                </h4>
                <div className="space-y-2 text-sm">
                  <div className={`flex items-center justify-between p-2 rounded-lg ${referralStats?.current_tier.tier_level === 0 ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/50'}`}>
                    <span className="text-muted-foreground">Level 0 (0-9 users)</span>
                    <span className="font-medium text-foreground">2%</span>
                  </div>
                  <div className={`flex items-center justify-between p-2 rounded-lg ${referralStats?.current_tier.tier_level === 1 ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/50'}`}>
                    <span className="text-muted-foreground">Level 1 (10-49 users)</span>
                    <span className="font-medium text-foreground">3%</span>
                  </div>
                  <div className={`flex items-center justify-between p-2 rounded-lg ${referralStats?.current_tier.tier_level === 2 ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/50'}`}>
                    <span className="text-muted-foreground">Level 2 (50-99 users)</span>
                    <span className="font-medium text-foreground">5% + ₹500</span>
                  </div>
                  <div className={`flex items-center justify-between p-2 rounded-lg ${referralStats?.current_tier.tier_level === 3 ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/50'}`}>
                    <span className="text-muted-foreground">Level 3 (100-999 users)</span>
                    <span className="font-medium text-foreground">10% + ₹800</span>
                  </div>
                  <div className={`flex items-center justify-between p-2 rounded-lg ${referralStats?.current_tier.tier_level === 4 ? 'bg-profit/10 border border-profit/30' : 'bg-secondary/50'}`}>
                    <span className="text-muted-foreground">Level 4 (1000+ users)</span>
                    <span className="font-medium text-profit">20% + ₹9,000</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  💡 No signup bonus. Commissions are earned on deposits only.
                </p>
              </div>
            </div>

            {/* Pro Tips */}
            <div className="glass-card rounded-2xl p-5 bg-primary/5 border border-primary/20">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="text-lg">💡</span> Pro Tips
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-profit">✓</span>
                  <span>Share in trading groups on Telegram & WhatsApp</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-profit">✓</span>
                  <span>Create YouTube shorts showing your profits</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-profit">✓</span>
                  <span>Post on Instagram stories with your referral link</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "chart" && (
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Last 7 Days</h3>
              <div className="text-sm text-muted-foreground">
                {totalWeekSignups} signups • ₹{totalWeekEarnings} earned
              </div>
            </div>

            {/* Chart */}
            <div className="space-y-3">
              {weeklyData.map((day, index) => (
                <div key={day.date} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-muted-foreground font-medium">
                    {day.dayName}
                  </div>
                  <div className="flex-1 h-8 bg-secondary rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-gold transition-all duration-500"
                      style={{ width: `${(day.earnings / maxEarning) * 100}%` }}
                    />
                    {day.newSignups > 0 && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs">
                        <span className="text-primary font-medium">+{day.newSignups} users</span>
                      </div>
                    )}
                  </div>
                  <div className="w-16 text-right">
                    <span className={`text-sm font-mono font-bold ${day.earnings > 0 ? 'text-profit' : 'text-muted-foreground'}`}>
                      ₹{day.earnings}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {totalWeekSignups === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <UserPlus size={32} className="mx-auto mb-2 opacity-50" />
                <p>No referrals this week yet</p>
                <p className="text-sm">Share your link to start earning!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "referrals" && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Your Referrals</h3>
              <span className="text-sm text-muted-foreground">{referrals.length} total</span>
            </div>
            {referrals.length > 0 ? (
              <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 hover:bg-secondary/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-gold rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-bold">{referral.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{referral.name}</div>
                        <div className="text-xs text-muted-foreground">Joined {referral.joinDate}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-profit">+₹{referral.yourEarnings}</div>
                      <div className="text-xs text-muted-foreground">Deposit: ₹{referral.totalDeposit}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users size={48} className="text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-medium">No referrals yet</p>
                <p className="text-sm text-muted-foreground">Share your link to start earning!</p>
                <button
                  onClick={shareLink}
                  className="mt-4 px-6 py-2 bg-gradient-gold text-primary-foreground rounded-xl font-medium"
                >
                  Share Now
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav activeTab="referral" onTabChange={onNavigate} />
    </div>
  );
};

export default ReferralPage;
