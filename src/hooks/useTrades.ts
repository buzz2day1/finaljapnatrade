import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Trade {
  id: string;
  user_id: string;
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

export const useTrades = (userId?: string) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrades = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (data && !error) {
      setTrades(data as Trade[]);
    }
    setLoading(false);
  }, [userId]);

  const createTrade = async (trade: {
    coin_symbol: string;
    coin_name: string;
    timeframe: number;
    direction: "up" | "down";
    amount: number;
    entry_price: number;
    return_rate: number;
  }) => {
    if (!userId) return { error: new Error("No user") };

    const { data, error } = await supabase
      .from("trades")
      .insert({
        user_id: userId,
        ...trade,
        result: "pending",
      })
      .select()
      .single();

    if (data && !error) {
      setTrades((prev) => [data as Trade, ...prev]);
    }

    return { data, error };
  };

  const closeTrade = async (
    tradeId: string,
    exitPrice: number,
    result: "win" | "loss",
    pnl: number
  ) => {
    const { error } = await supabase
      .from("trades")
      .update({
        exit_price: exitPrice,
        result,
        pnl,
        closed_at: new Date().toISOString(),
      })
      .eq("id", tradeId);

    if (!error) {
      setTrades((prev) =>
        prev.map((t) =>
          t.id === tradeId
            ? { ...t, exit_price: exitPrice, result, pnl, closed_at: new Date().toISOString() }
            : t
        )
      );
    }

    return { error };
  };

  const getStats = useCallback(() => {
    const completedTrades = trades.filter((t) => t.result !== "pending");
    const wins = completedTrades.filter((t) => t.result === "win");
    const losses = completedTrades.filter((t) => t.result === "loss");
    const totalPnl = completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const bestWin = Math.max(...wins.map((t) => t.pnl || 0), 0);

    return {
      totalTrades: completedTrades.length,
      wins: wins.length,
      losses: losses.length,
      winRate: completedTrades.length > 0 ? (wins.length / completedTrades.length) * 100 : 0,
      totalPnl,
      bestWin,
    };
  }, [trades]);

  return {
    trades,
    loading,
    fetchTrades,
    createTrade,
    closeTrade,
    getStats,
  };
};

export default useTrades;
