import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  FileText,
  LogOut,
  ChevronRight,
  Bell,
  Globe,
  Volume2,
  VolumeX,
} from "lucide-react";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import TradeStatsCard from "@/components/TradeStatsCard";
import { toast } from "sonner";
import { getSoundEnabled, setSoundEnabled } from "@/hooks/useSoundEffects";

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

interface ProfilePageProps {
  balance: number;
  userName: string;
  userAvatar?: string;
  totalDeposit: number;
  totalBet: number;
  trades: Trade[];
  onLogout: () => void;
  onNavigate: (tab: "trade" | "wallet" | "referral" | "profile") => void;
}

const ProfilePage = ({
  balance,
  userName,
  userAvatar,
  totalDeposit,
  totalBet,
  trades,
  onLogout,
  onNavigate,
}: ProfilePageProps) => {
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabledState] = useState(getSoundEnabled);

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    setSoundEnabled(enabled);
    toast.success(enabled ? "Sound effects enabled" : "Sound effects disabled");
  };

  const navigate = useNavigate();

  const menuItems = [
    { icon: User, label: "Edit Profile", action: () => navigate("/profile/edit") },
    { 
      icon: soundEnabled ? Volume2 : VolumeX, 
      label: "Sound Effects", 
      toggle: true, 
      value: soundEnabled, 
      onChange: handleSoundToggle,
      description: soundEnabled ? "On" : "Off"
    },
    { icon: Bell, label: "Notifications", toggle: true, value: notifications, onChange: setNotifications },
    { icon: FileText, label: "Terms & Conditions", action: () => navigate("/terms") },
    { icon: Globe, label: "Language", value: "English", action: () => navigate("/language") },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header balance={balance} userName={userName} />

      <main className="px-4 py-4 space-y-6 max-w-lg mx-auto">
        {/* Profile Card */}
        <div className="glass-card rounded-2xl p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-gradient-gold rounded-full flex items-center justify-center text-4xl font-bold text-primary-foreground glow-gold overflow-hidden">
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt={userName} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">{userName}</h2>
            <p className="text-sm text-muted-foreground">Premium Trader</p>
          </div>
        </div>

        {/* Trade Stats with Animated Charts */}
        <TradeStatsCard trades={trades} />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Invested</div>
            <div className="font-mono font-bold text-lg text-foreground">
              ₹{totalDeposit.toLocaleString()}
            </div>
          </div>
          <div className="glass-card rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Total Volume</div>
            <div className="font-mono font-bold text-lg text-foreground">
              ₹{totalBet.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-all touch-manipulation active:bg-secondary/50 ${
                  index < menuItems.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.label === "Sound Effects" && soundEnabled ? "bg-primary/20" : "bg-secondary"}`}>
                    <Icon size={20} className={item.label === "Sound Effects" && soundEnabled ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-foreground block">
                      {item.label}
                    </span>
                    {'description' in item && (
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    )}
                  </div>
                </div>
                {'toggle' in item && item.toggle ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      item.onChange?.(!item.value);
                    }}
                    className={`w-12 h-6 rounded-full transition-all flex-shrink-0 ${
                      item.value ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        item.value ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                ) : 'value' in item && item.value && !('toggle' in item) ? (
                  <span className="text-sm text-muted-foreground">{item.value as string}</span>
                ) : (
                  <ChevronRight size={20} className="text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-4 bg-loss/10 hover:bg-loss/20 text-loss rounded-xl font-medium transition-all touch-manipulation active:scale-[0.98]"
        >
          <LogOut size={20} />
          Logout
        </button>

        {/* App Info */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>ApnaTrade v1.0.0</p>
          <p>© 2024 ApnaTrade. All rights reserved.</p>
        </div>
      </main>

      <BottomNav activeTab="profile" onTabChange={onNavigate} />
    </div>
  );
};

export default ProfilePage;
