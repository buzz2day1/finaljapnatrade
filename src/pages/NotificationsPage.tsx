import { Bell, ChevronLeft, CheckCheck, TrendingUp, Wallet, Users, Gift } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "trade_result" | "deposit" | "withdraw" | "referral" | "promo";
  read: boolean;
  created_at: string;
}

interface NotificationsPageProps {
  balance: number;
  userName: string;
  notifications: Notification[];
  onBack: () => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onNavigate: (tab: "trade" | "wallet" | "referral" | "profile") => void;
}

const NotificationsPage = ({
  balance,
  userName,
  notifications,
  onBack,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigate,
}: NotificationsPageProps) => {
  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "trade_result":
        return <TrendingUp size={18} className="text-primary" />;
      case "deposit":
        return <Wallet size={18} className="text-profit" />;
      case "withdraw":
        return <Wallet size={18} className="text-primary" />;
      case "referral":
        return <Users size={18} className="text-profit" />;
      case "promo":
        return <Gift size={18} className="text-primary" />;
      default:
        return <Bell size={18} className="text-muted-foreground" />;
    }
  };

  const getIconBg = (type: Notification["type"]) => {
    switch (type) {
      case "trade_result":
        return "bg-primary/20";
      case "deposit":
        return "bg-profit/20";
      case "withdraw":
        return "bg-primary/20";
      case "referral":
        return "bg-profit/20";
      case "promo":
        return "bg-primary/20";
      default:
        return "bg-secondary";
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await onMarkAsRead(notification.id);
    }
  };

  const handleMarkAllRead = async () => {
    await onMarkAllAsRead();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Custom header for notifications - no default Header to avoid conflicts */}
      <div className="bg-card/95 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onBack();
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation active:scale-95"
            >
              <ChevronLeft size={20} />
              <span className="font-medium">Back</span>
            </button>
            
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </h1>

            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleMarkAllRead();
                }}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium touch-manipulation active:scale-95"
              >
                <CheckCheck size={14} />
                <span className="hidden sm:inline">Mark all</span>
              </button>
            )}
            {unreadCount === 0 && <div className="w-16" />}
          </div>
        </div>
      </div>

      <main className="px-3 sm:px-4 py-4 space-y-3 max-w-lg mx-auto">
        {/* Notifications List */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={32} className="text-muted-foreground opacity-50" />
              </div>
              <p className="text-foreground font-medium mb-1">No notifications yet</p>
              <p className="text-sm text-muted-foreground">
                You'll see updates about trades, deposits, and more here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNotificationClick(notification);
                  }}
                  className={`w-full p-3 sm:p-4 text-left transition-all duration-200 hover:bg-secondary/30 active:scale-[0.99] touch-manipulation ${
                    !notification.read ? "bg-primary/5 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${getIconBg(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`font-semibold text-sm sm:text-base ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5 animate-pulse" />
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground/60 mt-1">
                        {format(new Date(notification.created_at), "MMM dd, HH:mm")}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <BottomNav activeTab="trade" onTabChange={onNavigate} />
    </div>
  );
};

export default NotificationsPage;
