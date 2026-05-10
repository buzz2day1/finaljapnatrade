import { useState, useEffect, useCallback } from "react";
import Trade from "./Trade";
import TradeHistory from "./TradeHistory";
import WalletPage from "./WalletPage";
import ReferralPage from "./ReferralPage";
import ProfilePage from "./ProfilePage";
import NotificationsPage from "./NotificationsPage";
import Auth from "./Auth";
import CustomCursor from "@/components/CustomCursor";
import BackgroundMusic from "@/components/BackgroundMusic";
import useAuth, { setAuthCallbacks } from "@/hooks/useAuth";
import useTrades from "@/hooks/useTrades";
import useNotifications from "@/hooks/useNotifications";
import useRealtimeNotifications from "@/hooks/useRealtimeNotifications";
import useRealtimeTransactions from "@/hooks/useRealtimeTransactions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Tab = "trade" | "wallet" | "referral" | "profile";
type View = "main" | "history" | "notifications";

const Index = () => {
  const {
    user,
    profile,
    loading,
    isNewUser,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    createProfile,
    updateBalance,
    refreshProfile,
  } = useAuth();

  const { trades, fetchTrades, createTrade, closeTrade, getStats } = useTrades(user?.id);
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    addNotification,
  } = useNotifications(user?.id);

  // Real-time notifications subscription
  useRealtimeNotifications({
    userId: user?.id,
    onNewNotification: addNotification,
  });

  // Real-time transaction updates
  useRealtimeTransactions({
    userId: user?.id,
    onTransactionUpdate: useCallback((transaction: { status: string }) => {
      // Refresh profile when a transaction is completed/approved to update balance
      if (transaction.status === 'completed' || transaction.status === 'approved') {
        refreshProfile();
      }
    }, [refreshProfile]),
  });

  const [activeTab, setActiveTab] = useState<Tab>("trade");
  const [currentView, setCurrentView] = useState<View>("main");

  // Set up auth callbacks for notifications
  useEffect(() => {
    setAuthCallbacks({
      onNewAccountCreated: async (name: string) => {
        // Welcome notification for new accounts
        setTimeout(async () => {
          await createNotification({
            title: "Welcome to ApnaTrade! 🎉",
            message: `Hi ${name}, your trading journey begins now! Deposit to start trading.`,
            type: "promo",
          });
        }, 500);
      },
      onLogin: async (name: string) => {
        // Login notification
        setTimeout(async () => {
          await createNotification({
            title: "Welcome Back! 👋",
            message: `Good to see you again, ${name}. Happy trading!`,
            type: "promo",
          });
        }, 500);
      },
    });
  }, [createNotification]);

  // Fetch trades and notifications when user logs in
  useEffect(() => {
    if (user && profile) {
      fetchTrades();
      fetchNotifications();
    }
  }, [user, profile, fetchTrades, fetchNotifications]);

  const handleSignUp = async (email: string, password: string, referralCode?: string) => {
    const { data, error } = await signUp(email, password);
    
    if (!error && data?.user) {
      // Wait a bit for auth state to settle before creating profile
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Auto-create profile with email username
      const emailName = email.split('@')[0];
      try {
        const profileResult = await createProfile(emailName, referralCode);
        if (profileResult.error) {
          console.error("Profile creation error:", profileResult.error);
          // Don't show "No user" to user - it's a timing issue
          if (profileResult.error.message !== "No user") {
            return { error: profileResult.error as Error };
          }
          // Retry once after another delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryResult = await createProfile(emailName, referralCode);
          if (retryResult.error && retryResult.error.message !== "No user") {
            return { error: retryResult.error as Error };
          }
        }
        toast.success(`Welcome to ApnaTrade, ${emailName}!`);
      } catch (profileError: any) {
        console.error("Profile creation exception:", profileError);
      }
    }
    
    return { error: error as Error | null };
  };

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    return { error: error as Error | null };
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Process referral bonus when referred user makes first deposit
  const processReferralBonus = useCallback(async (referrerId: string, referredName: string, depositAmount: number) => {
    const SIGNUP_BONUS = 20; // ₹20 signup bonus
    const DEPOSIT_COMMISSION = 0.10; // 10% of deposit

    try {
      // Get referrer profile
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id, user_id, balance, referral_earnings")
        .eq("id", referrerId)
        .single();

      if (!referrer) return;

      // Calculate earnings
      const depositBonus = depositAmount * DEPOSIT_COMMISSION;
      const totalBonus = SIGNUP_BONUS + depositBonus;

      // Update referrer balance and earnings
      await supabase
        .from("profiles")
        .update({
          balance: referrer.balance + totalBonus,
          referral_earnings: (referrer.referral_earnings || 0) + totalBonus,
        })
        .eq("id", referrerId);

      // Update referral record
      await supabase
        .from("referrals")
        .update({
          signup_bonus_paid: true,
          total_earnings: totalBonus,
        })
        .eq("referrer_id", referrerId)
        .eq("referred_id", profile?.id);

      // Create notification for referrer (via their user_id)
      await supabase.from("notifications").insert({
        user_id: referrer.user_id,
        title: "Referral Bonus! 🎁",
        message: `You earned ₹${totalBonus.toFixed(0)} from ${referredName}'s first deposit!`,
        type: "referral",
      });

    } catch (error) {
      console.error("Error processing referral bonus:", error);
    }
  }, [profile?.id]);

  const handleDeposit = async (amount: number) => {
    if (!profile) return;
    
    const isFirstDeposit = profile.total_deposit === 0;
    const newBalance = profile.balance + amount;
    const newDeposit = profile.total_deposit + amount;
    await updateBalance(newBalance, undefined, newDeposit);

    // Create deposit notification
    await createNotification({
      title: "Deposit Received 💰",
      message: `₹${amount.toLocaleString()} has been added to your account. Start trading now!`,
      type: "deposit",
    });

    // Handle referral bonus on first deposit
    if (isFirstDeposit && profile.referred_by) {
      await processReferralBonus(profile.referred_by, profile.name, amount);
    }
  };

  const handleWithdraw = async (amount: number) => {
    if (!profile || profile.balance < amount) return;
    const newBalance = profile.balance - amount;
    await updateBalance(newBalance);

    // Create withdraw notification
    await createNotification({
      title: "Withdrawal Initiated 💸",
      message: `₹${amount.toLocaleString()} withdrawal request has been submitted.`,
      type: "withdraw",
    });
  };

  const handleBet = async (amount: number) => {
    if (!profile) return;
    // Only update total_bet, not balance (balance is managed separately in Trade.tsx)
    await updateBalance(undefined, profile.total_bet + amount);
  };

  const handleBalanceChange = async (newBalance: number) => {
    // Directly update balance in database
    await updateBalance(newBalance);
    // Force refresh profile to sync state
    await refreshProfile();
  };

  const handleTradeComplete = useCallback(async (
    trade: {
      coin_symbol: string;
      coin_name: string;
      timeframe: number;
      direction: "up" | "down";
      amount: number;
      entry_price: number;
      return_rate: number;
    },
    result: "win" | "loss",
    exitPrice: number,
    pnl: number
  ) => {
    // Create trade record
    const { data: tradeData } = await createTrade(trade);
    
    if (tradeData) {
      await closeTrade(tradeData.id, exitPrice, result, pnl);
    }

    // Create notification
    await createNotification({
      title: result === "win" ? "Trade Won! 🎉" : "Trade Closed",
      message:
        result === "win"
          ? `You won ₹${Math.abs(pnl).toFixed(2)} on ${trade.coin_symbol}!`
          : `Lost ₹${Math.abs(pnl).toFixed(2)} on ${trade.coin_symbol}.`,
      type: "trade_result",
    });
  }, [createTrade, closeTrade, createNotification]);

  // Handle referral notification (when referred user deposits)
  const handleReferralEarning = useCallback(async (referredName: string, earning: number) => {
    await createNotification({
      title: "Referral Bonus! 🎁",
      message: `You earned ₹${earning.toFixed(2)} from ${referredName}'s activity!`,
      type: "referral",
    });
  }, [createNotification]);

  // Handle mark as read with proper async
  const handleMarkAsRead = useCallback(async (id: string) => {
    await markAsRead(id);
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead();
  }, [markAllAsRead]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or needs profile
  if (!user || !profile) {
    return (
      <>
        <CustomCursor />
        <BackgroundMusic />
        <Auth
          onSignUp={handleSignUp}
          onSignIn={handleSignIn}
        />
      </>
    );
  }

  // Show notifications page
  if (currentView === "notifications") {
    return (
      <div className="custom-cursor">
        <CustomCursor />
        <BackgroundMusic />
        <NotificationsPage
          balance={profile.balance}
          userName={profile.name}
          notifications={notifications}
          onBack={() => setCurrentView("main")}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setCurrentView("main");
          }}
        />
      </div>
    );
  }

  // Show trade history
  if (currentView === "history") {
    return (
      <div className="custom-cursor">
        <CustomCursor />
        <BackgroundMusic />
        <TradeHistory
          balance={profile.balance}
          userName={profile.name}
          trades={trades}
          stats={getStats()}
          onBack={() => setCurrentView("main")}
          onNavigate={setActiveTab}
        />
      </div>
    );
  }

  return (
    <div className="custom-cursor">
      <CustomCursor />
      <BackgroundMusic />
      {activeTab === "trade" && (
        <Trade
          balance={profile.balance}
          userName={profile.name}
          onBalanceChange={handleBalanceChange}
          onBet={handleBet}
          onNavigate={setActiveTab}
          onOpenHistory={() => setCurrentView("history")}
          onOpenNotifications={() => setCurrentView("notifications")}
          unreadNotifications={unreadCount}
          onTradeComplete={handleTradeComplete}
          userId={user?.id}
          refreshProfile={refreshProfile}
        />
      )}
      {activeTab === "wallet" && (
        <WalletPage
          balance={profile.balance}
          totalDeposit={profile.total_deposit}
          totalBet={profile.total_bet}
          userName={profile.name}
          onDeposit={handleDeposit}
          onNavigate={setActiveTab}
        />
      )}
      {activeTab === "referral" && (
        <ReferralPage
          balance={profile.balance}
          userName={profile.name}
          onNavigate={setActiveTab}
        />
      )}
      {activeTab === "profile" && (
        <ProfilePage
          balance={profile.balance}
          userName={profile.name}
          userAvatar={profile.avatar_url}
          totalDeposit={profile.total_deposit}
          totalBet={profile.total_bet}
          trades={trades}
          onLogout={handleLogout}
          onNavigate={setActiveTab}
        />
      )}
    </div>
  );
};

export default Index;
