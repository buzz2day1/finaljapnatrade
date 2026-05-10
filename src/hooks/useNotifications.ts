import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "trade_result" | "deposit" | "withdraw" | "referral" | "promo";
  read: boolean;
  created_at: string;
}

export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data && !error) {
      setNotifications(data as Notification[]);
      setUnreadCount(data.filter((n) => !n.read).length);
    }
  }, [userId]);

  // Add notification to state (for real-time updates)
  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const createNotification = async (notification: {
    title: string;
    message: string;
    type: Notification["type"];
  }) => {
    if (!userId) return { error: new Error("No user") };

    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        ...notification,
      })
      .select()
      .single();

    if (data && !error) {
      setNotifications((prev) => [data as Notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    }

    return { data, error };
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    return { error };
  };

  const markAllAsRead = async () => {
    if (!userId) return { error: new Error("No user") };

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }

    return { error };
  };

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    createNotification,
    markAsRead,
    markAllAsRead,
    addNotification,
  };
};

export default useNotifications;
