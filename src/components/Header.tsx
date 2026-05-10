import { Bell } from "lucide-react";
import Logo from "./Logo";

interface HeaderProps {
  balance: number;
  userName: string;
  unreadNotifications?: number;
  onNotificationsClick?: () => void;
}

const Header = ({ balance, userName, unreadNotifications = 0, onNotificationsClick }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <Logo size="sm" />
        
        <div className="flex items-center gap-3">
          <div className="text-right mr-2">
            <div className="text-xs text-muted-foreground">Balance</div>
            <div className="font-mono font-bold text-primary">₹{(balance ?? 0).toLocaleString()}</div>
          </div>
          
          <button 
            onClick={onNotificationsClick}
            className="relative p-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-all"
          >
            <Bell size={20} className="text-muted-foreground" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-loss text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
