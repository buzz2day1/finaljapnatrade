import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RealtimeNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "trade_result" | "deposit" | "withdraw" | "referral" | "promo";
  read: boolean;
  created_at: string;
}

interface UseRealtimeNotificationsProps {
  userId?: string;
  onNewNotification?: (notification: RealtimeNotification) => void;
}

export const useRealtimeNotifications = ({
  userId,
  onNewNotification,
}: UseRealtimeNotificationsProps) => {
  const showToastNotification = useCallback((notification: RealtimeNotification) => {
    const iconMap = {
      trade_result: "📈",
      deposit: "💰",
      withdraw: "💸",
      referral: "🎁",
      promo: "🎉",
    };

    const icon = iconMap[notification.type] || "🔔";

    toast.info(`${icon} ${notification.title}`, {
      description: notification.message,
      duration: 5000,
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to real-time notifications
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as RealtimeNotification;
          
          // Show toast notification
          showToastNotification(newNotification);
          
          // Callback for updating state
          onNewNotification?.(newNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onNewNotification, showToastNotification]);

  return null;
};

export default useRealtimeNotifications;
