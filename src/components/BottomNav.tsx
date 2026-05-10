import { forwardRef } from "react";
import { BarChart3, Wallet, Users, User } from "lucide-react";

type Tab = "trade" | "wallet" | "referral" | "profile";

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const BottomNav = forwardRef<HTMLElement, BottomNavProps>(
  ({ activeTab, onTabChange }, ref) => {
    const tabs = [
      { id: "trade" as Tab, icon: BarChart3, label: "Trade" },
      { id: "wallet" as Tab, icon: Wallet, label: "Wallet" },
      { id: "referral" as Tab, icon: Users, label: "Referral" },
      { id: "profile" as Tab, icon: User, label: "Profile" },
    ];

    return (
      <nav 
        ref={ref}
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-[100] pb-safe"
      >
        <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTabChange(tab.id);
                }}
                className={`flex flex-col items-center gap-1 px-4 sm:px-6 py-2 rounded-xl transition-all touch-manipulation active:scale-95 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground active:text-foreground"
                }`}
              >
                <div className={`relative ${isActive ? "animate-pulse-scale" : ""}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }
);

BottomNav.displayName = "BottomNav";

export default BottomNav;
